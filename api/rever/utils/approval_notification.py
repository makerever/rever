from django.conf import settings

from rever.db.models import Notification


def _get_display_name(model_name):
    """Get display name for the model type."""
    m = model_name.lower()
    if m == "purchaseorder":
        return "Purchase Order"
    if m == "vendorcredit":
        return "Credit Note"
    return "Bill"


def _get_identifier(obj, model_name):
    m = model_name.lower()
    if m == "bill" and hasattr(obj, "bill_number"):
        return obj.bill_number or f"#{obj.id}"
    if m == "purchaseorder" and hasattr(obj, "po_number"):
        return obj.po_number or f"#{obj.id}"
    if m == "vendorcredit" and hasattr(obj, "credit_note_number"):
        return obj.credit_note_number or f"#{obj.id}"
    return f"#{obj.id}"


def _get_vendor_name(obj):
    """Get vendor name from the object."""
    vendor = getattr(obj, "vendor", None)
    return vendor.vendor_name if vendor else "Unknown Vendor"


def _get_vendor_id(obj):
    """Get vendor ID from the object."""
    vendor = getattr(obj, "vendor", None)
    return vendor.id if vendor else None


def create_approval_notification(approver, organization, obj, model_name, requester):
    identifier = _get_identifier(obj, model_name)
    display_name = _get_display_name(model_name)
    vendor_name = _get_vendor_name(obj)
    vendor_id = _get_vendor_id(obj)
    action_url = f"{settings.APP_URL}/{model_name.lower()}/{obj.id}/review"

    vendor_link = (
        f'<strong><a href="{settings.APP_URL}/vendor/view?id={vendor_id}" '
        f'style="text-decoration: underline;">{vendor_name}</a></strong>'
        if vendor_id
        else vendor_name
    )

    return Notification.objects.create(
        organization=organization,
        owner=approver,
        subject=f"{display_name} {identifier} awaiting your approval",
        message=(
            f"{display_name} {identifier} from {vendor_link} has been submitted for approval "
            f"and requires your review."
        ),
        is_important=True,
        priority="high",
        notification_type="approval",
        action_url=action_url,
        object_name=model_name.lower(),
        object_id=obj.id,
    )


def create_approval_result_notification(
    recipient, organization, obj, model_name, action_type, approver, comment
):
    identifier = _get_identifier(obj, model_name)
    display_name = _get_display_name(model_name)
    vendor_name = _get_vendor_name(obj)
    vendor_id = _get_vendor_id(obj)

    action_display = "Approved" if action_type == "approved" else "Rejected"
    subject = f"{display_name}# {identifier} {action_display}"

    vendor_link = (
        f'<strong><a href="{settings.APP_URL}/vendor/view?id={vendor_id}" '
        f'style="text-decoration: underline;">{vendor_name}</a></strong>'
        if vendor_id
        else vendor_name
    )

    approver_name = approver.get_full_name()
    message = (
        f"{display_name} # {identifier} from {vendor_link} "
        f"has been {action_type} by {approver_name}"
    )
    if comment:
        message += f"<br>Comments: {comment}"

    action_url = f"{settings.APP_URL}/{model_name.lower()}/view?id={obj.id}"
    notification_type = "success" if action_type == "approved" else "warning"
    priority = "medium" if action_type == "approved" else "high"

    return Notification.objects.create(
        organization=organization,
        owner=recipient,
        subject=subject,
        message=message,
        is_important=True,
        priority=priority,
        notification_type=notification_type,
        action_url=action_url,
        object_name=model_name.lower(),
        object_id=obj.id,
    )
