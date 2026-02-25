import logging

from django.core.cache import cache
from django.core.exceptions import PermissionDenied
from django.db import IntegrityError
from django.db.models import Count, ProtectedError, Q
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from rever.app.serializers import (
    BillItemSerializer,
    BillListSerializer,
    BillSerializer,
    DragDropSerializer,
    MatchResultSerializer,
    PurchaseOrderItemSerializer,
    PurchaseOrderListSerializer,
    PurchaseOrderMinimalSerializer,
    PurchaseOrderSerializer,
    VendorCreditItemSerializer,
    VendorCreditListSerializer,
    VendorCreditSerializer,
    VendorListSerializer,
    VendorSerializer,
)
from rever.app.views.base import BaseAPIView
from rever.app.views.base_viewsets import BaseModelViewSet
from rever.bgtasks import generate_bill_summary, generate_monthly_bill_summary
from rever.db.models import (
    Bill,
    BillItem,
    MatchResult,
    PurchaseOrder,
    PurchaseOrderItem,
    Vendor,
    VendorCredit,
    VendorCreditItem,
)
from rever.services.matching.drag_drop import pair_bill_item_with_po_item
from rever.utils.bill_constants import STATUS_CHOICES
from rever.utils.cache import clear_report_cache

logger = logging.getLogger(__name__)


