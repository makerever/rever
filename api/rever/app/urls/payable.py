from django.urls import path
from rest_framework.routers import DefaultRouter

from rever.app.views import (
    BillItemViewSet,
    BillSummaryAsyncAPIView,
    BillViewSet,
    MatchResultDnDViewSet,
    MonthlyBillSummaryAsyncAPIView,
    PurchaseOrderItemViewSet,
    PurchaseOrderViewSet,
    VendorCreditItemViewSet,
    VendorCreditViewSet,
    VendorViewSet,
)

router = DefaultRouter()
router.register(r"vendors", VendorViewSet, basename="vendor")
router.register(r"bills", BillViewSet, basename="bill")
router.register(r"bill-items", BillItemViewSet, basename="billitem")
router.register(r"purchase-orders", PurchaseOrderViewSet, basename="purchase-order")
router.register(r"purchase-order-items", PurchaseOrderItemViewSet, basename="purchase-order-item")
router.register(r"matching/dnd", MatchResultDnDViewSet, basename="matching-dnd")
router.register(r"vendor-credits", VendorCreditViewSet, basename="vendor-credit")
router.register(r"vendor-credit-items", VendorCreditItemViewSet, basename="vendor-credit-item")

urlpatterns = [
    path("bills/summary/", BillSummaryAsyncAPIView.as_view(), name="bill-summary-async"),
    path(
        "bills/summary/monthly/",
        MonthlyBillSummaryAsyncAPIView.as_view(),
        name="bill-summary-monthly",
    ),
    *router.urls,
]
