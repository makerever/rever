from django.contrib.contenttypes.models import ContentType
from django.db.models import Model, OuterRef, Subquery

from rever.db.models import ApprovalFlow, ApprovalLog

from .approval_constants import APPROVAL_MODEL_MAP


def has_objects_under_approval(model_key: str, organization):
    entry = APPROVAL_MODEL_MAP.get(model_key)
    if not entry:
        return False

    model_class: type[Model] = entry["model"]
    return model_class.objects.filter(organization=organization, status="under_approval").exists()


def get_pending_approvals_for_user(user) -> dict[str, int]:
    """
    Get count of pending approvals assigned to a user, grouped by model type.

    Returns a dict like {"bill": 2, "purchaseorder": 1} if the user has pending
    approvals, or an empty dict if none.
    """
    org = user.organization
    if not org:
        return {}

    assignments = ApprovalFlow.objects.filter(organization=org, approver=user)
    if not assignments.exists():
        return {}

    pending_counts = {}
    for model_key, config in APPROVAL_MODEL_MAP.items():
        assignment = assignments.filter(model_name=model_key).first()
        if not assignment:
            continue

        model_class = config["model"]
        content_type = ContentType.objects.get_for_model(model_class)

        # Subquery to get the latest approval level for each document
        latest_level = (
            ApprovalLog.objects.filter(
                content_type=content_type,
                object_id=OuterRef("pk"),
                organization=org,
                action_type="under_approval",
            )
            .order_by("-created_at")
            .values("level")[:1]
        )

        count = (
            model_class.objects.annotate(current_level=Subquery(latest_level))
            .filter(
                organization=org,
                status="under_approval",
                current_level=assignment.level,
            )
            .count()
        )

        if count > 0:
            pending_counts[model_key] = count

    return pending_counts
