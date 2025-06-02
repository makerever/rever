from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from rever.app.views import (
    InvitedUserDetailView,
    InvitedUserListView,
    InviteUserView,
    Login,
    LoginEmailStart,
    LoginEmailVerify,
    Logout,
    MeView,
    OrganizationDetail,
    OrganizationUserListAPIView,
    OrganizationUserUpdateDeleteAPIView,
    PasswordChange,
    PasswordForgot,
    PasswordReset,
    SignupComplete,
    SignupCompleteView,
    SignupEmailStart,
    SignupEmailVerify,
)

urlpatterns = [
    # signup
    path("signup/email-start", SignupEmailStart.as_view()),
    path("signup/email-verify", SignupEmailVerify.as_view()),
    path("signup/complete", SignupComplete.as_view()),
    # auth
    path("login", Login.as_view()),
    path("token/refresh", TokenRefreshView.as_view()),
    path("logout", Logout.as_view()),
    # password
    path("password/forgot", PasswordForgot.as_view()),
    path("password/reset", PasswordReset.as_view()),
    path("password/change", PasswordChange.as_view()),
    # OTP Login
    path("login/email-start/", LoginEmailStart.as_view(), name="login-email-start"),
    path(
        "login/email-verify/",
        LoginEmailVerify.as_view(),
        name="login-email-verify",
    ),
    # Invite user
    path("invite-user/", InviteUserView.as_view(), name="invite-user"),
    path("users/invited/", InvitedUserListView.as_view(), name="invited-users"),
    path(
        "users/invited/<uuid:user_id>/",
        InvitedUserDetailView.as_view(),
        name="invited-user-detail",
    ),
    path(
        "user/<uuid:user_id>/signup/complete/",
        SignupCompleteView.as_view(),
        name="signup-complete",
    ),
    # Profile
    path("me/", MeView.as_view(), name="me"),
    # Organization
    path("organization/", OrganizationDetail.as_view(), name="organization-detail"),
    path(
        "users/organization/",
        OrganizationUserListAPIView.as_view(),
        name="organization-user-list",
    ),
    path(
        "users/<uuid:user_id>/",
        OrganizationUserUpdateDeleteAPIView.as_view(),
        name="update-delete-user",
    ),
]
