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
from apps.invoices.models import Invoice, InvoiceItem

# Setup test user and client
admin_user = User.all_objects.filter(is_superuser=True).first()
if not admin_user:
    admin_user = User.objects.create_superuser("admin_test", "admin_test@test.com", "pass123")

test_client, _ = Client.objects.get_or_create(company_name="Test Invoicing Corp", defaults={
    "name": "Test Invoicing Client", "email": "client_inv@test.com", "phone": "123456", "address": "Test Address"
})

# API Client
client = APIClient()
client.force_authenticate(user=admin_user)

print("--- STARTING INVOICE EDIT WORKFLOW AUDIT VERIFICATION ---")

# 1. Create a fresh invoice
invoice_data = {
    "client": test_client.id,
    "issue_date": str(datetime.date.today()),
    "due_date": str(datetime.date.today() + datetime.timedelta(days=15)),
    "tax": 10.00,
    "advance": 50.00,
    "notes": "Original Notes",
    "items": [
        {"description": "Item 1", "quantity": 2, "rate": 100.00},
        {"description": "Item 2", "quantity": 1, "rate": 200.00}
    ]
}

print("\n1. Creating a new invoice...")
res_create = client.post("/api/v1/invoices/", invoice_data, format="json")
print("Create Status (expected 201):", res_create.status_code)
assert res_create.status_code == 201, "Fail: Invoice creation failed"
created_inv = res_create.json()
invoice_id = created_inv["id"]
original_invoice_number = created_inv["invoice_number"]
original_subtotal = float(created_inv["subtotal"])
original_total = float(created_inv["total"])
original_balance = float(created_inv["balance"])

print("Created Invoice ID:", invoice_id)
print("Created Invoice Number:", original_invoice_number)
print("Subtotal:", original_subtotal, "| Total:", original_total, "| Balance:", original_balance)

# Retrieve current item list and IDs
items_before = created_inv["items"]
assert len(items_before) == 2, "Fail: Expected 2 items"
item1_id = items_before[0]["id"]
item2_id = items_before[1]["id"]
print(f"Item 1 ID: {item1_id} | Item 2 ID: {item2_id}")

# 2. Edit the invoice:
# - Update Item 1 (change quantity to 3)
# - Remove Item 2
# - Add Item 3 (new item)
# - Edit notes
# - Keep invoice number the same
edit_payload = {
    "client": test_client.id,
    "issue_date": created_inv["issue_date"],
    "due_date": created_inv["due_date"],
    "tax": 18.00, # Updated tax
    "advance": 60.00, # Updated advance
    "notes": "Updated Notes",
    "items": [
        {"id": item1_id, "description": "Item 1 Updated", "quantity": 3, "rate": 100.00}, # modified
        {"description": "Item 3 New", "quantity": 2, "rate": 50.00} # new item
    ]
}

print("\n2. Updating the invoice (PUT)...")
res_update = client.put(f"/api/v1/invoices/{invoice_id}/", edit_payload, format="json")
print("Update Status (expected 200):", res_update.status_code)
assert res_update.status_code == 200, "Fail: Invoice update failed"

updated_inv = res_update.json()

# Assertions
print("\n3. Validating assertions...")
# A. Same Invoice record is updated
assert updated_inv["id"] == invoice_id, "Fail: Invoice ID changed!"
# B. Invoice number remains unchanged
assert updated_inv["invoice_number"] == original_invoice_number, "Fail: Invoice number changed!"
# C. Notes updated
assert updated_inv["notes"] == "Updated Notes", "Fail: Notes not updated"
# D. Item count is still 2
items_after = updated_inv["items"]
assert len(items_after) == 2, "Fail: Expected 2 items after update"

# E. Verify Item 1 was updated in-place (same ID, new quantity/description)
updated_item1 = [it for it in items_after if it["id"] == item1_id]
assert len(updated_item1) == 1, "Fail: Item 1 was deleted and recreated instead of updated"
assert updated_item1[0]["quantity"] == 3, "Fail: Item 1 quantity not updated"
assert updated_item1[0]["description"] == "Item 1 Updated", "Fail: Item 1 description not updated"

# F. Verify Item 2 was deleted
deleted_item2 = [it for it in items_after if it["id"] == item2_id]
assert len(deleted_item2) == 0, "Fail: Item 2 was not deleted"

# G. Verify Item 3 was created with a new ID
new_items = [it for it in items_after if it["id"] != item1_id]
assert len(new_items) == 1, "Fail: Item 3 not created"
print("New Item 3 ID:", new_items[0]["id"])
assert new_items[0]["description"] == "Item 3 New"

# H. Verify Recalculations:
# Subtotal should be: (3 * 100) + (2 * 50) = 300 + 100 = 400.00
# Tax is 18.00
# Total should be: 400.00 + 18.00 = 418.00
# Balance should be: 418.00 - 0 (no payments received yet on this invoice) = 418.00
# Wait! Let's check the balance formula from models.py:
# balance = total - total_paid
# total_paid = sum of payments. Since we have no payments, total_paid = 0, so balance = total.
expected_subtotal = 400.00
expected_total = 418.00
expected_balance = 418.00

print(f"Calculated Subtotal: {updated_inv['subtotal']} (Expected: {expected_subtotal})")
print(f"Calculated Total: {updated_inv['total']} (Expected: {expected_total})")
print(f"Calculated Balance: {updated_inv['balance']} (Expected: {expected_balance})")

assert float(updated_inv["subtotal"]) == expected_subtotal, "Fail: Subtotal recalculation incorrect"
assert float(updated_inv["total"]) == expected_total, "Fail: Total recalculation incorrect"
assert float(updated_inv["balance"]) == expected_balance, "Fail: Balance calculation incorrect"

# I. Double check that no duplicate Invoice was created in DB
assert Invoice.objects.filter(invoice_number=original_invoice_number).count() == 1, "Fail: Duplicate invoice created"

print("\n--- ALL BACKEND INVOICE EDIT TESTS PASSED SUCCESSFULLY ---")
