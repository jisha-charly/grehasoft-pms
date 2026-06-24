import os
import sys
import django
import json

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
django.setup()

from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory, force_authenticate
from apps.tracking.views import daily_report_view, reconciliation_report_view

User = get_user_model()
admin_user = User.objects.filter(is_staff=True).first()
if not admin_user:
    admin_user = User.objects.first()

factory = APIRequestFactory()

print("--- TESTING DAILY REPORT API ---")
request = factory.get('/api/v1/tracking/reports/daily/')
force_authenticate(request, user=admin_user)
response = daily_report_view(request)
print(f"Daily status: {response.status_code}")
if response.status_code == 200:
    data_daily = response.data
    if data_daily:
        print("Daily report keys (first item):")
        first_item = data_daily[0]
        keys = list(first_item.keys())
        print(json.dumps(keys[:14], indent=2))
        print("First item preview:")
        print(json.dumps({k: first_item[k] for k in keys[:14]}, indent=2))
    else:
        print("No daily report data available.")
else:
    print(response.data)

print("\n--- TESTING RECONCILIATION REPORT API ---")
request = factory.get('/api/v1/tracking/reports/reconciliation/')
force_authenticate(request, user=admin_user)
response = reconciliation_report_view(request)
print(f"Reconciliation status: {response.status_code}")
if response.status_code == 200:
    data_recon = response.data
    if data_recon:
        print("Reconciliation report keys (first item):")
        first_item = data_recon[0]
        keys = list(first_item.keys())
        print(json.dumps(keys[:14], indent=2))
        print("First item preview:")
        print(json.dumps({k: first_item[k] for k in keys[:14]}, indent=2))
    else:
        print("No reconciliation report data available.")
else:
    print(response.data)
