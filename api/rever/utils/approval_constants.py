from rever.app.serializers.payable import BillSerializer
from rever.db.models.payable import Bill

APPROVAL_MODEL_MAP = {
    "bill": {"model": Bill, "serializer": BillSerializer},
}
