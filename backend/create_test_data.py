#!/usr/bin/env python
import os
import django
from django.utils import timezone
from datetime import timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.reminders.models import Reminder
from apps.infrastructure.models import Domain
from apps.projects.models import Project
from apps.notifications.models import Notification
from django.contrib.auth import get_user_model

print('\n' + '='*60)
print('CREATE TEST DATA FOR EMAIL NOTIFICATIONS')
print('='*60 + '\n')

# Get a user and project
User = get_user_model()
user = User.objects.first()
project = Project.objects.first()

if not user:
    print('❌ No user found in database')
    exit(1)

if not project:
    print('❌ No project found in database')
    exit(1)

print(f'Using user: {user.username} ({user.email})')
print(f'Using project: {project.name if hasattr(project, "name") else project.id}')

# Create a test reminder for TODAY (should create REMINDER_DUE notification)
print('\n📝 Creating test reminder for TODAY...')
reminder_today = Reminder.objects.create(
    user=user,
    title='🧪 TEST REMINDER - DUE TODAY',
    description='This is a test reminder that is due today',
    due_date=timezone.now().date(),
    type='general',
    is_completed=False
)
print(f'✅ Created reminder: {reminder_today.id}')

# Create a test domain expiring soon (should create DOMAIN_EXPIRING notification)
print('\n🌐 Creating test domain expiring in 15 days...')
domain_expiring = Domain.objects.create(
    project=project,
    domain_name='test-expiring-' + str(timezone.now().timestamp()).replace('.', ''),
    expiry_date=timezone.now().date() + timedelta(days=15),
)
print(f'✅ Created domain: {domain_expiring.id} - {domain_expiring.domain_name}')

# Wait a bit for signals to fire
import time
print('\n⏳ Waiting for signals and Celery tasks...')
time.sleep(2)

# Check notifications created
print('\n📊 Checking notifications created:')
today_notifs = Notification.objects.filter(created_at__gte=timezone.now() - timedelta(seconds=10))
print(f'Notifications created in last 10 seconds: {today_notifs.count()}')

for notif in today_notifs:
    status = '✅ SENT' if notif.email_sent else '⏳ PENDING'
    print(f'  {status} | {notif.title}')
    print(f'      Type: {notif.type}')

print('\n' + '='*60)
print('✅ TEST DATA CREATED')
print('='*60 + '\n')
