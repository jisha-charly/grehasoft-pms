import logging
from celery import shared_task
from .utils import send_notification_email

logger = logging.getLogger(__name__)

@shared_task
def send_notification_email_task(notification_id):
    logger.info(f"🔵 [EMAIL TASK] Started: send_notification_email_task for notification {notification_id}")
    try:
        logger.info(f"📤 Attempting to send email for notification {notification_id}...")
        result = send_notification_email(notification_id)
        logger.info(f"✅ [EMAIL TASK] Email sent successfully for notification {notification_id}")
        return result
    except Exception as e:
        logger.error(f"❌ [EMAIL TASK] Error sending email: {str(e)}", exc_info=True)
        raise
