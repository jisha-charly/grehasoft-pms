import urllib.parse
from django.core.signing import TimestampSigner, SignatureExpired
from django.conf import settings

def generate_secure_pdf_link(obj_id, path_prefix):
    signer = TimestampSigner()
    token = signer.sign(str(obj_id))
    token_encoded = urllib.parse.quote(token)
    site_url = getattr(settings, 'SITE_URL', 'http://127.0.0.1:8000').rstrip('/')
    return f"{site_url}{path_prefix}?token={token_encoded}"

def validate_secure_token(obj_id, token_str, max_age=172800):
    """
    Validates the token signature and expiration.
    Returns (is_valid, error_message)
    """
    if not token_str:
        return False, "Token is required."
    signer = TimestampSigner()
    try:
        unsigned_id = signer.unsign(token_str, max_age=max_age)
        if int(unsigned_id) == int(obj_id):
            return True, None
        return False, "Invalid signature token."
    except SignatureExpired:
        return False, "This secure link has expired."
    except Exception:
        return False, "Invalid signature token."
