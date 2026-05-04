"""
Django Management Command for Testing Tracking System

File: backend/apps/tracking/management/commands/test_tracking.py

Usage:
    python manage.py test_tracking
    python manage.py test_tracking --user=1
    python manage.py test_tracking --create-sessions=10
"""

from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
import random

from apps.tracking.models import UserProfile, WorkSession
from apps.tracking.utils import (
    get_or_create_user_profile,
    calculate_daily_working_time,
    format_duration,
    get_employee_status,
    toggle_tracking,
    auto_logout_inactive_users,
)


class Command(BaseCommand):
    help = 'Test tracking system functionality'

    def add_arguments(self, parser):
        parser.add_argument(
            '--user',
            type=int,
            help='Test specific user ID'
        )
        parser.add_argument(
            '--create-sessions',
            type=int,
            default=0,
            help='Create test sessions for today'
        )
        parser.add_argument(
            '--enable-tracking',
            action='store_true',
            help='Enable tracking for all users'
        )
        parser.add_argument(
            '--disable-tracking',
            action='store_true',
            help='Disable tracking for all users'
        )
        parser.add_argument(
            '--auto-logout',
            action='store_true',
            help='Test auto-logout mechanism'
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('=== Work Tracking System Test ==='))

        if options['user']:
            self.test_user(options['user'])
        elif options['enable_tracking']:
            self.enable_all_tracking()
        elif options['disable_tracking']:
            self.disable_all_tracking()
        elif options['create_sessions']:
            self.create_test_sessions(options['create_sessions'])
        elif options['auto_logout']:
            self.test_auto_logout()
        else:
            self.run_all_tests()

    def test_user(self, user_id):
        """Test tracking for specific user."""
        self.stdout.write(f'\nTesting user ID: {user_id}')
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise CommandError(f'User with ID {user_id} not found')

        # Get profile
        profile = get_or_create_user_profile(user)
        self.stdout.write(f'Username: {user.username}')
        self.stdout.write(f'Tracking Enabled: {profile.is_tracking_enabled}')

        # Get status
        status = get_employee_status(user)
        self.stdout.write(f'Status: {status["status"]}')
        self.stdout.write(f'Daily Work Time: {status["total_work_time"]}')

        # Show sessions
        sessions = WorkSession.objects.filter(user=user).order_by('-login_time')[:5]
        self.stdout.write(f'\nRecent Sessions: {len(sessions)}')
        for session in sessions:
            status_str = 'Active' if session.is_active_session else 'Closed'
            duration = format_duration(session.calculate_duration())
            self.stdout.write(
                f'  - {session.login_time.strftime("%Y-%m-%d %H:%M:%S")} '
                f'to {session.logout_time.strftime("%H:%M:%S") if session.logout_time else "--:--:--"} '
                f'({duration}) [{status_str}]'
            )

    def enable_all_tracking(self):
        """Enable tracking for all users."""
        self.stdout.write('\nEnabling tracking for all users...')
        
        count = 0
        for user in User.objects.filter(is_active=True):
            profile = toggle_tracking(user, enable=True)
            count += 1
        
        self.stdout.write(self.style.SUCCESS(f'Enabled tracking for {count} users'))

    def disable_all_tracking(self):
        """Disable tracking for all users."""
        self.stdout.write('\nDisabling tracking for all users...')
        
        count = 0
        for user in User.objects.filter(is_active=True):
            profile = toggle_tracking(user, enable=False)
            count += 1
        
        self.stdout.write(self.style.SUCCESS(f'Disabled tracking for {count} users'))

    def create_test_sessions(self, count):
        """Create test sessions for today."""
        self.stdout.write(f'\nCreating {count} test sessions...')
        
        users = User.objects.filter(is_active=True)[:10]
        
        if not users:
            raise CommandError('No active users found')

        today = timezone.now().date()
        created = 0

        for user in users:
            for i in range(count // len(users)):
                # Random start time today
                hours_ago = random.randint(1, 8)
                minutes_ago = random.randint(0, 59)
                
                login_time = timezone.now() - timedelta(hours=hours_ago, minutes=minutes_ago)
                
                # Random session duration
                duration = random.randint(30, 480)  # 30 min to 8 hours
                logout_time = login_time + timedelta(minutes=duration)
                
                session = WorkSession.objects.create(
                    user=user,
                    login_time=login_time,
                    logout_time=logout_time,
                    is_active_session=False,
                )
                created += 1

        self.stdout.write(self.style.SUCCESS(f'Created {created} test sessions'))

        # Show summary
        self.show_daily_summary()

    def test_auto_logout(self):
        """Test auto-logout mechanism."""
        self.stdout.write('\nTesting auto-logout...')
        
        # Create an inactive session
        user = User.objects.filter(is_active=True).first()
        if not user:
            raise CommandError('No active users found')

        now = timezone.now()
        inactive_session = WorkSession.objects.create(
            user=user,
            login_time=now - timedelta(minutes=20),
            last_ping=now - timedelta(minutes=20),
            is_active_session=True
        )
        
        self.stdout.write(f'Created inactive session: {inactive_session.id}')
        self.stdout.write(f'Last ping: {inactive_session.last_ping}')

        # Run auto-logout with 15 minute timeout
        self.stdout.write('\nRunning auto-logout...')
        count = auto_logout_inactive_users(timeout_minutes=15)

        # Check result
        inactive_session.refresh_from_db()
        self.stdout.write(f'Sessions closed: {count}')
        self.stdout.write(f'Session {inactive_session.id} is_active: {inactive_session.is_active_session}')
        self.stdout.write(f'Session {inactive_session.id} logout_time: {inactive_session.logout_time}')

        if not inactive_session.is_active_session:
            self.stdout.write(self.style.SUCCESS('✓ Auto-logout working correctly'))
        else:
            self.stdout.write(self.style.ERROR('✗ Auto-logout failed'))

    def run_all_tests(self):
        """Run all tests."""
        self.stdout.write('\n1. DATABASE STATUS')
        self.show_database_status()

        self.stdout.write('\n2. USER PROFILES')
        self.show_user_profiles()

        self.stdout.write('\n3. ACTIVE SESSIONS')
        self.show_active_sessions()

        self.stdout.write('\n4. DAILY SUMMARY')
        self.show_daily_summary()

    def show_database_status(self):
        """Show database status."""
        user_count = User.objects.filter(is_active=True).count()
        profile_count = UserProfile.objects.count()
        session_count = WorkSession.objects.count()
        active_session_count = WorkSession.objects.filter(is_active_session=True).count()

        self.stdout.write(f'Active Users: {user_count}')
        self.stdout.write(f'User Profiles: {profile_count}')
        self.stdout.write(f'Total Sessions: {session_count}')
        self.stdout.write(f'Active Sessions: {active_session_count}')

    def show_user_profiles(self):
        """Show user profiles."""
        profiles = UserProfile.objects.filter(user__is_active=True)[:5]
        
        self.stdout.write(f'Showing first 5 users:')
        for profile in profiles:
            status = 'Enabled' if profile.is_tracking_enabled else 'Disabled'
            self.stdout.write(f'  - {profile.user.username}: {status}')

    def show_active_sessions(self):
        """Show active sessions."""
        sessions = WorkSession.objects.filter(is_active_session=True)[:5]
        
        self.stdout.write(f'Active Sessions: {len(sessions)}')
        for session in sessions:
            time_since_ping = timezone.now() - session.last_ping
            minutes = int(time_since_ping.total_seconds() / 60)
            status = session.get_status()
            self.stdout.write(
                f'  - {session.user.username}: {status} ({minutes}m ago)'
            )

    def show_daily_summary(self):
        """Show daily work time summary."""
        self.stdout.write(f'\nDaily Work Time Summary:')
        
        users = User.objects.filter(
            is_active=True,
            worksession__login_time__date=timezone.now().date()
        ).distinct()[:5]

        for user in users:
            total_time = calculate_daily_working_time(user)
            formatted = format_duration(total_time)
            self.stdout.write(f'  - {user.username}: {formatted}')
