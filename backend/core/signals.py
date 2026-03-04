from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings
from django_rest_passwordreset.signals import reset_password_token_created


@receiver(reset_password_token_created)
def password_reset_token_created(sender, instance, reset_password_token, *args, **kwargs):

    print("PASSWORD RESET SIGNAL TRIGGERED")   # debug

    reset_url = f"http://localhost:3000/#/reset-password/{reset_password_token.key}"

    message = f"""
Hello,

You requested a password reset for Grehasoft PMS.

Click the link below to reset your password:

{reset_url}

If you didn't request this, ignore this email.
"""

    send_mail(
        "Grehasoft PMS Password Reset",
        message,
        settings.DEFAULT_FROM_EMAIL,
        [reset_password_token.user.email],
        fail_silently=False
    )