from django.conf import settings
from django.db import models


class Reminder(models.Model):
    class ReminderType(models.TextChoices):
        GENERAL = "general", "General"
        INVOICE = "invoice", "Invoice"
        PAYMENT = "payment", "Payment"
        PROPOSAL = "proposal", "Proposal"
        FOLLOWUP = "followup", "Followup"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reminders",
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    due_date = models.DateField()
    type = models.CharField(
        max_length=20,
        choices=ReminderType.choices,
        default=ReminderType.GENERAL
    )
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = "reminders"   # 👈 add this

    def __str__(self) -> str:
        return f"{self.title} ({self.due_date})"