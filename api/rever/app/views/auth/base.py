from datetime import timedelta

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import IntegrityError
from django.db.models import ProtectedError
from django.shortcuts import get_object_or_404
from django.utils.timezone import now
from rest_framework import status
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from rever.app.permissions import IsSuperAdmin, with_permission_classes
from rever.app.serializers import (
    CompleteSignupSerializer,
    EmailStartSerializer,
    EmailVerifySerializer,
    InvitedUserSerializer,
    InviteUserSerializer,
    LoginSerializer,
    MeSerializer,
    OrganizationSerializer,
    OrganizationUserSerializer,
    OrganizationUserUpdateSerializer,
    OTPLoginStartSerializer,
    OTPLoginVerifySerializer,
    PasswordChangeSerializer,
    PasswordForgotSerializer,
    PasswordResetSerializer,
    SignupCompleteSerializer,
)
from rever.app.views.base import BaseAPIView, BasePublicAPIView
from rever.bgtasks import send_invitation_email, send_otp_email
from rever.db.models import Organization, User, VerificationToken


class SignupEmailStart(BasePublicAPIView):
    throttle_scope = "auth"

    def post(self, request):
        s = EmailStartSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        email = s.validated_data["email"]
        token = VerificationToken.issue(email, "signup")
        if token is None:
            return Response(
                {"detail": "User already onboarded. Please log in."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        send_otp_email.delay(token.email, token.code)
        return Response({"detail": "OTP sent."}, status=202)


class SignupEmailVerify(BasePublicAPIView):
    def post(self, request):
        s = EmailVerifySerializer(data=request.data)
        s.is_valid(raise_exception=True)
        try:
            token = VerificationToken.objects.get(
                email=s.validated_data["email"], purpose="signup", used=False
            )
        except VerificationToken.DoesNotExist:
            return Response({"detail": "Not found."}, status=404)

        if not token.is_valid(s.validated_data["code"]):
            return Response({"detail": "Invalid / expired."}, status=400)

        token.used = True
        token.save(update_fields=["used"])
        return Response({"detail": "Verified."})


class SignupComplete(BasePublicAPIView):
    def post(self, request):
        s = SignupCompleteSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        if User.objects.filter(email=s.validated_data["email"]).exists():
            return Response({"detail": "User exists."}, status=400)
        if (
            VerificationToken.objects.filter(
                email=s.validated_data["email"], purpose="signup", used=True
            ).count()
            == 0
        ):
            return Response({"detail": "E-mail not verified."}, status=400)

        try:
            currency = s.validated_data.get("currency", "USD")
            org = Organization.objects.create(name=s.validated_data["org_name"], currency=currency)
        except IntegrityError:
            return Response(
                {"detail": "An organization with this name already exists."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user = User.objects.create_user(
            username=s.validated_data["email"],
            email=s.validated_data["email"],
            password=s.validated_data["password"],
            first_name=s.validated_data["first_name"],
            last_name=s.validated_data["last_name"],
            organization=org,
            email_verified=True,
            is_staff=True,  # first user is org admin
        )
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=200,
        )


class Login(BasePublicAPIView):
    throttle_scope = "auth"

    def post(self, request):
        s = LoginSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        tokens = s.save()
        return Response(tokens)


class Logout(BaseAPIView):
    def post(self, request):
        try:
            token = RefreshToken(request.data.get("refresh"))
            token.blacklist()
        except Exception:
            pass
        return Response({"detail": "Logged out."})


class PasswordForgot(BasePublicAPIView):
    throttle_scope = "auth"

    def post(self, request):
        s = PasswordForgotSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        token = VerificationToken.issue(s.validated_data["email"], "reset")
        send_otp_email.delay(token.email, token.code)
        return Response({"detail": "OTP sent."}, status=202)


class PasswordReset(BasePublicAPIView):
    def post(self, request):
        s = PasswordResetSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        try:
            token = VerificationToken.objects.get(
                email=s.validated_data["email"], purpose="reset", used=False
            )
        except VerificationToken.DoesNotExist:
            return Response({"detail": "Not found."}, status=404)

        if not token.is_valid(s.validated_data["code"]):
            return Response({"detail": "Invalid / expired."}, status=400)
        try:
            user = User.objects.get(email=token.email)
        except User.DoesNotExist:
            return Response({"detail": "User absent."}, status=404)

        user.set_password(s.validated_data["new_password"])
        user.save()
        token.used = True
        token.save(update_fields=["used"])
        return Response({"detail": "Password reset ok."})


class PasswordChange(BaseAPIView):
    def post(self, request):
        s = PasswordChangeSerializer(data=request.data, context={"request": request})
        s.is_valid(raise_exception=True)
        request.user.set_password(s.validated_data["new_password"])
        request.user.save()
        return Response({"detail": "Password changed."})


class LoginEmailStart(BasePublicAPIView):
    """
    POST { "email": "user@org.com" }
    → sends OTP if user exists & is verified.
    """

    throttle_scope = "auth"

    def post(self, request):
        s = OTPLoginStartSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        email = s.validated_data["email"]

        user = get_user_model()
        # only allow login for existing, verified users
        if not user.objects.filter(email=email, email_verified=True).exists():
            return Response(
                {"detail": "Email not registered or not verified."},
                status=400,
            )

        # issue a login OTP
        token = VerificationToken.issue(email, "login")
        send_otp_email.delay(email, token.code)
        return Response({"detail": "Login OTP sent."}, status=202)


class LoginEmailVerify(BasePublicAPIView):
    """
    POST { "email": "...", "code": "123456" }
    → returns { access, refresh } JWT on success.
    """

    throttle_scope = "auth"

    def post(self, request):
        s = OTPLoginVerifySerializer(data=request.data)
        s.is_valid(raise_exception=True)
        email = s.validated_data["email"]
        code = s.validated_data["code"]

        # fetch the active login token
        token = (
            VerificationToken.objects.filter(email=email, purpose="login", used=False)
            .order_by("-expires_at")
            .first()
        )
        if not token or not token.is_valid(code):
            return Response(
                {"detail": "Invalid or expired OTP."},
                status=400,
            )

        # mark it used
        token.used = True
        token.save(update_fields=["used"])

        # issue JWT
        user = get_user_model()
        user = user.objects.get(email=email)
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=200,
        )


class InviteUserView(BaseAPIView):
    def post(self, request):
        # Only super admins may invite
        if request.user.role != User.Role.SUPER_ADMIN:
            return Response(
                {"detail": "Only Super Admins can invite."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = InviteUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        role = serializer.validated_data["role"]
        org = request.user.organization

        # ← NEW: bail if this email is already a verified, active user
        if User.objects.filter(
            email=email, organization=request.user.organization, email_verified=True
        ).exists():
            return Response(
                {"detail": "That user already exists in your organization."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # create (or reuse) an inactive invitation record
        invited, created = User.objects.update_or_create(
            email=email,
            defaults={
                "username": email,
                "organization": request.user.organization,
                "role": role,
                "is_active": False,
                "email_verified": False,
                "invited_by": request.user,
                "invited_at": now(),
            },
        )

        link = f"{settings.APP_URL}/user/{invited.id}/signup/complete/"

        send_invitation_email.delay(email, role, org.name, link)

        return Response(
            {"detail": f"Invitation sent to {email} as {role}."},
            status=status.HTTP_202_ACCEPTED,
        )


class InvitedUserListView(BaseAPIView):
    def get(self, request):
        org = request.user.organization
        invited_users = User.objects.filter(
            organization=org,
            invited_by__isnull=False,
            is_active=False,
            email_verified=False,
        ).order_by("-invited_at")

        serializer = InvitedUserSerializer(invited_users, many=True)
        return Response(serializer.data)


class InvitedUserDetailView(BasePublicAPIView):
    def get(self, request, user_id):
        invited_user = get_object_or_404(User, id=user_id, invited_by__isnull=False)
        if invited_user.invited_at and now() - invited_user.invited_at > timedelta(hours=24):
            return Response(
                {"detail": "This invitation has expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = InvitedUserSerializer(invited_user)
        return Response(serializer.data)


class SignupCompleteView(BasePublicAPIView):
    def post(self, request, user_id):
        # 1) find the invited stub
        try:
            user = User.objects.get(id=user_id, is_active=False, email_verified=False)
        except User.DoesNotExist:
            return Response(
                {"detail": "Invalid or expired signup link."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if the invitation has expired
        if user.invited_at and now() - user.invited_at > timedelta(hours=24):
            return Response(
                {"detail": "This invitation link has expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 2) validate incoming profile + password
        s = CompleteSignupSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        data = s.validated_data

        # 3) finish onboarding
        user.first_name = data["first_name"]
        user.last_name = data["last_name"]
        user.set_password(data["password"])
        user.email_verified = True
        user.is_active = True
        user.save()

        # 4) issue JWT tokens
        refresh = RefreshToken.for_user(user)
        return Response(
            {"access": str(refresh.access_token), "refresh": str(refresh)},
            status=status.HTTP_200_OK,
        )


class MeView(BaseAPIView):
    def get(self, request):
        serializer = MeSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = MeSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class OrganizationDetail(BaseAPIView, RetrieveUpdateAPIView):
    serializer_class = OrganizationSerializer

    def get_object(self):
        return self.get_organization()

    @with_permission_classes([IsSuperAdmin])
    def patch(self, request, *args, **kwargs):
        return super().patch(request, *args, **kwargs)


class OrganizationUserListAPIView(BaseAPIView):
    def get(self, request):
        org = self.get_organization()
        users = User.objects.filter(organization=org)
        serializer = OrganizationUserSerializer(users, many=True)
        return Response(serializer.data)


class OrganizationUserUpdateDeleteAPIView(BaseAPIView):
    def get_user(self, org, user_id):
        return get_object_or_404(User, id=user_id, organization=org)

    @with_permission_classes([IsSuperAdmin])
    def get(self, request, user_id):
        if str(request.user.id) == str(user_id):
            return Response(
                {"detail": "You cannot view your own details through this endpoint."},
                status=400,
            )

        user = self.get_user(self.get_organization(), user_id)
        serializer = OrganizationUserSerializer(user)
        return Response(serializer.data)

    @with_permission_classes([IsSuperAdmin])
    def patch(self, request, user_id):
        if str(request.user.id) == str(user_id):
            return Response({"detail": "You cannot update your own user account."}, status=400)

        user = self.get_user(self.get_organization(), user_id)
        serializer = OrganizationUserUpdateSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(OrganizationUserSerializer(user).data)
        return Response(serializer.errors, status=400)

    @with_permission_classes([IsSuperAdmin])
    def delete(self, request, user_id):
        if str(request.user.id) == str(user_id):
            return Response({"detail": "You cannot delete yourself."}, status=400)

        user = self.get_user(self.get_organization(), user_id)

        try:
            user.delete()
            return Response({"detail": "User deleted successfully."}, status=204)
        except ProtectedError:
            return Response(
                {
                    "detail": "Cannot delete user — they are assigned as an approver in an "
                    "approval workflow."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
