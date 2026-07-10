import smtplib
import socket
import logging
from django.core.mail import EmailMessage
from django.core.exceptions import ValidationError

logger = logging.getLogger(__name__)

def send_proposal_email(proposal, pdf_path, secure_link=None):
    """
    Constructs and sends the proposal email with the PDF attachment.
    Raises specific socket or smtplib exceptions on network/authentication failures.
    """
    recipient_email = None
    if proposal.client and proposal.client.email:
        recipient_email = proposal.client.email
    elif proposal.lead and proposal.lead.email:
        recipient_email = proposal.lead.email

    if not recipient_email:
        logger.warning(f"⚠️ [PROPOSAL EMAIL] Missing recipient email for Proposal {proposal.id}")
        raise ValueError("Proposal client and lead have no valid email address.")

    logger.info(f"📨 [PROPOSAL EMAIL] Preparing proposal email for {recipient_email}")

    body_text = f"Dear Client,\n\nPlease find attached the proposal for '{proposal.title}'.\n\n"
    if secure_link:
        body_text += f"You can also securely view or download the proposal using this link (expires in 2 days):\n{secure_link}\n\n"
    body_text += "Best regards,\nGrehasoft Team"

    email = EmailMessage(
        subject=f"Proposal: {proposal.title}",
        body=body_text,
        to=[recipient_email]
    )

    email.attach_file(pdf_path)

    try:
        email.send()
        logger.info(f"✅ [PROPOSAL EMAIL] Email sent successfully to {recipient_email}")
    except socket.timeout as e:
        logger.error(f"❌ [PROPOSAL EMAIL] Connection timeout: {str(e)}")
        raise
    except smtplib.SMTPAuthenticationError as e:
        logger.error(f"❌ [PROPOSAL EMAIL] SMTP Authentication failed: {str(e)}")
        raise
    except smtplib.SMTPConnectError as e:
        logger.error(f"❌ [PROPOSAL EMAIL] SMTP Connection failed: {str(e)}")
        raise
    except smtplib.SMTPException as e:
        logger.error(f"❌ [PROPOSAL EMAIL] SMTP protocol error: {str(e)}")
        raise
    except OSError as e:
        logger.error(f"❌ [PROPOSAL EMAIL] Network or OS level failure: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"❌ [PROPOSAL EMAIL] Unexpected error: {str(e)}")
        raise
