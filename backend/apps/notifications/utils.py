import logging
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db.models import Q

logger = logging.getLogger(__name__)

def send_notification_email(notification_id):
    from .models import Notification
    try:
        notification = Notification.objects.get(id=notification_id)
    except Notification.DoesNotExist:
        logger.error(f"Notification with id {notification_id} does not exist.")
        return

    if notification.email_sent:
        logger.info(f"Email for notification {notification_id} already sent.")
        return

    User = get_user_model()
    admin_users = User.objects.filter(Q(role__name='SUPER_ADMIN') | Q(is_superuser=True))
    recipient_list = [user.email for user in admin_users if user.email]

    if not recipient_list:
        logger.warning(f"No admin email recipients found for notification {notification_id}.")
        return

    subject = f"Alert: {notification.title}"
    message = f"{notification.message}\n\nType: {notification.get_type_display()}\nModule: {notification.get_module_display()}"
    from_email = settings.DEFAULT_FROM_EMAIL

    try:
        send_mail(subject, message, from_email, recipient_list, fail_silently=False)
        notification.email_sent = True
        notification.save(update_fields=["email_sent"])
        logger.info(f"Successfully sent notification email for ID {notification_id}")
    except Exception as e:
        logger.error(f"Error sending email for notification {notification_id}: {e}")
