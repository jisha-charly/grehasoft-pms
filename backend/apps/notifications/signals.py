from django.db.models.signals import post_save, pre_save
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
                send_notification_email(instance.id)
                logger.info(f"✅ [SIGNAL] Email sent successfully")
            except Exception as e:
                logger.error(f"❌ [SIGNAL] Error sending email: {e}", exc_info=True)
        else:
            logger.info(f"⏭️  [SIGNAL] Notification type {instance.type} not in EMAIL_ALERT_TYPES, skipping email")
    elif instance.email_sent:
        logger.info(f"⏩ [SIGNAL] Email already sent for notification {instance.id}")


# pyrefly: ignore [missing-import]
from apps.tasks.models import Task
# pyrefly: ignore [missing-import]
from apps.projects.models import Milestone, Project
# pyrefly: ignore [missing-import]
from apps.invoices.models import Invoice
# pyrefly: ignore [missing-import]
from apps.seo.models import SEODailyWorkLog
from .models import ClientNotification
from django.contrib.auth import get_user_model
from django.utils.timezone import now

# Pre-save signal receivers to cache old status values
@receiver(pre_save, sender=Task)
def task_pre_save(sender, instance, **kwargs):
    if instance.id:
        try:
            instance._old_status = Task.objects.get(id=instance.id).status
        except Task.DoesNotExist:
            instance._old_status = None

@receiver(pre_save, sender=Milestone)
def milestone_pre_save(sender, instance, **kwargs):
    if instance.id:
        try:
            instance._old_status = Milestone.objects.get(id=instance.id).status
        except Milestone.DoesNotExist:
            instance._old_status = None

@receiver(pre_save, sender=Project)
def project_pre_save(sender, instance, **kwargs):
    if instance.id:
        try:
            instance._old_status = Project.objects.get(id=instance.id).status
        except Project.DoesNotExist:
            instance._old_status = None

@receiver(pre_save, sender=SEODailyWorkLog)
def work_log_pre_save(sender, instance, **kwargs):
    if instance.id:
        try:
            instance._old_status = SEODailyWorkLog.objects.get(id=instance.id).status
        except SEODailyWorkLog.DoesNotExist:
            instance._old_status = None


# Post-save signal receivers to create notifications on transition
@receiver(post_save, sender=Task)
def task_completed_signal(sender, instance, created, **kwargs):
    old_status = getattr(instance, '_old_status', None)
    if (created and instance.status == 'done') or (not created and old_status != 'done' and instance.status == 'done'):
        client = instance.project.client
        User = get_user_model()
        users = User.objects.filter(client=client) | User.objects.filter(email=client.email)
        for u in users.distinct():
            ClientNotification.objects.get_or_create(
                user=u,
                notification_type="task_completed",
                title="Task Completed",
                message=f"Task '{instance.title}' under project '{instance.project.name}' has been completed.",
            )

@receiver(post_save, sender=Milestone)
def milestone_completed_signal(sender, instance, created, **kwargs):
    old_status = getattr(instance, '_old_status', None)
    if (created and instance.status == 'completed') or (not created and old_status != 'completed' and instance.status == 'completed'):
        client = instance.project.client
        User = get_user_model()
        users = User.objects.filter(client=client) | User.objects.filter(email=client.email)
        for u in users.distinct():
            ClientNotification.objects.get_or_create(
                user=u,
                notification_type="milestone_completed",
                title="Milestone Completed",
                message=f"Milestone '{instance.title}' under project '{instance.project.name}' is now completed.",
            )

@receiver(post_save, sender=Project)
def project_completed_signal(sender, instance, created, **kwargs):
    old_status = getattr(instance, '_old_status', None)
    if (created and instance.status == 'completed') or (not created and old_status != 'completed' and instance.status == 'completed'):
        client = instance.client
        User = get_user_model()
        users = User.objects.filter(client=client) | User.objects.filter(email=client.email)
        for u in users.distinct():
            ClientNotification.objects.get_or_create(
                user=u,
                notification_type="project_completed",
                title="Project Completed",
                message=f"Congratulations! Project '{instance.name}' has been marked as completed.",
            )

@receiver(post_save, sender=Invoice)
def invoice_generated_signal(sender, instance, created, **kwargs):
    if created:
        client = instance.client
        User = get_user_model()
        users = User.objects.filter(client=client) | User.objects.filter(email=client.email)
        for u in users.distinct():
            ClientNotification.objects.get_or_create(
                user=u,
                notification_type="invoice_generated",
                title="New Invoice Generated",
                message=f"Invoice #{instance.invoice_number} has been generated for amount Rs {instance.total}.",
            )

@receiver(post_save, sender=SEODailyWorkLog)
def work_log_approved_signal(sender, instance, created, **kwargs):
    old_status = getattr(instance, '_old_status', None)
    if (created and instance.status == 'approved') or (not created and old_status != 'approved' and instance.status == 'approved'):
        client = instance.website.client
        User = get_user_model()
        users = User.objects.filter(client=client) | User.objects.filter(email=client.email)
        for u in users.distinct():
            ClientNotification.objects.get_or_create(
                user=u,
                notification_type="work_update",
                title="New SEO Work Update",
                message=f"SEO team approved work log for '{instance.website.website_name}' on {instance.log_date} ({instance.total_count} activities).",
            )
