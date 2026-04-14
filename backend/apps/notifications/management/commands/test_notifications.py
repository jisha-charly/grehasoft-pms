"""
Management command to test the email notification system.
Usage: python manage.py test_notifications
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Test the email notification system'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('\n' + '=' * 70))
        self.stdout.write(self.style.WARNING('EMAIL NOTIFICATION SYSTEM - TEST'))
        self.stdout.write(self.style.WARNING('=' * 70 + '\n'))

        # Step 1: Check email settings
        self.stdout.write(self.style.HTTP_INFO('\n📧 STEP 1: Checking Email Configuration...'))
        self._check_email_settings()

        # Step 2: Check admin users
        self.stdout.write(self.style.HTTP_INFO('\n👥 STEP 2: Checking Admin Users...'))
        self._check_admin_users()

        # Step 3: Check reminders
        self.stdout.write(self.style.HTTP_INFO('\n📝 STEP 3: Checking Reminders...'))
        self._check_reminders()

        # Step 4: Check domains
        self.stdout.write(self.style.HTTP_INFO('\n🌐 STEP 4: Checking Domains...'))
        self._check_domains()

        # Step 5: Run notification tasks
        self.stdout.write(self.style.HTTP_INFO('\n⚡ STEP 5: Running Notification Tasks...'))
        self._run_notification_tasks()

        # Step 6: Check notifications created
        self.stdout.write(self.style.HTTP_INFO('\n🔍 STEP 6: Checking Notifications...'))
        self._check_notifications()

        self.stdout.write(self.style.SUCCESS('\n' + '=' * 70))
        self.stdout.write(self.style.SUCCESS('✅ TEST COMPLETE'))
        self.stdout.write(self.style.SUCCESS('=' * 70 + '\n'))

    def _check_email_settings(self):
        from django.conf import settings

        email_host = settings.EMAIL_HOST
        email_port = settings.EMAIL_PORT
        email_use_tls = settings.EMAIL_USE_TLS
        email_host_user = settings.EMAIL_HOST_USER
        email_host_password = settings.EMAIL_HOST_PASSWORD
        default_from_email = settings.DEFAULT_FROM_EMAIL

        self.stdout.write(f"  📨 EMAIL_HOST: {email_host}")
        self.stdout.write(f"  🔌 EMAIL_PORT: {email_port}")
        self.stdout.write(f"  🔐 EMAIL_USE_TLS: {email_use_tls}")
        self.stdout.write(f"  👤 EMAIL_HOST_USER: {email_host_user if email_host_user else '⚠️  NOT SET'}")
        self.stdout.write(f"  🔑 EMAIL_HOST_PASSWORD: {'✅ SET' if email_host_password else '❌ NOT SET'}")
        self.stdout.write(f"  📧 DEFAULT_FROM_EMAIL: {default_from_email}")

        if not email_host_user or not email_host_password:
            self.stdout.write(
                self.style.ERROR('  ❌ EMAIL CREDENTIALS NOT SET! Update .env file with EMAIL_HOST_USER and EMAIL_HOST_PASSWORD')
            )
        else:
            self.stdout.write(self.style.SUCCESS('  ✅ Email settings OK'))

    def _check_admin_users(self):
        from django.contrib.auth import get_user_model
        from django.db.models import Q

        User = get_user_model()
        admin_users = User.objects.filter(Q(role__name='SUPER_ADMIN') | Q(is_superuser=True))

        self.stdout.write(f"  Found {admin_users.count()} admin users:")
        for user in admin_users:
            status = '✅' if user.email else '❌'
            self.stdout.write(f"    {status} {user.username} ({user.email})")

        if not admin_users.exists():
            self.stdout.write(self.style.WARNING('  ⚠️  No admin users found!'))
        else:
            recipients = [u.email for u in admin_users if u.email]
            if recipients:
                self.stdout.write(self.style.SUCCESS(f'  ✅ Email will be sent to: {recipients}'))
            else:
                self.stdout.write(self.style.ERROR('  ❌ No admin emails found!'))

    def _check_reminders(self):
        from apps.reminders.models import Reminder

        today = timezone.now().date()
        reminders_today = Reminder.objects.filter(is_completed=False, due_date=today)
        reminders_overdue = Reminder.objects.filter(is_completed=False, due_date__lt=today)

        self.stdout.write(f"  📌 Reminders due TODAY: {reminders_today.count()}")
        for reminder in reminders_today[:5]:
            self.stdout.write(f"    - {reminder.title} ({reminder.due_date})")

        self.stdout.write(f"  ⚠️  Overdue reminders: {reminders_overdue.count()}")
        for reminder in reminders_overdue[:5]:
            self.stdout.write(f"    - {reminder.title} (Due: {reminder.due_date})")

    def _check_domains(self):
        from apps.infrastructure.models import Domain

        today = timezone.now().date()
        domains_expiring = Domain.objects.filter(
            expiry_date__isnull=False,
            expiry_date__gt=today,
            expiry_date__lte=today + timedelta(days=30)
        )
        domains_expired = Domain.objects.filter(expiry_date__isnull=False, expiry_date__lte=today)

        self.stdout.write(f"  🌐 Domains expiring soon (30 days): {domains_expiring.count()}")
        for domain in domains_expiring[:5]:
            days_left = (domain.expiry_date - today).days
            self.stdout.write(f"    - {domain.domain_name} (expires in {days_left} days)")

        self.stdout.write(f"  ❌ Expired domains: {domains_expired.count()}")
        for domain in domains_expired[:5]:
            self.stdout.write(f"    - {domain.domain_name} (expired on {domain.expiry_date})")

    def _run_notification_tasks(self):
        from apps.reminders.tasks import check_and_create_reminder_notifications
        from apps.infrastructure.tasks import check_and_create_domain_notifications

        self.stdout.write("  Running check_and_create_reminder_notifications...")
        try:
            result1 = check_and_create_reminder_notifications()
            self.stdout.write(self.style.SUCCESS(f"  ✅ Reminder task completed: {result1}"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"  ❌ Reminder task failed: {e}"))

        self.stdout.write("  Running check_and_create_domain_notifications...")
        try:
            result2 = check_and_create_domain_notifications()
            self.stdout.write(self.style.SUCCESS(f"  ✅ Domain task completed"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"  ❌ Domain task failed: {e}"))

    def _check_notifications(self):
        from apps.notifications.models import Notification

        notifications = Notification.objects.all().order_by('-created_at')[:10]

        self.stdout.write(f"  Total notifications: {Notification.objects.count()}")
        self.stdout.write(f"  Recent notifications:")
        for notif in notifications:
            sent_status = '✅ Sent' if notif.email_sent else '⏳ Pending'
            self.stdout.write(
                f"    [{notif.module}] {notif.title} - {notif.type} ({sent_status})"
            )
