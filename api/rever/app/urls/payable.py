from django.urls import path
from rest_framework.routers import DefaultRouter

from rever.app.views import (
    BillItemViewSet,
    BillSummaryAsyncAPIView,
    BillViewSet,
    MonthlyBillSummaryAsyncAPIView,
    PurchaseOrderItemViewSet,
    PurchaseOrderViewSet,
    VendorViewSet,
)

router = DefaultRouter()
router.register(r"vendors", VendorViewSet, basename="vendor")
router.register(r"bills", BillViewSet, basename="bill")
router.register(r"bill-items", BillItemViewSet, basename="billitem")
router.register(r"purchase-orders", PurchaseOrderViewSet, basename="purchase-order")
router.register(r"purchase-order-items", PurchaseOrderItemViewSet, basename="purchase-order-item")

urlpatterns = [
    path("bills/summary/", BillSummaryAsyncAPIView.as_view(), name="bill-summary-async"),
    path(
        "bills/summary/monthly/",
        MonthlyBillSummaryAsyncAPIView.as_view(),
        name="bill-summary-monthly",
    ),
    *router.urls,
]
