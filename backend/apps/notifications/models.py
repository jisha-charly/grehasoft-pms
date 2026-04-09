from django.db import models

class Notification(models.Model):
    class ModuleChoices(models.TextChoices):
        REMINDER = "reminder", "Reminder"
        DOMAIN = "domain", "Domain"
        INVOICE = "invoice", "Invoice"

    class NotificationType(models.TextChoices):
        REMINDER_DUE = "REMINDER_DUE", "Reminder Due"
        REMINDER_OVERDUE = "REMINDER_OVERDUE", "Reminder Overdue"
        DOMAIN_EXPIRING = "DOMAIN_EXPIRING", "Domain Expiring"
        DOMAIN_EXPIRED = "DOMAIN_EXPIRED", "Domain Expired"
        INVOICE_DUE = "INVOICE_DUE", "Invoice Due"

    title = models.CharField(max_length=255)
    message = models.TextField()
    module = models.CharField(
        max_length=50,
        choices=ModuleChoices.choices,
    )
    type = models.CharField(
        max_length=50,
        choices=NotificationType.choices,
    )
    email_sent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.module}] {self.title} - {self.type}"
