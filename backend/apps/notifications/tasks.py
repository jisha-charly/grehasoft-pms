import logging
from celery import shared_task
from .utils import send_notification_email

logger = logging.getLogger(__name__)

@shared_task
def send_notification_email_task(notification_id):
    try:
        send_notification_email(notification_id)
    except Exception as e:
        logger.error(f"Error in send_notification_email_task for notification {notification_id}: {e}")
