#!/usr/bin/env python
import os
import django
import time
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.notifications.models import Notification
from apps.reminders.tasks import check_and_create_reminder_notifications
from apps.infrastructure.tasks import check_and_create_domain_notifications

print('\n' + '='*70)
print('RUNNING NOTIFICATION CREATION TASKS ON NEW TEST DATA')
print('='*70 + '\n')

print('1️⃣  Running check_and_create_reminder_notifications...')
print('-' * 70)
result1 = check_and_create_reminder_notifications()
print(f'Result: {result1}')

print('\n2️⃣  Running check_and_create_domain_notifications...')
print('-' * 70)
result2 = check_and_create_domain_notifications()
print('Completed\n')

print('⏳ Waiting 3 seconds for email tasks to process in Celery Worker...')
time.sleep(3)

print('\n' + '='*70)
print('RECENT NOTIFICATIONS IN DATABASE')
print('='*70 + '\n')

recent = Notification.objects.all().order_by('-created_at')[:8]
if recent:
    print(f'Total notifications: {Notification.objects.count()}\n')
    for i, notif in enumerate(recent, 1):
        status = '✅ SENT' if notif.email_sent else '⏳ PENDING'
        print(f'{i}. [{status}] {notif.title}')
        print(f'   Type: {notif.type} | Module: {notif.module}')
        print(f'   Created: {notif.created_at}')
        print()

print('='*70)
print('✅ TEST COMPLETE')
print('='*70 + '\n')

# Check Celery Worker output to see if email tasks were processed
print('💡 Check Celery Worker terminal to see if email tasks were received and processed!\n')
