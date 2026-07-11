import os
import sys
import django
import datetime

sys.path.append(os.path.abspath("."))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from rest_framework.test import APIClient
from apps.users.models import User
from apps.projects.models import Client
from apps.invoices.models import Invoice

# Setup test user and client
admin_user = User.all_objects.filter(is_superuser=True).first()
if not admin_user:
    admin_user = User.objects.create_superuser("admin_test", "admin_test@test.com", "pass123")

test_client, _ = Client.objects.get_or_create(company_name="Test Invoicing Corp", defaults={
    "name": "Test Invoicing Client", "email": "client_inv@test.com", "phone": "+919876543210", "address": "Test Address"
})

# API Client
client = APIClient()
client.force_authenticate(user=admin_user)

print("--- STARTING WHATSAPP INTEGRATION BACKEND VERIFICATION ---")

# 1. Fetch invoice list
print("\n1. Querying invoices list endpoint...")
res_list = client.get("/api/v1/invoices/")
print("List Status (expected 200):", res_list.status_code)
assert res_list.status_code == 200, "Fail: List request failed"

results = res_list.json()["results"]
if len(results) > 0:
    first_invoice = results[0]
    print("\nFirst Invoice Keys in List Response:", list(first_invoice.keys()))
    assert "client_phone" in first_invoice, "Fail: client_phone missing from list response"
    assert "project_name" in first_invoice, "Fail: project_name missing from list response"
    print("client_phone value:", first_invoice["client_phone"])
    print("project_name value (expected None/null):", first_invoice["project_name"])
    assert first_invoice["project_name"] is None, "Fail: project_name should be None"

    # 2. Fetch invoice detail
    invoice_id = first_invoice["id"]
    print(f"\n2. Querying invoice detail endpoint for ID {invoice_id}...")
    res_detail = client.get(f"/api/v1/invoices/{invoice_id}/")
    print("Detail Status (expected 200):", res_detail.status_code)
    assert res_detail.status_code == 200, "Fail: Detail request failed"
    detail_invoice = res_detail.json()
    assert "client_phone" in detail_invoice, "Fail: client_phone missing from detail response"
    assert "project_name" in detail_invoice, "Fail: project_name missing from detail response"
    print("client_phone value in detail:", detail_invoice["client_phone"])
    print("project_name value in detail:", detail_invoice["project_name"])
else:
    print("\nNo invoices found in database to run detailed keys assertions. Let's create one first!")
    invoice_data = {
        "client": test_client.id,
        "issue_date": str(datetime.date.today()),
        "due_date": str(datetime.date.today() + datetime.timedelta(days=15)),
        "tax": 10.00,
        "advance": 50.00,
        "notes": "Original Notes",
        "items": [
            {"description": "Item 1", "quantity": 2, "rate": 100.00}
        ]
    }
    res_create = client.post("/api/v1/invoices/", invoice_data, format="json")
    assert res_create.status_code == 201, "Fail: Failed to create test invoice"
    created = res_create.json()
    
    assert "client_phone" in created, "Fail: client_phone missing from create response"
    assert "project_name" in created, "Fail: project_name missing from create response"
    print("client_phone value in created response:", created["client_phone"])
    print("project_name value in created response:", created["project_name"])
    assert created["project_name"] is None, "Fail: project_name should be None"

print("\n--- ALL WHATSAPP INTEGRATION BACKEND CHECKS PASSED ---")
