from datetime import timedelta
import base64
import hashlib

from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.projects.models import Project
from apps.reminders.models import Reminder


def _get_fernet() -> Fernet:
    """
    Derive a Fernet key from SECRET_KEY.
    """
    key = hashlib.sha256(settings.SECRET_KEY.encode()).digest()
    return Fernet(base64.urlsafe_b64encode(key))


class EncryptedTextField(models.TextField):
    """
    Symmetric encryption at rest.

    - Values are transparently decrypted when loaded from DB.
    - Plain strings can be assigned; will be encrypted on save.
    """

    def from_db_value(self, value, expression, connection):
        if value in (None, ""):
            return value
        try:
            f = _get_fernet()
            return f.decrypt(value.encode("utf-8")).decode("utf-8")
        except InvalidToken:
            # Already plain or corrupted; return as stored.
            return value

    def get_prep_value(self, value):
        value = super().get_prep_value(value)
        if value in (None, ""):
            return value
        f = _get_fernet()
        return f.encrypt(str(value).encode("utf-8")).decode("utf-8")


class Server(models.Model):
    name = models.CharField(max_length=255)
    provider = models.CharField(max_length=255, blank=True)
    owner = models.CharField(max_length=255, blank=True)
    server_ip = models.CharField(max_length=100, blank=True)
    ip_address = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"{self.name} ({self.provider})" if self.provider else self.name


class Domain(models.Model):
    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="domains"
    )
    domain_name = models.CharField(max_length=255)
    provider = models.CharField(max_length=255, blank=True)
    purchase_date = models.DateField(null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    renewal_cost = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    server = models.ForeignKey(
        Server, on_delete=models.SET_NULL, null=True, blank=True, related_name="domains"
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return self.domain_name

    def schedule_renewal_reminder(self, user):
        """
        Create a reminder 30 days before expiry_date using existing Reminder model.
        """
        if not self.expiry_date:
            return

        due_date = self.expiry_date - timedelta(days=30)
        if due_date <= timezone.now().date():
            # Already past; don't create.
            return

        Reminder.objects.create(
            user=user,
            title=f"Domain Renewal: {self.domain_name}",
            description=f"Renew domain {self.domain_name} before expiry.",
            due_date=due_date,
            type="general",
        )

    def is_expiring_soon(self) -> bool:
        """
        Returns True when expiry_date is within the next 30 days.
        """
        if not self.expiry_date:
            return False
        today = timezone.now().date()
        diff = (self.expiry_date - today).days
        return 0 <= diff <= 30


class WebsiteCredential(models.Model):
    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="credentials"
    )
    domain = models.ForeignKey(
        Domain, on_delete=models.CASCADE, related_name="credentials"
    )

    # Admin Access
    admin_url = models.URLField(max_length=500, blank=True)
    admin_username = models.CharField(max_length=255, blank=True)
    admin_password = EncryptedTextField(blank=True)

    # CPanel
    cpanel_url = models.URLField(max_length=500, blank=True)
    cpanel_username = models.CharField(max_length=255, blank=True)
    cpanel_password = EncryptedTextField(blank=True)

    # FTP
    ftp_host = models.CharField(max_length=255, blank=True)
    ftp_username = models.CharField(max_length=255, blank=True)
    ftp_password = EncryptedTextField(blank=True)

    # Email
    contact_form_email = models.EmailField(blank=True)
    client_email = models.EmailField(blank=True)
    client_email_password = EncryptedTextField(blank=True)

    # Other
    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"{self.domain.domain_name} credentials"