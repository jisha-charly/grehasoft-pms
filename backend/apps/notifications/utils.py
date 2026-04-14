import logging
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db.models import Q

logger = logging.getLogger(__name__)

def send_notification_email(notification_id):
    logger.info(f"📩 [EMAIL] Starting email send for notification {notification_id}")
    from .models import Notification
    try:
        notification = Notification.objects.get(id=notification_id)
        logger.info(f"🔍 [EMAIL] Notification found: {notification.title}")
    except Notification.DoesNotExist:
        logger.error(f"❌ [EMAIL] Notification with id {notification_id} does not exist.")
        return

    if notification.email_sent:
        logger.info(f"⏩ [EMAIL] Email already sent for notification {notification_id}, skipping.")
        return

    User = get_user_model()
    admin_users = User.objects.filter(Q(role__name='SUPER_ADMIN') | Q(is_superuser=True))
    logger.info(f"👥 [EMAIL] Found {admin_users.count()} admin users")
    
    recipient_list = [user.email for user in admin_users if user.email]
    logger.info(f"📬 [EMAIL] Recipients: {recipient_list}")

    if not recipient_list:
        logger.warning(f"⚠️  [EMAIL] No admin email recipients found for notification {notification_id}.")
        return

    subject = f"Alert: {notification.title}"
    message = f"{notification.message}\n\nType: {notification.get_type_display()}\nModule: {notification.get_module_display()}"
    from_email = settings.DEFAULT_FROM_EMAIL
    
    logger.info(f"📋 [EMAIL] Email details:")
    logger.info(f"   📧 From: {from_email}")
    logger.info(f"   📋 Subject: {subject}")
    logger.info(f"   🌐 Recipients: {recipient_list}")

    try:
        logger.info(f"📤 [EMAIL] Sending email via SMTP...")
        send_mail(subject, message, from_email, recipient_list, fail_silently=False)
        notification.email_sent = True
        notification.save(update_fields=["email_sent"])
        logger.info(f"✅ [EMAIL] Email sent successfully and marked as sent in DB for notification {notification_id}")
    except Exception as e:
        logger.error(f"❌ [EMAIL] Error sending email: {str(e)}", exc_info=True)
        raise
