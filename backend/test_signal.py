#!/usr/bin/env python
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

import logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

from django.db.models.signals import post_save
from apps.notifications.models import Notification
from apps.notifications.signals import notification_post_save

print('\n' + '='*70)
print('TESTING SIGNAL FIRING')
print('='*70 + '\n')

# Verify signal is connected
print('1️⃣  Checking if signal is connected...')
receivers = post_save.receivers
print(f'post_save signal receivers: {len(receivers)}')
for receiver in receivers:
    print(f'  - {receiver[1]()}')

print()
print('2️⃣  Creating a test notification to trigger signal...')
print()

# Create a new notification
notif = Notification.objects.create(
    title='🧪 Signal Test Notification',
    message='Testing if signal fires',
    module=Notification.ModuleChoices.REMINDER,
    type=Notification.NotificationType.REMINDER_DUE,
    email_sent=False
)

print(f'✅ Notification created: ID {notif.id}')
print()

# Check if email_sent was updated
notif.refresh_from_db()
print(f'After signal should fire:')
print(f'  email_sent: {notif.email_sent}')
print()

if notif.email_sent:
    print('✅ Signal FIRED and email was sent!')
else:
    print('❌ Signal did NOT fire or email was not sent')

print('\n' + '='*70)
