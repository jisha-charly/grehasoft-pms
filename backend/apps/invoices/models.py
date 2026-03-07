from django.db import models
from apps.projects.models import Client
from django.utils import timezone

class Invoice(models.Model):

    invoice_number = models.CharField(max_length=50, unique=True)

    client = models.ForeignKey(Client, on_delete=models.CASCADE)

    issue_date = models.DateField(default=timezone.now)

    due_date = models.DateField()

    subtotal = models.DecimalField(max_digits=10, decimal_places=2)

    tax = models.DecimalField(max_digits=10, decimal_places=2)

    total = models.DecimalField(max_digits=10, decimal_places=2)

    notes = models.TextField(blank=True)

    status = models.CharField(
        max_length=20,
        default="unpaid"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.invoice_number
    

class InvoiceItem(models.Model):

    invoice = models.ForeignKey(
        Invoice,
        related_name="items",
        on_delete=models.CASCADE
    )

    description = models.CharField(max_length=255)

    quantity = models.IntegerField()

    rate = models.DecimalField(max_digits=10, decimal_places=2)

    amount = models.DecimalField(max_digits=10, decimal_places=2)