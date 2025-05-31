from django.urls import path

from rever.app.views import NotificationSettingAPIView

urlpatterns = [
    path(
        "notification/settings/",
        NotificationSettingAPIView.as_view(),
        name="notification-settings",
    ),
]
