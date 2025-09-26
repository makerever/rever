from django.urls import path

from rever.app.views import (
    ReceiptApprovedListAPIView,
    ReceiptHistoryListAPIView,
    ReceiptRequestedListAPIView,
    ReceiptRevokedListAPIView,
    ReceiptViewSet,
)

receipt_request = ReceiptViewSet.as_view({"post": "request_receipt"})
receipt_remind = ReceiptViewSet.as_view({"post": "remind"})
receipt_confirm = ReceiptViewSet.as_view({"post": "confirm"})
receipt_tasks = ReceiptViewSet.as_view({"get": "list_tasks"})

urlpatterns = [
    path("receipt/<uuid:pk>/request/", receipt_request, name="receipt-request"),
    path("receipt/<uuid:pk>/remind/", receipt_remind, name="receipt-remind"),
    path("receipt/<uuid:pk>/confirm/", receipt_confirm, name="receipt-confirm"),
    path(
        "receipt/my/requested/", ReceiptRequestedListAPIView.as_view(), name="my-receipt-requested"
    ),
    path(
        "receipt/my/confirmed/", ReceiptApprovedListAPIView.as_view(), name="my-receipt-confirmed"
    ),
    path("receipt/my/revoked/", ReceiptRevokedListAPIView.as_view(), name="my-receipt-revoked"),
    path("receipt/my/history/", ReceiptHistoryListAPIView.as_view(), name="my-receipt-history"),
    path("receipt/<uuid:pk>/tasks/", receipt_tasks, name="receipt-task-list"),
]
