from celery import shared_task
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

from rever.utils.exception_logger import log_exception


@shared_task
def send_otp_email(recipient, otp):
    subject = "Your unique Rever login code"
    from_email = settings.DEFAULT_FROM_EMAIL
    to = [recipient]
    html_content = render_to_string(
        "emails/auth/otp_signin.html", {"otp": otp, "email": recipient}
    )
    text_content = f"Your code is {otp}. If you didn't request this, ignore this email."

    try:
        email = EmailMultiAlternatives(subject, text_content, from_email, to)
        email.attach_alternative(html_content, "text/html")
        email.send()
    except Exception as e:
        log_exception(e)
        return
