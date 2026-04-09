from celery import shared_task
from django.utils import timezone
from .models import Domain
from apps.notifications.models import Notification
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)

@shared_task
def check_and_create_domain_notifications():
    today = timezone.now().date()
    
    # Expiring domains (within 30 days)
    domains_expiring = Domain.objects.filter(expiry_date__isnull=False, expiry_date__gt=today, expiry_date__lte=today + timedelta(days=30))
    for domain in domains_expiring:
        msg = f"[Domain ID: {domain.id}] Domain '{domain.domain_name}' is expiring on {domain.expiry_date}."
        if not Notification.objects.filter(module=Notification.ModuleChoices.DOMAIN, type=Notification.NotificationType.DOMAIN_EXPIRING, message=msg).exists():
            Notification.objects.create(
                title=f"Domain Expiring: {domain.domain_name}",
                message=msg,
                module=Notification.ModuleChoices.DOMAIN,
                type=Notification.NotificationType.DOMAIN_EXPIRING
            )

    # Expired domains
    domains_expired = Domain.objects.filter(expiry_date__isnull=False, expiry_date__lte=today)
    for domain in domains_expired:
        msg = f"[Domain ID: {domain.id}] Domain '{domain.domain_name}' has expired on {domain.expiry_date}."
        if not Notification.objects.filter(module=Notification.ModuleChoices.DOMAIN, type=Notification.NotificationType.DOMAIN_EXPIRED, message=msg).exists():
            Notification.objects.create(
                title=f"Domain Expired: {domain.domain_name}",
                message=msg,
                module=Notification.ModuleChoices.DOMAIN,
                type=Notification.NotificationType.DOMAIN_EXPIRED
            )

    logger.info("Checked and created domain notifications successfully.")
