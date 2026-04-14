#!/usr/bin/env python
import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.notifications.models import Notification
from apps.reminders.tasks import check_and_create_reminder_notifications
from apps.infrastructure.tasks import check_and_create_domain_notifications

print('\n' + '='*60)
print('EMAIL NOTIFICATION SYSTEM - TEST')
print('='*60 + '\n')

print('📧 Running reminder task...')
try:
    result = check_and_create_reminder_notifications()
    print(f'✅ Reminder task completed')
    print(f'   Result: {result}')
except Exception as e:
    print(f'❌ Error in reminder task: {type(e).__name__}')
    print(f'   {e}')
    import traceback
    traceback.print_exc()

print('\n🌐 Running domain task...')
try:
    result = check_and_create_domain_notifications()
    print(f'✅ Domain task completed')
except Exception as e:
    print(f'❌ Error in domain task: {type(e).__name__}')
    print(f'   {e}')
    import traceback
    traceback.print_exc()

print('\n' + '-'*60)
print('📊 DATABASE CHECK:')
print('-'*60)

all_notifs = Notification.objects.count()
print(f'Total notifications in DB: {all_notifs}')

recent = Notification.objects.all().order_by('-created_at')[:10]
if recent:
    print('\nRecent notifications:')
    for notif in recent:
        status = '✅ SENT' if notif.email_sent else '⏳ PENDING'
        print(f'  {status} | {notif.title}')
        print(f'      Type: {notif.type} | Module: {notif.module}')
        print(f'      Created: {notif.created_at}')
else:
    print('No notifications found in database')

print('\n' + '='*60)
print('✅ TEST COMPLETE')
print('='*60 + '\n')
