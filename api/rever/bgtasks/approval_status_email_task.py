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
def send_approval_status_email(
    model_name,
    action_type,
    comment,
    to_email,
    to_name,
    bill_number=None,
    vendor_name=None,
    actioned_by=None,
    object_id=None,
    vendor_id=None,
):
    identifier = bill_number or (f"#{object_id}" if object_id else "Unknown")
    display_name = _get_display_name(model_name)
    action_display = "Approved" if action_type == "approve" else "Rejected"
    subject = f"{display_name} {identifier} {action_display}"

    from_email = settings.DEFAULT_FROM_EMAIL
    to = [to_email]

    view_url = f"{settings.APP_URL}/{model_name}/view?id={object_id}" if object_id else ""
    vendor_url = f"{settings.APP_URL}/vendor/view?id={vendor_id}" if vendor_id else None

    html_content = render_to_string(
        "emails/approvals/approval_response.html",
        {
            "member": to_name,
            "email": to_email,
            "identifier": identifier,
            "display_name": display_name,
            "vendor_name": vendor_name or "Unknown Vendor",
            "vendor_url": vendor_url,
            "comments": comment,
            "action": action_display.lower(),
            "actioned_by": actioned_by or "Unknown",
            "link": view_url,
        },
    )
    vendor = vendor_name or "Unknown Vendor"
    actor = actioned_by or "Unknown"
    text_content = (
        f"Hello {to_name},<br><br>"
        f"{display_name} {identifier} from {vendor} has been {action_display.lower()} "
        f"by {actor}.<br>"
        f"{f'Comments: {comment}' if comment else ''}<br><br>"
        f"View: {view_url}<br><br>Team Rever"
    )
    try:
        email = EmailMultiAlternatives(subject, text_content, from_email, to)
        email.attach_alternative(html_content, "text/html")
        email.send()
    except Exception as e:
        log_exception(e)
        return
