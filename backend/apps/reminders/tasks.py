from celery import shared_task
from django.utils import timezone
from .models import Reminder
from apps.notifications.models import Notification
import logging

logger = logging.getLogger(__name__)

@shared_task
def check_and_create_reminder_notifications():
    today = timezone.now().date()
    
    # 1. Reminders due today
    reminders_today = Reminder.objects.filter(is_completed=False, due_date=today)
    for reminder in reminders_today:
        msg = f"[Reminder ID: {reminder.id}] Reminder '{reminder.title}' is due today ({today})."
        
        if not Notification.objects.filter(module=Notification.ModuleChoices.REMINDER, type=Notification.NotificationType.REMINDER_DUE, message=msg).exists():
            Notification.objects.create(
                title=f"Reminder Due: {reminder.title}",
                message=msg,
                module=Notification.ModuleChoices.REMINDER,
                type=Notification.NotificationType.REMINDER_DUE
            )

    # 2. Reminders overdue
    reminders_overdue = Reminder.objects.filter(is_completed=False, due_date__lt=today)
    for reminder in reminders_overdue:
        msg = f"[Reminder ID: {reminder.id}] Reminder '{reminder.title}' is overdue. Due date was {reminder.due_date}."
        if not Notification.objects.filter(module=Notification.ModuleChoices.REMINDER, type=Notification.NotificationType.REMINDER_OVERDUE, message=msg).exists():
            Notification.objects.create(
                title=f"Reminder Overdue: {reminder.title}",
                message=msg,
                module=Notification.ModuleChoices.REMINDER,
                type=Notification.NotificationType.REMINDER_OVERDUE
            )
    
    logger.info("Checked and created reminder notifications successfully.")
