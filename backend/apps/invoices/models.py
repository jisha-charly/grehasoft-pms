from django.db import models
from apps.projects.models import Client
from django.utils import timezone


class Invoice(models.Model):

    invoice_number = models.CharField(max_length=50, unique=True)

    client = models.ForeignKey(Client, on_delete=models.CASCADE)

    issue_date = models.DateField(default=timezone.localdate)

    due_date = models.DateField()
    advance = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    subtotal = models.DecimalField(max_digits=10, decimal_places=2)

    tax = models.DecimalField(max_digits=10, decimal_places=2)

    total = models.DecimalField(max_digits=10, decimal_places=2)

    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.invoice_number
    @property
    def balance(self):
     return self.total - self.advance


    # -------------------------
    # PAYMENT CALCULATIONS
    # -------------------------

    @property
    def total_paid(self):
        from decimal import Decimal
        return sum((p.amount for p in self.payments.all()), Decimal('0.00'))

    @property
    def balance(self):
        from decimal import Decimal
        return Decimal(str(self.total)) - Decimal(str(self.total_paid))

    @property
    def status(self):

        if self.total_paid >= self.total:
            return "paid"

        if self.due_date and self.due_date < timezone.localdate():
            return "overdue"

        if self.total_paid == 0:
            return "unpaid"

        return "partial"

    @classmethod
    def get_for_user(cls, user):
        role_name = getattr(user.role, 'name', None) if hasattr(user, 'role') else None
        if role_name == 'CLIENT':
            client = user.get_associated_client()
            if client:
                return cls.objects.filter(client=client)
            return cls.objects.none()
        return cls.objects.all()



class InvoiceItem(models.Model):

    invoice = models.ForeignKey(
        Invoice,
        related_name="items",
        on_delete=models.CASCADE
    )

    description = models.CharField(max_length=255)

    quantity = models.IntegerField()

    rate = models.DecimalField(max_digits=10, decimal_places=2)

    amount = models.DecimalField(max_digits=10, decimal_places=2, blank=True)

    def save(self, *args, **kwargs):
        self.amount = self.quantity * self.rate
        super().save(*args, **kwargs)

class InvoicePayment(models.Model):

    invoice = models.ForeignKey(
        Invoice,
        on_delete=models.CASCADE,
        related_name="payments"
    )

    amount = models.DecimalField(max_digits=10, decimal_places=2)

    payment_date = models.DateField()

    payment_mode = models.CharField(
        max_length=50,
        choices=[
            ("cash","Cash"),
            ("bank","Bank Transfer"),
            ("upi","UPI"),
            ("card","Card")
        ]
    )

    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)