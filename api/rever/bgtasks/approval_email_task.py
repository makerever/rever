from celery import shared_task
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

from rever.utils.exception_logger import log_exception


@shared_task
def send_approval_email(recipient_email, recipient_name, object_id, model_name, requested_by):
    subject = f"Action Required : New {model_name.title()} Pending Your Approval"
    approval_url = f"{settings.APP_URL}/{model_name}/{object_id}/review"

    from_email = settings.DEFAULT_FROM_EMAIL
    to = [recipient_email]
    html_content = render_to_string(
        "emails/approvals/approval_request.html",
        {
            "approver": recipient_name,
            "email": recipient_email,
            "member": requested_by,
            "link": approval_url,
        },
    )
    text_content = f"Hello {recipient_name},\n\nYou have a new {model_name} pending your approval.\nPlease review it at the following link: {approval_url}\n\nThank you!"  # noqa: E501
    try:
        email = EmailMultiAlternatives(subject, text_content, from_email, to)
        email.attach_alternative(html_content, "text/html")
        email.send()
    except Exception as e:
        log_exception(e)
        return
