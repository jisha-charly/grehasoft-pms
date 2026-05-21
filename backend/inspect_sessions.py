import os
import sys
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
django.setup()

from apps.tracking.models import WorkSession, AppActivity

print("Desktop Sessions:")
sessions = WorkSession.objects.filter(last_desktop_ping__isnull=False)
for s in sessions:
    print(f"ID: {s.id}, User: {s.user.username}, Active: {s.is_active_session}")
    print(f"  login_time: {s.login_time}, logout_time: {s.logout_time}")
    print(f"  productive_seconds: {s.productive_seconds}, idle_seconds: {s.idle_seconds}, tracked_seconds: {s.tracked_seconds}")
    print(f"  activity_percentage: {s.activity_percentage}%")
    print(f"  app_activities count: {s.app_activities.count()}")
