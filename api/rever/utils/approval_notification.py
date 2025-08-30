from django.conf import settings

from rever.db.models import Notification


def _get_identifier(obj, model_name):
    m = model_name.lower()
    if m == "bill" and hasattr(obj, "bill_number"):
        return obj.bill_number or f"#{obj.id}"
    if m == "purchaseorder" and hasattr(obj, "po_number"):
        return obj.po_number or f"#{obj.id}"
    return f"#{obj.id}"


def create_approval_notification(approver, organization, obj, model_name, requester):
    identifier = _get_identifier(obj, model_name)
    action_url = f"{settings.APP_URL}/{model_name.lower()}/{obj.id}/review"

    return Notification.objects.create(
        organization=organization,
        owner=approver,
        subject=f"Action Required: {model_name.title()} {identifier} Pending Your Approval",
        message=(
            f"{model_name.title()} {identifier} has been submitted for your approval "
            f"by {requester.get_full_name()}."
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
    subject = f"{model_name.title()} {identifier} {action_type.capitalize()}"
    message = (
        f"Your {model_name.lower()} {identifier} has been {action_type} "
        f"by {approver.get_full_name()}."
    )
    if comment:
        message += f" Comments: {comment}"

    action_url = f"{settings.APP_URL}/{model_name.lower()}/{obj.id}"
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
