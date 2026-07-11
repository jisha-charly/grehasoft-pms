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

print("--- STARTING INVOICE SECURE PDF TOKEN VERIFICATION ---")

# 1. Create a test invoice
invoice_data = {
    "client": test_client.id,
    "issue_date": str(datetime.date.today()),
    "due_date": str(datetime.date.today() + datetime.timedelta(days=15)),
    "tax": 10.00,
    "advance": 50.00,
    "notes": "Secure PDF Invoice",
    "items": [
        {"description": "Item 1", "quantity": 2, "rate": 100.00}
    ]
}
res_create = client.post("/api/v1/invoices/", invoice_data, format="json")
assert res_create.status_code == 201, "Fail: Invoice creation failed"
invoice_id = res_create.json()["id"]
print(f"Created Invoice ID: {invoice_id}")

# 2. Get secure-link (authenticated request)
res_link = client.get(f"/api/v1/invoices/{invoice_id}/secure-link/")
print("Secure-link Status (expected 200):", res_link.status_code)
assert res_link.status_code == 200, "Fail: secure-link request failed"
secure_pdf_link = res_link.json()["secure_pdf_link"]
print("Generated Link:", secure_pdf_link)

# Extract token from generated link
import urllib.parse
parsed_url = urllib.parse.urlparse(secure_pdf_link)
query_params = urllib.parse.parse_qs(parsed_url.query)
token = query_params["token"][0]
print("Extracted Token:", token)

# 3. Test token-based download (anonymous client)
anonymous_client = APIClient()
print("\n3. Testing anonymous download with valid token...")
download_url = f"/api/v1/invoices/{invoice_id}/download/?token={urllib.parse.quote(token)}"
res_download = anonymous_client.get(download_url)
print("Download Status (expected 200):", res_download.status_code)
assert res_download.status_code == 200, "Fail: Anonymous download with valid token failed"
assert res_download["Content-Type"] == "application/pdf", "Fail: Response not a PDF"

# 4. Test anonymous download with NO token
print("\n4. Testing anonymous download with NO token...")
res_no_token = anonymous_client.get(f"/api/v1/invoices/{invoice_id}/download/")
print("Status (expected 401):", res_no_token.status_code)
assert res_no_token.status_code == 401, "Fail: Anonymous download without token should return 401"

# 5. Test anonymous download with invalid token signature
print("\n5. Testing anonymous download with invalid token...")
res_invalid = anonymous_client.get(f"/api/v1/invoices/{invoice_id}/download/?token=invalid_token_signature")
print("Status (expected 403):", res_invalid.status_code)
assert res_invalid.status_code == 403, "Fail: Invalid token should return 403"
print("Detail message:", res_invalid.json())
assert res_invalid.json()["detail"] == "Invalid signature token.", "Fail: Incorrect error message"

# 6. Test anonymous download with expired token (simulated 3 days old)
print("\n6. Testing anonymous download with expired token...")
from django.core.signing import TimestampSigner
import time
signer = TimestampSigner()
# Create signature with a timestamp in the past (e.g. 3 days ago = 3 * 86400 = 259200 seconds ago)
past_time = time.time() - 259200
signer.key = signer.key # ensure key is set
# Sign manually using base64 encoded past time
# In django, timestamp is base62 encoded value
from django.utils.crypto import constant_time_compare
from django.utils.encoding import force_bytes
import base64
from django.core.signing import b62_encode

timestamp_b62 = b62_encode(int(past_time))
value_to_sign = f"{invoice_id}:{timestamp_b62}"
signature = signer.signature(value_to_sign)
expired_token = f"{value_to_sign}:{signature}"
print("Simulated Expired Token:", expired_token)

res_expired = anonymous_client.get(f"/api/v1/invoices/{invoice_id}/download/?token={urllib.parse.quote(expired_token)}")
print("Status (expected 403):", res_expired.status_code)
assert res_expired.status_code == 403, "Fail: Expired token should return 403"
print("Detail message:", res_expired.json())
assert res_expired.json()["detail"] == "This secure link has expired.", "Fail: Incorrect error message"

# 7. Test standard authenticated download (with NO token)
print("\n7. Testing standard authenticated download with NO token...")
res_auth = client.get(f"/api/v1/invoices/{invoice_id}/download/")
print("Status (expected 200):", res_auth.status_code)
assert res_auth.status_code == 200, "Fail: Standard authenticated download failed"
assert res_auth["Content-Type"] == "application/pdf"

print("\n--- ALL INVOICE SECURE PDF TOKEN TESTS PASSED SUCCESSFULLY ---")
