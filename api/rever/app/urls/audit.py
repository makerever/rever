from django.urls import path

from rever.app.views.audit.base import AuditTrailView, AuditVersionDetailView

urlpatterns = [
    path(
        "audit/<str:model_name>/<uuid:object_id>/",
        AuditTrailView.as_view(),
        name="audit-trail",
    ),
    path(
        "audit/<str:model_name>/<uuid:object_id>/history/<int:history_id>/",
        AuditVersionDetailView.as_view(),
        name="audit-history",
    ),
]
