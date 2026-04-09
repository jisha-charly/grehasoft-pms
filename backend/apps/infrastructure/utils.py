import logging
from django.core.mail import send_mail
from django.conf import settings
from django.db.models import Q
from django.utils import timezone
from apps.users.models import User
from .models import Domain

logger = logging.getLogger(__name__)

def send_domain_alert(domain_id, alert_type):
    try:
        domain = Domain.objects.get(id=domain_id)
        
        admin_emails = User.objects.filter(
            Q(role__name='SUPER_ADMIN') | Q(is_superuser=True)
        ).values_list('email', flat=True).distinct()

        admin_emails = [email for email in admin_emails if email]

        if not admin_emails:
            logger.warning("No admin users found to send domain alerts.")
            return False

        if domain.expiry_date:
            days_left = (domain.expiry_date - timezone.now().date()).days
        else:
            days_left = "Unknown"

        subject = f"Domain Expiry Alert - {domain.domain_name}"
        message = f"""Grehasoft PMS Domain Expiry Alert

Alert Type: {alert_type}
Domain Name: {domain.domain_name}
Expiry Date: {domain.expiry_date}
Days Remaining: {days_left}

Please review the domain registration and proceed with renewal if necessary to prevent service interruption.
"""
        
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=list(admin_emails),
            fail_silently=False,
        )
        logger.info(f"Successfully sent {alert_type} domain alert for {domain.domain_name} to {len(admin_emails)} admins.")
        
        return True

    except Domain.DoesNotExist:
        logger.error(f"Domain with ID {domain_id} does not exist.")
        return False
    except Exception as e:
        logger.error(f"Error sending domain alert email: {str(e)}")
        return False
