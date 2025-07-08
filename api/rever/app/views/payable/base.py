from django.core.cache import cache
from django.core.exceptions import PermissionDenied
from django.db import IntegrityError
from django.db.models import ProtectedError
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from rever.app.serializers import (
    BillItemSerializer,
    BillSerializer,
    MatchResultSerializer,
    PurchaseOrderItemSerializer,
    PurchaseOrderMinimalSerializer,
    PurchaseOrderSerializer,
    VendorSerializer,
)
from rever.app.views.base import BaseAPIView
from rever.app.views.base_viewsets import BaseModelViewSet
from rever.bgtasks import generate_bill_summary, generate_monthly_bill_summary
from rever.db.models import Bill, BillItem, MatchResult, PurchaseOrder, PurchaseOrderItem, Vendor
from rever.utils.bill_constants import STATUS_CHOICES
from rever.utils.cache import clear_report_cache


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
