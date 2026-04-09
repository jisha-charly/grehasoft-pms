import logging
from django.core.mail import send_mail
from django.conf import settings
from django.db.models import Q
from apps.users.models import User
from .models import Reminder

logger = logging.getLogger(__name__)

def send_reminder_email(reminder_id, alert_type):
    try:
        reminder = Reminder.objects.get(id=reminder_id)
        
        # 2. Admin users are identified by: User.objects.filter(Q(role__name='SUPER_ADMIN') | Q(is_superuser=True))
        admin_emails = User.objects.filter(
            Q(role__name='SUPER_ADMIN') | Q(is_superuser=True)
        ).values_list('email', flat=True).distinct()

        admin_emails = [email for email in admin_emails if email]

        if not admin_emails:
            logger.warning("No admin users found to send reminder emails.")
            return False

        status_text = "Completed" if reminder.is_completed else "Pending"

        subject = f"Grehasoft PMS - Reminder Alert ({alert_type})"
        message = f"""Grehasoft PMS Reminder Alert

Alert Type: {alert_type}
Title: {reminder.title}
Due Date: {reminder.due_date}
Status: {status_text}
Created By: {reminder.user.name if reminder.user.name else reminder.user.username}

Please login to Grehasoft PMS for more details.
"""
        
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=list(admin_emails),
            fail_silently=False,
        )
        logger.info(f"Successfully sent {alert_type} reminder email for Reminder ID {reminder_id} to {len(admin_emails)} admins.")
        
        return True

    except Reminder.DoesNotExist:
        logger.error(f"Reminder with ID {reminder_id} does not exist.")
        return False
    except Exception as e:
        logger.error(f"Error sending reminder email: {str(e)}")
        return False
