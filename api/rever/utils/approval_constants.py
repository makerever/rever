from rever.app.serializers.payable import BillSerializer, PurchaseOrderSerializer
from rever.db.models.payable import Bill, PurchaseOrder

APPROVAL_MODEL_MAP = {
    "bill": {"model": Bill, "serializer": BillSerializer},
    "purchaseorder": {"model": PurchaseOrder, "serializer": PurchaseOrderSerializer},
}
