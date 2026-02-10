from celery import shared_task
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

from rever.utils.exception_logger import log_exception


def _get_display_name(model_name):
    """Get display name for the model type."""
    m = model_name.lower() if model_name else ""
    if m == "purchaseorder":
        return "Purchase Order"
    if m == "vendorcredit":
        return "Credit Note"
    return "Bill"


@shared_task
def send_approval_email(
    recipient_email,
    recipient_name,
    object_id,
    model_name,
    requested_by,
    bill_number=None,
    vendor_name=None,
    vendor_id=None,
):
    identifier = bill_number or f"#{object_id}"
    display_name = _get_display_name(model_name)
    subject = f"{display_name} {identifier} awaiting your approval"
    approval_url = f"{settings.APP_URL}/{model_name}/{object_id}/review"
    vendor_url = f"{settings.APP_URL}/vendor/view?id={vendor_id}" if vendor_id else None

    from_email = settings.DEFAULT_FROM_EMAIL
    to = [recipient_email]
    html_content = render_to_string(
        "emails/approvals/approval_request.html",
        {
            "approver": recipient_name,
            "email": recipient_email,
            "identifier": identifier,
            "display_name": display_name,
            "vendor_name": vendor_name or "Unknown Vendor",
            "vendor_url": vendor_url,
            "link": approval_url,
        },
    )
    vendor = vendor_name or "Unknown Vendor"
    text_content = (
        f"Hello {recipient_name},<br><br>"
        f"{display_name} {identifier} from {vendor} has been submitted for approval "
        f"and is currently awaiting your review.<br><br>"
        f"Review it at: {approval_url}<br><br>Team Rever"
    )    
    try:
        email = EmailMultiAlternatives(subject, text_content, from_email, to)
        email.attach_alternative(html_content, "text/html")
        email.send()
    except Exception as e:
        log_exception(e)
        return
