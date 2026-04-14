from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Notification
from .tasks import send_notification_email_task
from .utils import send_notification_email
import logging

logger = logging.getLogger(__name__)

EMAIL_ALERT_TYPES = [
    Notification.NotificationType.REMINDER_DUE,
    Notification.NotificationType.REMINDER_OVERDUE,
    Notification.NotificationType.DOMAIN_EXPIRING,
    Notification.NotificationType.DOMAIN_EXPIRED,
    Notification.NotificationType.INVOICE_DUE,
]

@receiver(post_save, sender=Notification)
def notification_post_save(sender, instance, created, **kwargs):
    logger.info(f"📩 [SIGNAL] Notification post_save fired for: {instance.title}")
    if created and not instance.email_sent:
        if instance.type in EMAIL_ALERT_TYPES:
            logger.info(f"📧 [SIGNAL] Sending email for Notification ID {instance.id}")
            try:
                # Call directly for synchronous execution
                # This ensures the email is sent immediately
                send_notification_email(instance.id)
                logger.info(f"✅ [SIGNAL] Email sent successfully")
            except Exception as e:
                logger.error(f"❌ [SIGNAL] Error sending email: {e}", exc_info=True)
        else:
            logger.info(f"⏭️  [SIGNAL] Notification type {instance.type} not in EMAIL_ALERT_TYPES, skipping email")
    elif instance.email_sent:
        logger.info(f"⏩ [SIGNAL] Email already sent for notification {instance.id}")
