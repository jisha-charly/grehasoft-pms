import os
import sys

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Django setup
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()

from apps.tracking.models import WorkSession

def inspect():
    session = WorkSession.objects.filter(id=77).first()
    if session:
        print(f"=== WorkSession ID: {session.id} ===")
        print(f"User: {session.user.username}")
        print(f"login_time: {session.login_time}")
        print(f"last_ping: {session.last_ping}")
        print(f"last_desktop_ping: {session.last_desktop_ping}")
        print(f"productive_seconds: {session.productive_seconds}")
        print(f"idle_seconds: {session.idle_seconds}")
        print(f"tracked_seconds: {session.tracked_seconds}")
        print(f"activity_percentage: {session.activity_percentage}%")
        print(f"is_active_session: {session.is_active_session}")
        print(f"device_id: {session.device_id}")
    else:
        print("Session 77 not found")

if __name__ == '__main__':
    inspect()
