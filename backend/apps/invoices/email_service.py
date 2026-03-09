from django.core.mail import EmailMessage
from django.conf import settings


def send_invoice_email(invoice, pdf_path):

    subject = f"Invoice {invoice.invoice_number}"

    message = f"""
Dear {invoice.client.name},

Please find attached your invoice.

Invoice Number: {invoice.invoice_number}
Total: ₹{invoice.total}
Paid: ₹{invoice.total_paid}
Balance: ₹{invoice.balance}

Thank you,
Grehasoft Team
"""

    email = EmailMessage(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [invoice.client.email],
    )

    email.attach_file(pdf_path)

    email.send()