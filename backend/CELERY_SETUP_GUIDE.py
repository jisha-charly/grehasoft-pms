"""
CELERY + EMAIL NOTIFICATION SYSTEM - SETUP & DEBUGGING GUIDE
==============================================================

This guide will help you get the email notification system working.

## PREREQUISITES

1. Redis server running on localhost:6379
2. Python virtual environment activated
3. All dependencies installed (celery, redis, django-celery-beat)
4. Gmail mailbox with 2FA enabled and App Password generated

## STEP 1: Configure Email Credentials

Create or update your .env file in the backend directory:

    # Email Configuration (Gmail with 2FA)
    EMAIL_HOST_USER=your-email@gmail.com
    EMAIL_HOST_PASSWORD=your-app-password-16-chars

### Get Gmail App Password:
    1. Go to https://myaccount.google.com/apppasswords
    2. Select "Mail" and "Windows Computer" (or your OS)
    3. Google will generate a 16-character password
    4. Use this password in .env file

## STEP 2: Start Redis Server

Open a PowerShell terminal:

    redis-server

Expected output:
    * The server is now ready to accept connections on port 6379

## STEP 3: Start Django Development Server

Open terminal and go to backend directory:

    cd backend
    .\venv\Scripts\Activate.ps1
    python manage.py runserver

Expected output:
    Starting development server at http://127.0.0.1:8000/

## STEP 4: Start Celery Worker

Open a NEW terminal:

    cd backend
    .\venv\Scripts\Activate.ps1
    celery -A config worker -l info

Expected output:
    [INFO/MainProcess] Connected to redis://localhost:6379/0
    [INFO/MainProcess] myst[app] Ready to accept tasks!

## STEP 5: Start Celery Beat

Open a NEW terminal:

    cd backend
    .\venv\Scripts\Activate.ps1
    celery -A config beat -l info

Expected output:
    [INFO/MainProcess] Scheduler: Sending due task send_daily_reminders
    [INFO/MainProcess] Scheduler: Sending due task send_domain_alerts

## STEP 6: Test the System

Run the test command:

    python manage.py test_notifications

This will:
    ✓ Check email configuration
    ✓ Check admin users with emails
    ✓ Check reminders due/overdue
    ✓ Check domains expiring/expired
    ✓ Run notification tasks manually
    ✓ Check notifications created

## STEP 7: Create Test Data (Optional)

If you don't have test reminders/domains, create them:

### Create test reminder:

    python manage.py shell
    >>> from apps.reminders.models import Reminder
    >>> from django.contrib.auth import get_user_model
    >>> from django.utils import timezone
    >>> 
    >>> User = get_user_model()
    >>> user = User.objects.first()
    >>> reminder = Reminder.objects.create(
    ...     user=user,
    ...     title="Test Reminder",
    ...     due_date=timezone.now().date()
    ... )
    >>> print(f"Created reminder: {reminder.id}")
    >>> exit()

### Create test domain:

    python manage.py shell
    >>> from apps.infrastructure.models import Domain
    >>> from apps.projects.models import Project
    >>> from django.utils import timezone
    >>> from datetime import timedelta
    >>> 
    >>> project = Project.objects.first()
    >>> domain = Domain.objects.create(
    ...     project=project,
    ...     domain_name="test-domain.com",
    ...     expiry_date=timezone.now().date() + timedelta(days=15)
    ... )
    >>> print(f"Created domain: {domain.id}")
    >>> exit()

## STEP 8: Monitor Email Sending

Watch the logs for:

### In Django terminal:
    ✅ [REMINDER TASK] Started
    📌 Reminders due today: X found
    ✅ [REMINDER TASK] Completed

### In Celery Worker terminal:
    🟢 [tasks.send_notification_email_task] Task accepted
    📧 [EMAIL TASK] Started: send_notification_email_task
    ✅ [EMAIL TASK] Email sent successfully

### In terminal or Django logs:
    🔵 [SIGNAL] Notification post_save fired for: <title>
    ✈️  [SIGNAL] Queuing email task for Notification ID <id>
    ✅ [EMAIL] Email sent successfully and marked as sent in DB

## TROUBLESHOOTING

### Issue 1: "Email credentials not set"
Solution:
    - Check .env file exists in backend directory
    - Verify EMAIL_HOST_USER and EMAIL_HOST_PASSWORD are not empty
    - Run: python manage.py test_notifications

### Issue 2: "Connection refused" on Redis
Solution:
    - Make sure Redis is running: redis-server
    - Check Redis is listening: redis-cli ping (should return PONG)

### Issue 3: "No admin email recipients found"
Solution:
    - Create a superuser: python manage.py createsuperuser
    - Or create a Role "SUPER_ADMIN" and assign it to users

### Issue 4: Tasks not executing
Solution:
    - Check Celery Worker is running (should say "Ready to accept tasks")
    - Check Celery Beat is running (should show "Scheduler" tasks)
    - Check task names are correct in settings.py CELERY_BEAT_SCHEDULE

### Issue 5: "SMTPAuthenticationError"
Solution:
    - Double-check app password (16 characters)
    - Try a different Gmail account
    - Enable "Less secure app access" if not using 2FA

### Issue 6: Emails sent but not received
Solution:
    - Check spam folder
    - Verify recipient email addresses
    - Check email logs: SELECT * FROM notifications_notification WHERE email_sent=1;

## LOGGING LEVELS

To increase debug output, edit the Celery commands:

    # More verbose
    celery -A config worker -l debug

    # Less verbose
    celery -A config worker -l warning

## COMMON COMMANDS

Monitor Celery tasks:
    pip install flower
    celery -A config events  (or use Flower: http://localhost:5555)

View Redis keys:
    redis-cli
    > KEYS *
    > FLUSHALL  (clear all)

Check current timezone:
    python manage.py shell
    >>> from django.utils import timezone
    >>> timezone.now()

View notification logs:
    python manage.py shell
    >>> from apps.notifications.models import Notification
    >>> Notification.objects.all().order_by('-created_at')[:10]

## FINAL CHECKLIST

Before declaring it "working":

    ☐ Redis running (PONG response)
    ☐ Django running on http://127.0.0.1:8000
    ☐ Celery Worker running ("Ready to accept tasks")
    ☐ Celery Beat running ("Scheduler" visible)
    ☐ .env has EMAIL_HOST_USER and EMAIL_HOST_PASSWORD
    ☐ Admin users exist with valid emails
    ☐ Test reminders/domains exist
    ☐ test_notifications command shows data
    ☐ Check notification database has new records
    ☐ Check email_sent = 1 in notifications table
    ☐ Receive test email in inbox

## EMAIL LOG EXAMPLE (Expected Output)

    🔵 [REMINDER TASK] Started: check_and_create_reminder_notifications
    📅 Today's date: 2026-04-13
    📌 Reminders due today: 1 found
    ✅ [REMINDER TASK] Completed successfully
    
    🔵 [SIGNAL] Notification post_save fired for: Reminder Due: Test Reminder
    ✈️  [SIGNAL] Queuing email task for Notification ID 5
    ✅ [SIGNAL] Email task queued successfully
    
    🔵 [EMAIL TASK] Started: send_notification_email_task for notification 5
    📧 [EMAIL] Starting email send for notification 5
    🔍 [EMAIL] Notification found: Reminder Due: Test Reminder
    🧑‍💼 [EMAIL] Found 1 admin users
    📬 [EMAIL] Recipients: ['admin@example.com']
    📋 [EMAIL] Email details:
        📧 From: Grehasoft PMS <noreply@grehasoft.com>
        📋 Subject: Alert: Reminder Due: Test Reminder
        🌐 Recipients: ['admin@example.com']
    📤 [EMAIL] Sending email via SMTP...
    ✅ [EMAIL] Email sent successfully and marked as sent in DB for notification 5

"""

SCHEDULE INFORMATION:
====================

Current Schedule (in settings.py):

1. send_daily_reminders:
   Task: apps.reminders.tasks.check_and_create_reminder_notifications
   Schedule: Every 5 minutes (*/5)
   Purpose: Check for reminders due today or overdue

2. send_domain_alerts:
   Task: apps.infrastructure.tasks.check_and_create_domain_notifications
   Schedule: Daily at 9:30 AM UTC
   Purpose: Check for domains expiring soon or already expired

When the tasks run:
   1. Task queries database for matching reminders/domains
   2. Creates Notification records
   3. Notification post_save signal triggers
   4. Email sending task is queued to Celery
   5. Celery worker picks up task and sends email
   6. Email marked as sent in database

"""