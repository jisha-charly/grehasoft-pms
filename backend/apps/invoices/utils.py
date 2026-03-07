from datetime import datetime
from .models import Invoice

def generate_invoice_number():

    year = datetime.now().year

    prefix = f"GSI/{year}/"

    last_invoice = Invoice.objects.filter(
        invoice_number__startswith=prefix
    ).order_by("-invoice_number").first()

    if last_invoice:
        last_number = int(last_invoice.invoice_number.split("/")[-1])
        new_number = last_number + 1
    else:
        new_number = 1

    return f"{prefix}{new_number:03d}"