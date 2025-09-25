from celery import shared_task
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

from rever.utils.exception_logger import log_exception


@shared_task
def receipt_assignment_email(recipient_email, recipient_name, bill_id, bill_number, vendor_name):
    """
    Email to the Lite User who has been assigned to confirm the bill.
    Templates:
      - emails/receipts/assignment.html
    """
    subject = f"Action Required : Confirm receipt for Bill {bill_number}"
    bill_url = f"{settings.APP_URL}/request-receipt/{bill_id}"

    from_email = settings.DEFAULT_FROM_EMAIL
    to = [recipient_email]

    ctx = {
        "assignee": recipient_name,
        "bill_number": bill_number,
        "vendor_name": vendor_name or "N/A",
        "email": recipient_email,
        "link": bill_url,
    }

    html_content = render_to_string("emails/receipts/assignment.html", ctx)
    text_content = (
        f"Hello {recipient_name},\n\n"
        f"You've been assigned to confirm receipt/quantities for Bill {bill_number}.\n"
        f"Vendor: {vendor_name or 'N/A'}\n"
        f"Review and confirm: {bill_url}\n"
    )
    try:
        email = EmailMultiAlternatives(subject, text_content, from_email, to)
        email.attach_alternative(html_content, "text/html")
        email.send()
    except Exception as e:
        log_exception(e)
        return


@shared_task
def receipt_reminder_email(recipient_email, recipient_name, bill_id, bill_number, vendor_name):
    """
    Reminder email to the current active Lite User assignee.
    Templates:
      - emails/receipts/reminder.html
    """
    subject = f"Reminder : Confirm receipt for Bill {bill_number}"
    bill_url = f"{settings.APP_URL}/request-receipt/{bill_id}"

    from_email = settings.DEFAULT_FROM_EMAIL
    to = [recipient_email]

    ctx = {
        "assignee": recipient_name,
        "bill_number": bill_number,
        "vendor_name": vendor_name or "N/A",
        "email": recipient_email,
        "link": bill_url,
    }

    html_content = render_to_string("emails/receipts/reminder.html", ctx)
    text_content = (
        f"Hello {recipient_name},\n\n"
        f"This is a reminder to confirm Bill {bill_number}.\n"
        f"Review and confirm: {bill_url}\n"
    )
    try:
        email = EmailMultiAlternatives(subject, text_content, from_email, to)
        email.attach_alternative(html_content, "text/html")
        email.send()
    except Exception as e:
        log_exception(e)
        return


@shared_task
def receipt_confirmation_email(
    recipient_email, recipient_name, bill_id, bill_number, vendor_name, confirmer_name, comments=""
):
    """
    Notification email to finance when the assignee confirms the bill.
    Templates:
      - emails/receipts/confirmation.html
    """
    subject = f"Confirmed : Bill {bill_number} receipt confirmed by {confirmer_name}"
    bill_url = f"{settings.APP_URL}/confirm-receipt/{bill_id}"

    from_email = settings.DEFAULT_FROM_EMAIL
    to = [recipient_email]

    ctx = {
        "member": recipient_name,
        "bill_number": bill_number,
        "vendor_name": vendor_name or "N/A",
        "assignee": confirmer_name,
        "comments": comments or "",
        "email": recipient_email,
        "link": bill_url,
    }

    html_content = render_to_string("emails/receipts/confirmation.html", ctx)
    text_content = (
        f"Hello {recipient_name},\n\n"
        f"The Bill {bill_number} you've requested for receipt has been confirmed by "
        f"{confirmer_name}.\n"
        f"Vendor: {vendor_name or 'N/A'}\n"
        f"Comments: {comments or ''}\n"
    )
    try:
        email = EmailMultiAlternatives(subject, text_content, from_email, to)
        email.attach_alternative(html_content, "text/html")
        email.send()
    except Exception as e:
        log_exception(e)
        return