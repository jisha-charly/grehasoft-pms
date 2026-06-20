import base64
import hashlib
from django.conf import settings
from cryptography.fernet import Fernet

def get_fernet():
    # Derive a 32-byte URL-safe base64 key from Django's SECRET_KEY
    key = base64.urlsafe_b64encode(hashlib.sha256(settings.SECRET_KEY.encode()).digest())
    return Fernet(key)

def encrypt_password(plain_text):
    if not plain_text:
        return ""
    f = get_fernet()
    return f.encrypt(plain_text.encode()).decode()

def decrypt_password(cipher_text):
    if not cipher_text:
        return ""
    f = get_fernet()
    try:
        return f.decrypt(cipher_text.encode()).decode()
    except Exception:
        return "Decryption Error"
