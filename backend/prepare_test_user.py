import os
import sys

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Django setup
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()

from django.contrib.auth import get_user_model
from apps.tracking.models import UserProfile, WorkSession
from apps.tracking.utils import get_or_create_user_profile

User = get_user_model()

def prepare():
    # Find or create user with ID 7 or username 'Jisha'
    user = User.objects.filter(id=7).first()
    if not user:
        user = User.objects.filter(username__iexact='jisha').first()
    
    if user:
        print(f"Found existing user: {user.username} (ID: {user.id})")
        user.username = 'Jisha'
        user.email = 'jisha@gmail.com'
        user.set_password('password123')
        user.save()
        print(f"Updated user to Jisha with password 'password123'")
    else:
        user = User.objects.create_user(
            id=7,
            username='Jisha',
            email='jisha@gmail.com',
            password='password123'
        )
        print(f"Created new user Jisha (ID: {user.id}) with password 'password123'")
    
    # Ensure tracking profile is enabled
    profile = get_or_create_user_profile(user)
    profile.is_tracking_enabled = True
    profile.save()
    print(f"Enabled tracking profile for Jisha: is_tracking_enabled={profile.is_tracking_enabled}")

if __name__ == '__main__':
    prepare()