class VendorViewSet(BaseModelViewSet):
    serializer_class = VendorSerializer

    def get_queryset(self):
        qs = Vendor.objects.filter(organization=self.request.user.organization)
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        if lookup_url_kwarg and lookup_url_kwarg in self.kwargs:
            return qs
        if self.request.query_params.get("include_inactive") == "true":
            return qs
        return qs.filter(is_active=True)

    def get_serializer_class(self):
        if self.action == "list":
            return VendorListSerializer
        return VendorSerializer

    def perform_create(self, serializer):
        serializer.save(organization=self.request.user.organization)

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except IntegrityError:
            return Response(
                {"detail": "A vendor with that name already exists in your organization."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def update(self, request, *args, **kwargs):
        try:
            return super().update(request, *args, **kwargs)
        except IntegrityError:
            return Response(
                {"detail": "A vendor with this name already exists in your organization."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        try:
            self.perform_destroy(instance)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ProtectedError:
            return Response(
                {"detail": "Cannot delete this vendor because it is linked to one or more bills."},
                status=status.HTTP_400_BAD_REQUEST,
            )


class BillViewSet(BaseModelViewSet):
    serializer_class = BillSerializer

    def get_queryset(self):
        qs = (
            Bill.objects.filter(organization=self.request.user.organization)
            .select_related("vendor", "vendor__billing_address")
            .prefetch_related("items")
        )

        params = self.request.query_params
        if params.get("include_inactive") != "true":
            qs = qs.filter(is_active=True)

        status_param = params.get("status")
        if status_param in {c[0] for c in STATUS_CHOICES}:
            qs = qs.filter(status=status_param)

        return qs

    def get_serializer_class(self):
        if self.action == "list":
            return BillListSerializer
        return super().get_serializer_class()

    @action(detail=True, methods=["get"], url_path="match-results")
    def match_results(self, request, pk=None):
        """
        Returns all MatchResult entries for the given Bill ID,
        along with unmatched PurchaseOrderItems.
        """
        bill = self.get_object()

        # Get all match results
        results = MatchResult.objects.filter(bill=bill)

        # Get matched PO Items
        matched_po_items = results.values_list("purchase_order_item_id", flat=True)
        matched_bill_item_ids = results.values_list("bill_item_id", flat=True)

        # Get unmatched PO Items (only if PO exists)
        unmatched_po_items = []
        if bill.purchase_order:
            all_po_items = bill.purchase_order.items.all()
            unmatched_po_items = all_po_items.exclude(id__in=matched_po_items)

        unmatched_bill_items = bill.items.exclude(id__in=matched_bill_item_ids)

        return Response(
            {
                "billed": MatchResultSerializer(results, many=True).data,
                "Unbilled": PurchaseOrderItemSerializer(unmatched_po_items, many=True).data,
                "extra_bill_items": BillItemSerializer(unmatched_bill_items, many=True).data,
            }
        )

    @action(detail=False, methods=["get"], url_path="by-vendor")
    def by_vendor(self, request):
        """
        List all bills for a given vendor in the current organization.
        Query param: vendor_id
        """
        vendor_id = request.query_params.get("vendor_id")
        if not vendor_id:
            return Response({"detail": "vendor_id is required."}, status=400)

        bills = Bill.objects.filter(organization=request.user.organization, vendor_id=vendor_id)
        serializer = self.get_serializer(bills, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="by-purchase-order")
    def by_purchase_order(self, request):
        """
        List all bills for a given purchase order in the current organization.
        Query param: purchase_order_id
        """
        po_id = request.query_params.get("purchase_order_id")
        if not po_id:
            return Response({"detail": "purchase_order_id is required."}, status=400)

        bills = Bill.objects.filter(
            organization=request.user.organization, purchase_order_id=po_id
        )
        serializer = self.get_serializer(bills, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="duplicates")
    def duplicates(self, request):
        org = request.user.organization

        # Get optional filters from query params
        vendor_id = request.query_params.get("vendor_id")
        bill_number = request.query_params.get("bill_number")

        # Step 1: Find (vendor, bill_number) pairs with more than one bill in this org
        dupe_keys_qs = Bill.objects.filter(organization=org)
        if vendor_id:
            dupe_keys_qs = dupe_keys_qs.filter(vendor_id=vendor_id)
        if bill_number:
            dupe_keys_qs = dupe_keys_qs.filter(bill_number=bill_number)

        dupe_keys = (
            dupe_keys_qs.values("vendor", "bill_number")
            .annotate(bill_count=Count("id"))
            .filter(bill_count__gt=1)
        )

        # Step 2: Build a Q object for all duplicate pairs
        q = Q()
        for item in dupe_keys:
            if item["bill_number"]:  # skip empty bill numbers if needed
                q |= Q(vendor=item["vendor"], bill_number=item["bill_number"], organization=org)

        # Step 3: Get all bills matching any duplicate pair
        duplicate_bills = Bill.objects.filter(q) if q else Bill.objects.none()

        # Step 4: Serialize and return
        serializer = self.get_serializer(duplicate_bills, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        serializer.save(organization=self.request.user.organization)
        clear_report_cache(self.request.user.id, "bill_summary")
        clear_report_cache(self.request.user.id, "bill_summary_sync")

    def perform_update(self, serializer):
        serializer.save()
        clear_report_cache(self.request.user.id, "bill_summary")
        clear_report_cache(self.request.user.id, "bill_summary_sync")

    def perform_destroy(self, instance):
        if instance.status in ["under_approval", "approved"]:
            raise ValidationError(
                {"detail": f"Cannot delete bill with status '{instance.status}'."}
            )
        instance.delete()
        clear_report_cache(self.request.user.id, "bill_summary")
        clear_report_cache(self.request.user.id, "bill_summary_sync")

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except IntegrityError:
            return Response(
                {"detail": "Bill number already exists for this organization."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def update(self, request, *args, **kwargs):
        try:
            return super().update(request, *args, **kwargs)
        except IntegrityError:
            return Response(
                {"detail": "A bill with this number already exists in your organization."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    # def destroy(self, request, *args, **kwargs):
    #    clear_bill_summary_cache(self.request.user.id)
    #    return super().destroy(request, *args, **kwargs)


class BillItemViewSet(BaseModelViewSet):
    serializer_class = BillItemSerializer

    def get_queryset(self):
        return BillItem.objects.filter(
            bill__organization=self.request.user.organization
        ).select_related("bill")

    def perform_create(self, serializer):
        bill = serializer.validated_data["bill"]
        if bill.organization != self.request.user.organization:
            raise PermissionDenied("Cannot add item to a foreign bill.")
        serializer.save()


class BillSummaryAsyncAPIView(BaseAPIView):
    def get(self, request):
        user = request.user
        org = user.organization

        filter_type = request.query_params.get("filter", "this_month")
        include_inactive = request.query_params.get("include_inactive", "false").lower() == "true"
        refresh = str(request.query_params.get("refresh", "false")).lower() == "true"

        cache_key = f"bill_summary_sync:{user.id}:{filter_type}:{str(include_inactive).lower()}"

        if not refresh:
            cached_data = cache.get(cache_key)
            if cached_data:
                if "error" in cached_data:
                    return Response(
                        {"status": "error", "message": cached_data["error"]}, status=400
                    )
                return Response({"status": "ready", "data": cached_data})

        generate_bill_summary.delay(
            user_id=user.id,
            organization_id=org.id,
            filter_type=filter_type,
            include_inactive=include_inactive,
            cache_key=cache_key,
        )

        return Response(
            {
                "status": "processing",
                "message": "Report is being generated. Please try again shortly.",
            }
        )


class MonthlyBillSummaryAsyncAPIView(BaseAPIView):
    def get(self, request):
        user = request.user
        org = user.organization
        filter_type = request.query_params.get("filter", "last_3_months")
        include_inactive = request.query_params.get("include_inactive", "false").lower() == "true"

        refresh = str(request.query_params.get("refresh", "false")).lower() == "true"

        cache_key = f"bill_summary:{user.id}:{filter_type}:{str(include_inactive).lower()}"

        if not refresh:
            cached_data = cache.get(cache_key)
            if cached_data:
                return Response({"status": "ready", "data": cached_data})

        generate_monthly_bill_summary.delay(
            user_id=user.id,
            organization_id=org.id,
            filter_type=filter_type,
            include_inactive=include_inactive,
            cache_key=cache_key,
        )

        return Response(
            {
                "status": "processing",
                "message": "Report is being generated. Please try again shortly.",
            }
        )


class PurchaseOrderViewSet(BaseModelViewSet):
    serializer_class = PurchaseOrderSerializer

    def get_queryset(self):
        qs = (
            PurchaseOrder.objects.filter(organization=self.request.user.organization)
            .select_related(
                "vendor", "vendor__billing_address", "organization", "organization__address"
            )
            .prefetch_related("items")
        )

        params = self.request.query_params
        if params.get("include_inactive") != "true":
            qs = qs.filter(is_active=True)

        status_param = params.get("status")
        if status_param in {c[0] for c in STATUS_CHOICES}:
            qs = qs.filter(status=status_param)

        return qs

    def get_serializer_class(self):
        if self.action == "list":
            return PurchaseOrderListSerializer
        return super().get_serializer_class()

    @action(detail=False, methods=["get"], url_path="by-vendor/(?P<vendor_id>[^/.]+)")
    def list_by_vendor(self, request, vendor_id=None):
        """
        Return purchase orders filtered by vendor for the current user's organization.
        """
        user_org = request.user.organization
        queryset = self.get_queryset().filter(
            vendor_id=vendor_id, organization=user_org, status="approved"
        )
        serializer = PurchaseOrderMinimalSerializer(queryset, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        serializer.save(organization=self.request.user.organization)

    def perform_update(self, serializer):
        serializer.save()

    def perform_destroy(self, instance):
        instance.delete()

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except IntegrityError:
            return Response(
                {"detail": "PO number already exists for this organization."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def update(self, request, *args, **kwargs):
        try:
            return super().update(request, *args, **kwargs)
        except IntegrityError:
            return Response(
                {
                    "detail": "A purchase order with this number already exists in your organization."  # noqa: E501
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


class PurchaseOrderItemViewSet(BaseModelViewSet):
    serializer_class = PurchaseOrderItemSerializer

    def get_queryset(self):
        return PurchaseOrderItem.objects.filter(
            purchase_order__organization=self.request.user.organization
        ).select_related("purchase_order")

    def perform_create(self, serializer):
        po = serializer.validated_data["purchase_order"]
        if po.organization != self.request.user.organization:
            raise PermissionDenied("Cannot add item to a foreign purchase order.")
        serializer.save()

    def perform_update(self, serializer):
        po = serializer.validated_data.get("purchase_order", serializer.instance.purchase_order)
        if po.organization != self.request.user.organization:
            raise PermissionDenied("Cannot modify item of a foreign purchase order.")
        serializer.save()


class MatchResultDnDViewSet(BaseModelViewSet):
    serializer_class = MatchResultSerializer

    def get_queryset(self):
        return MatchResult.objects.filter(
            organization=self.request.user.organization
        ).select_related("bill", "purchase_order", "bill_item", "purchase_order_item")

    def create(self, request, *args, **kwargs):
        return Response(
            {"detail": "Use POST /api/matching/dnd/assign for drag & drop."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    def get_serializer_class(self):
        if getattr(self, "action", None) == "assign":
            return DragDropSerializer
        return super().get_serializer_class()

    def _serialize_match_context(self, bill, request):
        results = (
            MatchResult.objects.filter(bill=bill)
            .select_related("bill_item", "purchase_order_item")
            .order_by("bill_item__line_number", "purchase_order_item__line_number")
        )

        if bill.purchase_order_id:
            unbilled_po = bill.purchase_order.items.exclude(
                id__in=MatchResult.objects.filter(bill=bill).values_list(
                    "purchase_order_item_id", flat=True
                )
            ).order_by("line_number")
        else:
            unbilled_po = PurchaseOrderItem.objects.none()

        extra_bill_items = bill.items.exclude(
            id__in=MatchResult.objects.filter(bill=bill).values_list("bill_item_id", flat=True)
        ).order_by("line_number")

        return {
            "billed": MatchResultSerializer(results, many=True, context={"request": request}).data,
            "unbilled": PurchaseOrderItemSerializer(
                unbilled_po, many=True, context={"request": request}
            ).data,
            "extra_bill_items": BillItemSerializer(
                extra_bill_items, many=True, context={"request": request}
            ).data,
        }

    @action(detail=False, methods=["post"], url_path="assign")
    def assign(self, request):
        try:
            s = DragDropSerializer(data=request.data)
            s.is_valid(raise_exception=True)
            data = s.validated_data
            user = request.user

            bill = (
                Bill.objects.select_related("purchase_order")
                .prefetch_related("items", "purchase_order__items")
                .get(id=data["bill_id"], organization=user.organization)
            )
            if not bill.purchase_order_id:
                return Response({"detail": "Bill has no Purchase Order."}, status=400)

            bill_item = bill.items.get(id=data["bill_item_id"])
            po_item = bill.purchase_order.items.get(id=data["po_item_id"])
        except Bill.DoesNotExist:
            return Response({"detail": "Bill not found."}, status=404)
        except BillItem.DoesNotExist:
            return Response({"detail": "Bill item not found on this bill."}, status=400)
        except PurchaseOrderItem.DoesNotExist:
            return Response({"detail": "PO item not found on this PO."}, status=400)
        except Exception:
            logger.exception("DnD assign: validation/scoping error")
            return Response({"detail": "Invalid request."}, status=400)

        # Perform DnD
        try:
            pair_bill_item_with_po_item(
                bill_id=str(bill.id),
                bill_item_id=str(bill_item.id),
                po_item_id=str(po_item.id),
                user=user,
            )
        except IntegrityError:
            logger.exception("DnD unique constraint conflict")
            return Response({"detail": "Conflict while swapping. Please retry."}, status=409)
        except Exception:
            logger.exception("DnD assign failed")
            return Response({"detail": "Unable to assign now."}, status=500)

        # Build response context safely
        try:
            payload = self._serialize_match_context(bill, request)
            return Response(payload, status=200)
        except Exception:
            logger.exception("DnD assign: serialization error")
            # Always return a Response to avoid None
            return Response({"detail": "Assigned, but failed to serialize context."}, status=200)


class VendorCreditViewSet(BaseModelViewSet):
    serializer_class = VendorCreditSerializer

    def get_queryset(self):
        qs = VendorCredit.objects.filter(organization=self.request.user.organization).order_by(
            "-created_at"
        )

        params = self.request.query_params
        status_param = params.get("status")
        if status_param:
            qs = qs.filter(status=status_param)

        # Example toggle: include_inactive if you have that field on VC
        if params.get("include_inactive") != "true" and hasattr(VendorCredit, "is_active"):
            qs = qs.filter(is_active=True)

        return qs

    def get_serializer_class(self):
        if self.action == "list":
            return VendorCreditListSerializer
        return super().get_serializer_class()

    def perform_create(self, serializer):
        serializer.save(organization=self.request.user.organization)

    def perform_update(self, serializer):
        serializer.save()

    def perform_destroy(self, instance):
        instance.delete()

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except IntegrityError:
            return Response(
                {
                    "detail": (
                        "A vendor credit with this number may already exist in your organization."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

    def update(self, request, *args, **kwargs):
        try:
            return super().update(request, *args, **kwargs)
        except IntegrityError:
            return Response(
                {"detail": "Conflict while updating vendor credit."},
                status=status.HTTP_400_BAD_REQUEST,
            )


class VendorCreditItemViewSet(BaseModelViewSet):
    serializer_class = VendorCreditItemSerializer

    def get_queryset(self):
        return (
            VendorCreditItem.objects.filter(
                vendor_credit__organization=self.request.user.organization
            )
            .select_related("vendor_credit")
            .order_by("vendor_credit_id", "sequence")
        )

    def perform_create(self, serializer):
        vc = serializer.validated_data["vendor_credit"]
        if vc.organization != self.request.user.organization:
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied("Cannot add item to a vendor credit in another organization.")
        serializer.save()

    def perform_update(self, serializer):
        vc = serializer.validated_data.get("vendor_credit", serializer.instance.vendor_credit)
        if vc.organization != self.request.user.organization:
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied(
                "Cannot modify item of a vendor credit in another organization."
            )
        serializer.save()
