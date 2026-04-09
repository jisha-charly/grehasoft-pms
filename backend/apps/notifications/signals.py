from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Notification
from .tasks import send_notification_email_task

EMAIL_ALERT_TYPES = [
    Notification.NotificationType.REMINDER_DUE,
    Notification.NotificationType.REMINDER_OVERDUE,
    Notification.NotificationType.DOMAIN_EXPIRING,
    Notification.NotificationType.DOMAIN_EXPIRED,
    Notification.NotificationType.INVOICE_DUE,
]

@receiver(post_save, sender=Notification)
def notification_post_save(sender, instance, created, **kwargs):
    if created and not instance.email_sent:
        if instance.type in EMAIL_ALERT_TYPES:
            send_notification_email_task.delay(instance.id)
