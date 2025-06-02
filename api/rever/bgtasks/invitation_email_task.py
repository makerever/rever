from celery import shared_task
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

from rever.utils.exception_logger import log_exception


@shared_task
def send_invitation_email(recipient_email, role, org_name, link):
    subject = "You're invited to join Rever"

    from_email = settings.DEFAULT_FROM_EMAIL
    to = [recipient_email]
    html_content = render_to_string(
        "emails/invitations/member_invitation.html",
        {"role": role, "email": recipient_email, "org_name": org_name, "link": link},
    )
    text_content = f"Hello,\n\nYou have been invited to join {org_name} as a {role}.\nPlease accept the invitation at the following link: {link}\n\nThank you!"  # noqa: E501
    try:
        email = EmailMultiAlternatives(subject, text_content, from_email, to)
        email.attach_alternative(html_content, "text/html")
        email.send()
    except Exception as e:
        log_exception(e)
        return
