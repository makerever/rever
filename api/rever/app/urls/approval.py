from django.urls import path

from rever.app.views import (
    ApprovalActionAPIView,
    ApprovalConfigAPIView,
    ApprovalFlowAPIView,
    ApprovalFlowListAPIView,
    ApprovalLogAPIView,
    ApprovalLogListAPIView,
)

urlpatterns = [
    path("approval/setting/", ApprovalConfigAPIView.as_view(), name="approval-setting"),
    path("approval/assign/", ApprovalFlowAPIView.as_view(), name="assign-approver"),
    path(
        "approval/send/<model_name>/<uuid:object_id>/",
        ApprovalLogAPIView.as_view(),
        name="send-bill-approval",
    ),
    path(
        "approval/action/<str:model_name>/<uuid:object_id>/",
        ApprovalActionAPIView.as_view(),
        name="approval-action",
    ),
    path(
        "approval/assigned/<str:model_name>/",
        ApprovalFlowListAPIView.as_view(),
        name="assigned-approvals",
    ),
    path(
        "approval/history/<str:model_name>/<uuid:object_id>/",
        ApprovalLogListAPIView.as_view(),
        name="approval-history",
    ),
]
