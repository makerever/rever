from django.urls import path

from rever.app.views import AuditTrailView

urlpatterns = [
    path(
        "audit/<str:model_name>/<uuid:object_id>/",
        AuditTrailView.as_view(),
        name="audit-trail",
    ),
]
