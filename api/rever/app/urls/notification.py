from django.urls import path

from rever.app.views import UserNotificationPreferenceAPIView

urlpatterns = [
    path(
        "users/me/notification-preferences/",
        UserNotificationPreferenceAPIView.as_view(),
        name="user-notification-preferences",
    ),
]
