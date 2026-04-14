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
        
        # Get Admin users
        admin_emails = User.objects.filter(
            Q(role__name='SUPER_ADMIN') | Q(is_superuser=True)
        ).values_list('email', flat=True).distinct()

        admin_emails = [email for email in admin_emails if email]

        if not admin_emails:
            logger.warning("No admin users found with email addresses to send reminder emails.")
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
        
        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=list(admin_emails),
                fail_silently=False,
            )
            logger.info(f"[SUCCESS] Sent {alert_type} reminder email for Reminder ID {reminder_id} to {len(admin_emails)} admins: {admin_emails}")
            return True
        except Exception as email_error:
            logger.error(f"[SMTP ERROR] {type(email_error).__name__}: {str(email_error)}")
            logger.error(f"Email Config - HOST: {settings.EMAIL_HOST}, PORT: {settings.EMAIL_PORT}, USER: {settings.EMAIL_HOST_USER}")
            raise

    except Reminder.DoesNotExist:
        logger.error(f"[ERROR] Reminder with ID {reminder_id} does not exist.")
        return False
    except Exception as e:
        logger.error(f"[ERROR] {type(e).__name__}: {str(e)}", exc_info=True)
        return False
