import os
import sys

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Django setup
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()

from apps.tracking.models import AppActivity

def inspect():
    activities = AppActivity.objects.filter(session_id=77).order_by('timestamp')
    print(f"=== App Activities for Session 77 (Count: {activities.count()}) ===")
    for act in activities:
        print(f"- Time: {act.timestamp}")
        print(f"  App: '{act.app_name}' | Title: '{act.window_title}'")
        print(f"  Duration: {act.duration_seconds}s | Productive: {act.productive_seconds}s")
        print(f"  Mouse: {act.mouse_moves} | Keys: {act.key_presses} | Clicks: {act.clicks}")
        print(f"  Is Productive App: {act.is_productive}")
        print("-" * 40)

if __name__ == '__main__':
    inspect()
