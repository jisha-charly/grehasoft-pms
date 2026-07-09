from celery import shared_task
from django.utils import timezone
from .models import Domain
from apps.notifications.models import Notification
from apps.users.models import User
from django.db.models import Q
from django.core.mail import send_mail
from django.conf import settings
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)

def send_domain_alert_email(domain, alert_type):
    """Send admin email for domain renewal alerts"""
    try:
        # Get admin users
        admin_emails = User.objects.filter(
            Q(role__name='SUPER_ADMIN') | Q(is_superuser=True)
        ).values_list('email', flat=True).distinct()
        
        admin_emails = [email for email in admin_emails if email]
        
        if not admin_emails:
            logger.warning(f"[WARNING] No admin emails found for domain alert")
            return False
        
        subject = f"Grehasoft PMS - Domain Alert ({alert_type})"
        message = f"""Grehasoft PMS Domain Alert

Alert Type: {alert_type}
Domain Name: {domain.domain_name}
Expiry Date: {domain.expiry_date}
Provider: {domain.provider if domain.provider else 'Not specified'}

Please login to Grehasoft PMS to renew the domain.
"""
        
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=list(admin_emails),
            fail_silently=False,
        )
        logger.info(f"[SUCCESS] Domain alert email sent for {domain.domain_name} to {len(admin_emails)} admins")
        return True
        
    except Exception as e:
        logger.error(f"[ERROR] Failed to send domain alert email: {type(e).__name__}: {str(e)}", exc_info=True)
        return False

@shared_task
def check_and_create_domain_notifications():
    logger.info("[DOMAIN TASK] Started: check_and_create_domain_notifications")
    today = timezone.now().date()
    logger.info(f"[DATE] Today's date: {today}")
    
    # Expiring domains (within 30 days)
    domains_expiring = Domain.objects.filter(expiry_date__isnull=False, expiry_date__gt=today, expiry_date__lte=today + timedelta(days=30))
    logger.info(f"[EXPIRING] Domains expiring soon: {domains_expiring.count()} found")
    for domain in domains_expiring:
        msg = f"[Domain ID: {domain.id}] Domain '{domain.domain_name}' is expiring on {domain.expiry_date}."
        if not Notification.objects.filter(module=Notification.ModuleChoices.DOMAIN, type=Notification.NotificationType.DOMAIN_EXPIRING, message=msg).exists():
            Notification.objects.create(
                title=f"Domain Expiring: {domain.domain_name}",
                message=msg,
                module=Notification.ModuleChoices.DOMAIN,
                type=Notification.NotificationType.DOMAIN_EXPIRING
            )
        
        # Send email alert for expiring domains
        logger.info(f"[EMAIL] Sending expiring domain alert for {domain.domain_name}")
        send_domain_alert_email(domain, "Expiring Soon")

    # Expired domains
    domains_expired = Domain.objects.filter(expiry_date__isnull=False, expiry_date__lte=today)
    logger.info(f"[EXPIRED] Expired domains: {domains_expired.count()} found")
    for domain in domains_expired:
        msg = f"[Domain ID: {domain.id}] Domain '{domain.domain_name}' has expired on {domain.expiry_date}."
        if not Notification.objects.filter(module=Notification.ModuleChoices.DOMAIN, type=Notification.NotificationType.DOMAIN_EXPIRED, message=msg).exists():
            Notification.objects.create(
                title=f"Domain Expired: {domain.domain_name}",
                message=msg,
                module=Notification.ModuleChoices.DOMAIN,
                type=Notification.NotificationType.DOMAIN_EXPIRED
            )
        
        # Send email alert for expired domains
        logger.info(f"[EMAIL] Sending expired domain alert for {domain.domain_name}")
        send_domain_alert_email(domain, "Expired")

    logger.info("[TASK] Domain task completed successfully")
