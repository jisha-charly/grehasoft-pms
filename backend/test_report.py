import os
import sys
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
django.setup()

from django.utils import timezone
from apps.tracking.reports import get_daily_report_data
import datetime

today = timezone.now().date()
yesterday = today - datetime.timedelta(days=1)

print("Today:")
data = get_daily_report_data(today, today)
for row in data:
    print(f"User: {row['username']}, Date: {row['date']}")
    print(f"  total_tracked_time: {row['total_tracked_time']}, productive_time: {row['productive_time']}, idle_time: {row['idle_time']}, activity_percentage: {row['activity_percentage']}")
    print(f"  raw_tracked: {row['raw_tracked_seconds']}, raw_productive: {row['raw_productive_seconds']}, raw_idle: {row['raw_idle_seconds']}")

print("\nYesterday:")
data = get_daily_report_data(yesterday, yesterday)
for row in data:
    print(f"User: {row['username']}, Date: {row['date']}")
    print(f"  total_tracked_time: {row['total_tracked_time']}, productive_time: {row['productive_time']}, idle_time: {row['idle_time']}, activity_percentage: {row['activity_percentage']}")
    print(f"  raw_tracked: {row['raw_tracked_seconds']}, raw_productive: {row['raw_productive_seconds']}, raw_idle: {row['raw_idle_seconds']}")
