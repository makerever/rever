from django.urls import path

from rever.app.views import (
    ApprovalActionListAPIView,
    ApprovalSettingAPIView,
    ApproveOrRejectAPIView,
    AssignApproverAPIView,
    AssignedApprovalListAPIView,
    SendForApprovalAPIView,
)

urlpatterns = [
    path("approval/setting/", ApprovalSettingAPIView.as_view(), name="approval-setting"),
    path("approval/assign/", AssignApproverAPIView.as_view(), name="assign-approver"),
    path(
        "approval/send/<model_name>/<uuid:object_id>/",
        SendForApprovalAPIView.as_view(),
        name="send-bill-approval",
    ),
    path(
        "approval/action/<str:model_name>/<uuid:object_id>/",
        ApproveOrRejectAPIView.as_view(),
        name="approval-action",
    ),
    path(
        "approval/assigned/<str:model_name>/",
        AssignedApprovalListAPIView.as_view(),
        name="assigned-approvals",
    ),
    path(
        "approval/history/<str:model_name>/<uuid:object_id>/",
        ApprovalActionListAPIView.as_view(),
        name="approval-history",
    ),
]
