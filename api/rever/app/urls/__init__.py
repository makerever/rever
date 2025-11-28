from django.urls import include, path

urlpatterns = [
    path("", include("rever.app.urls.auth")),
    path("", include("rever.app.urls.payable")),
    path("", include("rever.app.urls.notification")),
    path("", include("rever.app.urls.audit")),
    path("", include("rever.app.urls.attachment")),
    path("", include("rever.app.urls.receipt")),
    path("", include("rever.app.urls.approval")),
]
