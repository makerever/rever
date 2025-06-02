from celery import shared_task
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

from rever.utils.exception_logger import log_exception


@shared_task
def send_approval_status_email(model_name, action_type, comment, to_email, to_name):
    subject = f"{model_name.title()} {action_type.capitalize()}"

    from_email = settings.DEFAULT_FROM_EMAIL
    to = [to_email]
    html_content = render_to_string(
        "emails/approvals/approval_response.html",
        {
            "member": to_name,
            "email": to_email,
            "model": model_name,
            "comments": comment,
            "action": action_type,
        },
    )
    text_content = f"Hello {to_name},\n\nYour {model_name} has been {action_type}.\nComments: {comment}\n\nThank you!"  # noqa: E501
    try:
        email = EmailMultiAlternatives(subject, text_content, from_email, to)
        email.attach_alternative(html_content, "text/html")
        email.send()
    except Exception as e:
        log_exception(e)
        return
