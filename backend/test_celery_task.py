#!/usr/bin/env python
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.notifications.models import Notification
from apps.notifications.tasks import send_notification_email_task

print('\n' + '='*70)
print('TESTING CELERY TASK - SENDING VIA QUEUE')
print('='*70 + '\n')

# Get a pending notification
pending = Notification.objects.filter(email_sent=False).first()

if not pending:
    print('❌ No pending notifications found!')
    exit(1)

print(f'Testing Celery task for notification ID: {pending.id}')
print(f'Title: {pending.title}')
print()

print('Queueing email task via send_notification_email_task.delay()...')
print('(This should send to Celery Worker)\n')

try:
    # Try to send via Celery task (queued)
    result = send_notification_email_task.delay(pending.id)
    print(f'✅ Task queued successfully!')
    print(f'Task ID: {result.id}')
    print(f'Task Status: {result.state}')
    print()
    
    # Wait a moment for Celery to process it
    import time
    print('⏳ Waiting 2 seconds for Celery Worker to process...')
    time.sleep(2)
    
    # Check if notification was updated
    pending.refresh_from_db()
    print(f'Notification email_sent status: {pending.email_sent}')
    if pending.email_sent:
        print('✅ Email was sent successfully!')
    else:
        print('⏳ Still pending (Celery might not have processed yet)')
    
except Exception as e:
    print(f'❌ Error: {type(e).__name__}: {e}')
    import traceback
    traceback.print_exc()

print('\n' + '='*70)
print('Tip: Check Celery Worker terminal for task execution logs!')
print('='*70 + '\n')
