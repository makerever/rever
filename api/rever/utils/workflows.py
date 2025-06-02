from django.db.models import Model

from .approval_constants import APPROVAL_MODEL_MAP


def has_objects_under_approval(model_key: str, organization):
    entry = APPROVAL_MODEL_MAP.get(model_key)
    if not entry:
        return False

    model_class: type[Model] = entry["model"]
    return model_class.objects.filter(organization=organization, status="under_approval").exists()
