import os
import sys

# Django setup
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()

from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from apps.proposals.models import Proposal
from apps.proposals.serializers import ProposalSerializer
from django.core.signing import TimestampSigner

def run_verification():
    User = get_user_model()
    proposal = Proposal.objects.first()
    if not proposal:
        print("FAIL: No proposals found in the database to test.")
        sys.exit(1)
        
    print(f"Verifying Proposal PDF workflow for proposal ID {proposal.id} ('{proposal.title}')...")

    # 1. Test serializer secure_pdf_link exposure
    serializer = ProposalSerializer(proposal)
    link = serializer.data.get("secure_pdf_link")
    print(f"Exposed secure_pdf_link: {link}")
    if not link or "token=" not in link:
        print("FAIL: secure_pdf_link is missing or does not contain a token.")
        sys.exit(1)

    # Extract token
    token = link.split("token=")[1]

    client = APIClient()

    # 2. Test token-based anonymous download (Should succeed with 200 OK)
    url = f"/api/v1/proposals/{proposal.id}/download_pdf/?token={token}"
    res = client.get(url)
    print(f"Anonymous token-based GET request: status_code = {res.status_code}")
    if res.status_code != 200:
        print(f"FAIL: Expected 200 OK, got {res.status_code}")
        sys.exit(1)
    if res.headers.get("Content-Type") != "application/pdf":
        print(f"FAIL: Expected content-type 'application/pdf', got '{res.headers.get('Content-Type')}'")
        sys.exit(1)

    # 3. Test anonymous download without token (Should fail with 401 Not Authenticated)
    url_no_token = f"/api/v1/proposals/{proposal.id}/download_pdf/"
    res_no_token = client.get(url_no_token)
    print(f"Anonymous GET request without token: status_code = {res_no_token.status_code}")
    if res_no_token.status_code != 401:
        print(f"FAIL: Expected 401 Unauthorized, got {res_no_token.status_code}")
        sys.exit(1)

    # 4. Test invalid token signature (Should return exactly 403 Forbidden with message)
    url_bad_token = f"/api/v1/proposals/{proposal.id}/download_pdf/?token={token}invalid"
    res_bad_token = client.get(url_bad_token)
    print(f"GET request with invalid token signature: status_code = {res_bad_token.status_code}")
    if res_bad_token.status_code != 403:
        print(f"FAIL: Expected 403 Forbidden for bad token signature, got {res_bad_token.status_code}")
        sys.exit(1)
    if "Invalid signature token." not in str(res_bad_token.data):
        print(f"FAIL: Expected message 'Invalid signature token.', got {res_bad_token.data}")
        sys.exit(1)

    # 5. Test expired token validation (Should return exactly 403 Forbidden with expired message)
    import unittest.mock as mock
    import time
    past_timestamp = time.time() - (3 * 24 * 60 * 60)
    signer = TimestampSigner()
    with mock.patch('time.time', return_value=past_timestamp):
        expired_token = signer.sign(str(proposal.id))
    url_expired = f"/api/v1/proposals/{proposal.id}/download_pdf/?token={expired_token}"
    res_expired = client.get(url_expired)
    print(f"GET request with expired token (3 days old): status_code = {res_expired.status_code}")
    if res_expired.status_code != 403:
        print(f"FAIL: Expected 403 Forbidden for expired token, got {res_expired.status_code}")
        sys.exit(1)
    if "This secure link has expired." not in str(res_expired.data):
        print(f"FAIL: Expected message 'This secure link has expired.', got {res_expired.data}")
        sys.exit(1)

    # 6. Test valid authenticated user access (without token)
    superuser = User.objects.filter(is_superuser=True).first()
    if superuser:
        client.force_authenticate(user=superuser)
        res_auth = client.get(url_no_token)
        print(f"Superuser authenticated GET request (no token): status_code = {res_auth.status_code}")
        if res_auth.status_code != 200:
            print(f"FAIL: Expected 200 OK, got {res_auth.status_code}")
            sys.exit(1)
            
    # 7. Test invalid proposal ID (Should return 404 Not Found)
    url_invalid_id = f"/api/v1/proposals/99999/download_pdf/?token={token}"
    res_invalid_id = client.get(url_invalid_id)
    print(f"GET request with invalid proposal ID: status_code = {res_invalid_id.status_code}")
    if res_invalid_id.status_code != 404:
        print(f"FAIL: Expected 404 Not Found, got {res_invalid_id.status_code}")
        sys.exit(1)

    print("ALL TESTS PASSED SUCCESSFULLY! The Proposal PDF workflow is fully verified.")

if __name__ == '__main__':
    run_verification()
