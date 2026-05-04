#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.tracking.models import UserProfile

User = get_user_model()

# Create or get test user
test_user, created = User.objects.get_or_create(
    username='testuser',
    defaults={
        'email': 'test@example.com',
        'first_name': 'Test',
        'last_name': 'User',
        'is_staff': False,
        'is_superuser': False,
    }
)

if created:
    test_user.set_password('Test@12345')
    test_user.save()
    print(f'✅ Created new user: testuser')
else:
    # Update password for existing user
    test_user.set_password('Test@12345')
    test_user.save()
    print(f'✅ Updated existing user: testuser')

# Ensure UserProfile exists
profile, _ = UserProfile.objects.get_or_create(user=test_user, defaults={'is_tracking_enabled': True})
print(f'✅ User Profile: {profile.is_tracking_enabled}')
print(f'✅ Credentials: username=testuser, password=Test@12345')
