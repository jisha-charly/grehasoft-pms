#!/usr/bin/env python
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.notifications.models import Notification
from apps.notifications.utils import send_notification_email

print('\n' + '='*70)
print('MANUALLY TESTING EMAIL SENDING - DIRECT FUNCTION CALL')
print('='*70 + '\n')

# Get a pending notification
pending = Notification.objects.filter(email_sent=False).first()

if not pending:
    print('❌ No pending notifications found!')
    exit(1)

print(f'Testing email send for notification:')
print(f'  ID: {pending.id}')
print(f'  Title: {pending.title}')
print(f'  Type: {pending.type}')
print()

print('Calling send_notification_email()...\n')
try:
    send_notification_email(pending.id)
    print('\n✅ Function completed without error')
    
    # Check if email was marked as sent
    pending.refresh_from_db()
    if pending.email_sent:
        print('✅ Notification marked as email_sent=True')
    else:
        print('❌ Notification still shows email_sent=False')
        
except Exception as e:
    print(f'\n❌ Error occurred: {type(e).__name__}')
    print(f'Message: {e}')
    import traceback
    traceback.print_exc()

print('\n' + '='*70)
print('CHECKING EMAIL SETTINGS')
print('='*70 + '\n')

from django.conf import settings
print(f'EMAIL_HOST: {settings.EMAIL_HOST}')
print(f'EMAIL_PORT: {settings.EMAIL_PORT}')
print(f'EMAIL_HOST_USER: {settings.EMAIL_HOST_USER}')
print(f'EMAIL_HOST_PASSWORD: {"*" * len(settings.EMAIL_HOST_PASSWORD) if settings.EMAIL_HOST_PASSWORD else "NOT SET"}')
print(f'DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}')

print('\n' + '='*70)
