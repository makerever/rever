from rever.app.serializers.payable import (
    BillSerializer,
    PurchaseOrderSerializer,
    VendorCreditSerializer,
)
from rever.db.models import ApprovalFlow, Bill, PurchaseOrder, VendorCredit

APPROVAL_MODEL_MAP = {
    "bill": {"model": Bill, "serializer": BillSerializer},
    "purchaseorder": {"model": PurchaseOrder, "serializer": PurchaseOrderSerializer},
    "vendorcredit": {"model": VendorCredit, "serializer": VendorCreditSerializer},
}


def get_next_approval_level(org, model_name, current_level):
    next_level = current_level + 1
    return ApprovalFlow.objects.filter(
        organization=org, model_name=model_name.lower(), level=next_level
    ).first()
