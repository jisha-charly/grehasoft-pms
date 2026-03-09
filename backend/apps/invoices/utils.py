from django.utils import timezone
from .models import Invoice


def generate_invoice_number():

    today = timezone.now()

    year = today.year

    # Determine financial year
    if today.month >= 4:
        start_year = year
        end_year = year + 1
    else:
        start_year = year - 1
        end_year = year

    fiscal_year = f"{start_year}-{str(end_year)[-2:]}"

    prefix = f"GSI/{fiscal_year}"

    # Find last invoice of this financial year
    last_invoice = Invoice.objects.filter(
        invoice_number__startswith=prefix
    ).order_by("-invoice_number").first()

    if last_invoice:
        last_number = int(last_invoice.invoice_number.split("/")[-1])
        new_number = last_number + 1
    else:
        new_number = 1

    invoice_number = f"{prefix}/{str(new_number).zfill(3)}"

    return invoice_number