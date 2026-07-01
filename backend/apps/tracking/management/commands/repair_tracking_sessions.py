from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction
from django.contrib.auth import get_user_model
# pyrefly: ignore [missing-import]
from apps.tracking.models import WorkSession

User = get_user_model()

class Command(BaseCommand):
    help = "Repair work tracker session data, resolve overlapping active sessions, and validate tracking times."

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Run the repair command without committing database changes',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        self.stdout.write(self.style.WARNING("=== WORK TRACKER SESSION REPAIR UTILITY ==="))
        if dry_run:
            self.stdout.write(self.style.NOTICE("[DRY RUN ACTIVE] No changes will be committed to the database.\n"))
        else:
            self.stdout.write(self.style.NOTICE("=== IMPORTANT BACKUP RECOMMENDATION ==="))
            self.stdout.write("Please ensure you have performed a complete database backup before running this tool in production.")
            self.stdout.write("Example: mysqldump -u <user> -p <db_name> > tracking_backup.sql")
            self.stdout.write("=======================================\n")
            
        total_scanned = 0
        total_repaired = 0
        total_overlapping_resolved = 0
        invalid_percentages_corrected = 0
        affected_users = set()
        
        try:
            with transaction.atomic():
                # 1. Close overlapping active sessions first
                users = User.objects.filter(is_active=True)
                for user in users:
                    active_sess = list(WorkSession.objects.filter(
                        user=user,
                        is_active_session=True
                    ).order_by('-last_ping', '-login_time'))
                    
                    if len(active_sess) > 1:
                        primary_session = active_sess[0]
                        duplicate_sessions = active_sess[1:]
                        
                        self.stdout.write(self.style.WARNING(
                            f"User '{user.username}' has {len(active_sess)} active sessions. "
                            f"Keeping primary session ID {primary_session.id} active, closing {len(duplicate_sessions)} duplicate active session(s)."
                        ))
                        
                        for session in duplicate_sessions:
                            session.is_active_session = False
                            session.logout_time = session.last_ping or session.login_time or timezone.now()
                            session.total_duration = session.calculate_duration()
                            
                            elapsed = int(session.total_duration.total_seconds())
                            elapsed = max(0, elapsed)
                            
                            if session.device_id == 'default':
                                session.productive_seconds = 0
                                session.idle_seconds = 0
                                session.tracked_seconds = 0
                                session.activity_percentage = 0.0
                            else:
                                session.productive_seconds = max(0, session.productive_seconds)
                                session.idle_seconds = max(0, session.idle_seconds)
                                
                                if session.productive_seconds + session.idle_seconds > elapsed:
                                    if session.productive_seconds > elapsed:
                                        session.productive_seconds = elapsed
                                        session.idle_seconds = 0
                                    else:
                                        session.idle_seconds = elapsed - session.productive_seconds
                                
                                session.tracked_seconds = session.productive_seconds + session.idle_seconds
                                if session.tracked_seconds > 0:
                                    session.activity_percentage = min(100.0, max(0.0, (session.productive_seconds / session.tracked_seconds) * 100.0))
                                else:
                                    session.activity_percentage = 0.0
                                
                            if not dry_run:
                                session.save(update_fields=[
                                    'is_active_session', 'logout_time', 'total_duration',
                                    'productive_seconds', 'idle_seconds', 'tracked_seconds', 'activity_percentage', 'updated_at'
                                ])
                                
                            total_overlapping_resolved += 1
                            total_repaired += 1
                            affected_users.add(user.id)
                
                # 2. Scan and repair all sessions (active and closed)
                sessions = WorkSession.objects.all().select_related('user')
                for session in sessions:
                    total_scanned += 1
                    
                    last_active = session.logout_time or session.last_ping or timezone.now()
                    elapsed = int((last_active - session.login_time).total_seconds())
                    elapsed = max(0, elapsed)
                    
                    original_prod = session.productive_seconds
                    original_idle = session.idle_seconds
                    original_tracked = session.tracked_seconds
                    original_percentage = session.activity_percentage
                    
                    if session.device_id == 'default':
                        repaired_prod = 0
                        repaired_idle = 0
                        repaired_tracked = 0
                        repaired_percentage = 0.0
                    else:
                        repaired_prod = max(0, original_prod)
                        repaired_idle = max(0, original_idle)
                        
                        if repaired_prod + repaired_idle > elapsed:
                            if repaired_prod > elapsed:
                                repaired_prod = elapsed
                                repaired_idle = 0
                            else:
                                repaired_idle = elapsed - repaired_prod
                                
                        repaired_tracked = repaired_prod + repaired_idle
                        
                        if repaired_tracked > 0:
                            repaired_percentage = min(100.0, max(0.0, (repaired_prod / repaired_tracked) * 100.0))
                        else:
                            repaired_percentage = 0.0
                        
                    changed = (
                        original_prod != repaired_prod or
                        original_idle != repaired_idle or
                        original_tracked != repaired_tracked or
                        abs(original_percentage - repaired_percentage) > 0.01
                    )
                    
                    if changed:
                        percentage_corrected = abs(original_percentage - repaired_percentage) > 0.01
                        
                        session.productive_seconds = repaired_prod
                        session.idle_seconds = repaired_idle
                        session.tracked_seconds = repaired_tracked
                        session.activity_percentage = repaired_percentage
                        
                        if percentage_corrected:
                            invalid_percentages_corrected += 1
                            
                        if not dry_run:
                            session.save(update_fields=[
                                'productive_seconds', 'idle_seconds', 'tracked_seconds', 'activity_percentage', 'updated_at'
                            ])
                            
                        total_repaired += 1
                        affected_users.add(session.user_id)
                        
                if dry_run:
                    raise transaction.TransactionManagementError("Dry run rollback")
                    
        except transaction.TransactionManagementError:
            self.stdout.write(self.style.NOTICE("\nDry run database changes rolled back successfully."))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"\nError occurred during repair execution: {str(e)}"))
            raise e
            
        self.stdout.write(self.style.SUCCESS("\n=== REPAIR SUMMARY REPORT ==="))
        self.stdout.write(f"Total Sessions Scanned:        {total_scanned}")
        self.stdout.write(f"Total Sessions Repaired:       {total_repaired}")
        self.stdout.write(f"Total Overlapping Resolved:    {total_overlapping_resolved}")
        self.stdout.write(f"Activity Percentages Fixed:    {invalid_percentages_corrected}")
        self.stdout.write(f"Total Users Affected:          {len(affected_users)}")
        self.stdout.write(self.style.SUCCESS("=============================="))
