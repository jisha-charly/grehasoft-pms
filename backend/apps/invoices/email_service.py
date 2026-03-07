from django.core.mail import EmailMessage


def send_invoice_email(invoice, pdf_path):

    email = EmailMessage(
        subject=f"Invoice {invoice.invoice_number}",
        body="Please find attached invoice.",
        to=[invoice.client.email],
    )

    email.attach_file(pdf_path)

    email.send()