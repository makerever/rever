from datetime import timedelta
from decimal import Decimal
from typing import Any

from django.apps import apps
from django.forms.models import model_to_dict
from rest_framework.response import Response
from rest_framework.views import APIView

from rever.app.serializers.payable import AddressSerializer
from rever.db.models import Organization, PurchaseOrder, Vendor


def get_model_by_name(model_name: str):
    possible_labels = ["rever", "db", "rever.db"]
    for label in possible_labels:
        try:
            return apps.get_model(label, model_name)

        except LookupError:
            continue

    return apps.get_model(model_name)


class AuditTrailView(APIView):
    def get(self, request, model_name, object_id):
        model = get_model_by_name(model_name)

        history_model = model.history.model

        history_qs = history_model.objects.filter(id=object_id).order_by("-history_date")

        result = []
        for index, record in enumerate(history_qs):
            result.append(
                {
                    "history_id": record.history_id,
                    "changed_on": record.history_date,
                    "changed_by": (
                        record.history_user.display_name if record.history_user else None
                    ),
                    "event": record.get_history_type_display(),
                    "is_current": index == 0,
                    "status": record.status,
                }
            )

        return Response(result)


def serialize_value(val: Any) -> Any:
    # Used for conversion of model field values for JSON Output

    if val is None or isinstance(val, str | int | float | bool):
        return val

    if isinstance(val, Decimal):
        return str(val)

    return str(val)


def build_audit_response(
    model_name: str,
    selected_version: Any,
    serialized_data: dict,
    items: list | None = None,
) -> dict:
    """
    Final audit response including po,vendor and addresses.
    """

    response = {
        "history_id": selected_version.history_id,
        "changed_on": selected_version.history_date,
        "changed_by": (
            selected_version.history_user.display_name if selected_version.history_user else None
        ),
    }

    response.update(serialized_data)

    model_name = model_name.lower()

    if model_name in ("bill", "purchaseorder"):
        response["items"] = items

        vendor = None
        if selected_version.vendor_id:
            vendor = Vendor.objects.filter(id=selected_version.vendor_id).first()

        if vendor:
            response["vendor"] = {
                "id": vendor.id,
                "name": vendor.vendor_name,
            }

            if vendor.billing_address:
                response["billing_address"] = AddressSerializer(vendor.billing_address).data
            else:
                response["billing_address"] = None

        organization = None
        if selected_version.organization_id:
            organization = Organization.objects.filter(id=selected_version.organization_id).first()

        if organization and organization.address:
            response["shipping_address"] = AddressSerializer(organization.address).data

        else:
            response["shipping_address"] = None

        if model_name == "bill" and selected_version.purchase_order_id:
            purchaseorder = PurchaseOrder.objects.filter(
                id=selected_version.purchase_order_id
            ).first()

            if purchaseorder:
                response["purchase_order"] = {
                    "id": purchaseorder.id,
                    "po_number": purchaseorder.po_number,
                }

    return response


class AuditVersionDetailView(APIView):
    """
    GET /api/audit/<model_name>/<object_id>/history/<history_id>/

    Returns:
        'data': full model fields at selected history version
    """

    ITEM_HISTORY_GRACE = timedelta(seconds=1)

    def get(self, request, model_name: str, object_id: Any, history_id: int) -> Response:
        model = get_model_by_name(model_name)

        history_model = model.history.model

        try:
            selected_version = history_model.objects.get(id=object_id, history_id=history_id)

        except history_model.DoesNotExist:
            return Response({"error": "Version not found"}, status=404)

        model_field_names = [field.name for field in model._meta.fields]
        version_field_data = model_to_dict(selected_version, fields=model_field_names)

        selected_version_serialized = {
            field_name: serialize_value(field_value)
            for field_name, field_value in version_field_data.items()
        }

        # We avoid the model serializer because this view works with dynamically
        # resolved models and historical records, not concrete model instances.

        lower_model_name = model_name.lower()
        items_output = None

        if lower_model_name in ("bill", "purchaseorder"):
            if lower_model_name == "bill":
                line_item_model_name = "BillItem"
                parent_id_field = "bill_id"

            elif lower_model_name == "purchaseorder":
                line_item_model_name = "PurchaseOrderItem"
                parent_id_field = "purchase_order_id"

            item_model = get_model_by_name(line_item_model_name)

            item_history_model = item_model.history.model

            grace_time = selected_version.history_date + self.ITEM_HISTORY_GRACE
            item_filter = {parent_id_field: object_id}

            # used a dict and unfurled because the parent_id_field is dynamic
            # (purchase_order_id or bill_id) and the filter must be dynamic

            item_history_qs = (
                item_history_model.objects.filter(**item_filter)
                .filter(history_date__lte=grace_time)
                .order_by("history_date", "history_id")
            )

            selected_version_by_item: dict[str, Any] = {}

            for item_hist in item_history_qs:
                line_item_id = str(item_hist.id)

                if item_hist.history_type == "-":
                    selected_version_by_item.pop(line_item_id, None)
                else:
                    selected_version_by_item[line_item_id] = item_hist

            selected_items = list(selected_version_by_item.values())
            selected_items.sort(key=lambda line_item: line_item.line_number)

            item_field_names = [field.name for field in item_model._meta.fields]

            items_output = []
            for selected_item_hist in selected_items:
                line_item_id = str(selected_item_hist.id)

                if selected_item_hist:
                    line_item_data = model_to_dict(selected_item_hist, fields=item_field_names)

                    line_item_serialized = {
                        field_name: serialize_value(field_value)
                        for field_name, field_value in line_item_data.items()
                    }

                else:
                    line_item_serialized = None

                item_payload = {"id": line_item_id}

                if line_item_serialized:
                    item_payload.update(line_item_serialized)

                items_output.append(item_payload)

        return Response(
            build_audit_response(
                model_name=model_name,
                selected_version=selected_version,
                serialized_data=selected_version_serialized,
                items=items_output,
            )
        )
