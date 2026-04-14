from celery import shared_task
from django.utils import timezone
from .models import Reminder
from .utils import send_reminder_email
from apps.notifications.models import Notification
import logging

logger = logging.getLogger(__name__)

@shared_task
def check_and_create_reminder_notifications():
    logger.info("[REMINDER TASK] Started: check_and_create_reminder_notifications")
    today = timezone.now().date()
    logger.info(f"[DATE] Today's date: {today}")
    
    # 1. Reminders due today
    reminders_today = Reminder.objects.filter(is_completed=False, due_date=today)
    logger.info(f"[TODAY] Reminders due today: {reminders_today.count()} found")
    for reminder in reminders_today:
        msg = f"[Reminder ID: {reminder.id}] Reminder '{reminder.title}' is due today ({today})."
        
        if not Notification.objects.filter(module=Notification.ModuleChoices.REMINDER, type=Notification.NotificationType.REMINDER_DUE, message=msg).exists():
            Notification.objects.create(
                title=f"Reminder Due: {reminder.title}",
                message=msg,
                module=Notification.ModuleChoices.REMINDER,
                type=Notification.NotificationType.REMINDER_DUE
            )

    # 2. Reminders overdue - SEND EMAIL
    reminders_overdue = Reminder.objects.filter(is_completed=False, due_date__lt=today)
    logger.info(f"[OVERDUE] Overdue reminders: {reminders_overdue.count()} found")
    for reminder in reminders_overdue:
        msg = f"[Reminder ID: {reminder.id}] Reminder '{reminder.title}' is overdue. Due date was {reminder.due_date}."
        if not Notification.objects.filter(module=Notification.ModuleChoices.REMINDER, type=Notification.NotificationType.REMINDER_OVERDUE, message=msg).exists():
            Notification.objects.create(
                title=f"Reminder Overdue: {reminder.title}",
                message=msg,
                module=Notification.ModuleChoices.REMINDER,
                type=Notification.NotificationType.REMINDER_OVERDUE
            )
        
        # Send email for overdue reminders
        if not reminder.email_sent_reminder:
            logger.info(f"[EMAIL] Sending overdue reminder email for Reminder ID {reminder.id}: {reminder.title}")
            success = send_reminder_email(reminder.id, "Overdue")
            if success:
                reminder.email_sent_reminder = True
                reminder.save(update_fields=['email_sent_reminder'])
                logger.info(f"[SUCCESS] Email sent for overdue Reminder ID {reminder.id}")
            else:
                logger.warning(f"[WARNING] Failed to send email for overdue Reminder ID {reminder.id}")
    
    logger.info("[TASK] Reminder task completed successfully")
