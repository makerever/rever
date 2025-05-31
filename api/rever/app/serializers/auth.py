from django.contrib.auth import authenticate
from django.utils import timezone
from django.utils.timezone import now, timedelta
from pytz import common_timezones
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

# from django.contrib.auth import get_user_model
from rever.db.models import Organization, User
from rever.utils.mixins import OrganizationDateFormatMixin

# User = get_user_model()


class EmailStartSerializer(serializers.Serializer):
    email = serializers.EmailField()


class EmailVerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6)


class SignupCompleteSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    org_name = serializers.CharField()
    currency = serializers.ChoiceField(
        choices=Organization.CURRENCY_CHOICES, required=False, default="USD"
    )


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    remember_me = serializers.BooleanField(default=False)

    def validate(self, attrs):
        user = authenticate(username=attrs["email"], password=attrs["password"])
        if not user:
            raise serializers.ValidationError("Invalid credentials.")
        if not user.email_verified:
            raise serializers.ValidationError("E-mail not verified.")
        attrs["user"] = user
        return attrs

    def create(self, validated):
        user = validated["user"]
        refresh = RefreshToken.for_user(user)
        if validated["remember_me"]:
            refresh.set_exp(lifetime=timezone.timedelta(days=180))
        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }


class OTPLoginStartSerializer(serializers.Serializer):
    email = serializers.EmailField()


class OTPLoginVerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6)


class PasswordForgotSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6)
    new_password = serializers.CharField(write_only=True, min_length=8)


class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate_old_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password incorrect.")
        return value


class InviteUserSerializer(serializers.Serializer):
    email = serializers.EmailField()
    role = serializers.ChoiceField(choices=User.Role.choices)


class InvitedUserSerializer(serializers.ModelSerializer):
    invited_by = serializers.SerializerMethodField()
    organization = serializers.CharField(source="organization.name")
    status = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "email", "role", "invited_by", "organization", "status"]

    def get_invited_by(self, obj):
        return obj.invited_by.get_full_name() if obj.invited_by else None

    def get_status(self, obj):
        if obj.invited_at and now() - obj.invited_at > timedelta(hours=24):
            return "expired"
        return "pending"


class CompleteSignupSerializer(serializers.Serializer):
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    password = serializers.CharField(min_length=8, write_only=True)


class OrganizationSerializer(OrganizationDateFormatMixin, serializers.ModelSerializer):
    member_count = serializers.SerializerMethodField()

    class Meta:
        model = Organization
        fields = [
            "id",
            "name",
            "date_format",
            "created_at",
            "updated_at",
            "currency",
            "member_count",
        ]
        read_only_fields = ["id", "name", "created_at", "updated_at"]

    def get_member_count(self, obj):
        return obj.users.count()

    def validate_name(self, value):
        self.context.get("request")
        org_id = self.instance.id if self.instance else None

        if Organization.objects.filter(name__iexact=value).exclude(id=org_id).exists():
            raise serializers.ValidationError("An organization with this name already exists.")
        return value


class MeSerializer(serializers.ModelSerializer):
    organization = OrganizationSerializer(read_only=True)
    timezone = serializers.ChoiceField(
        choices=[(tz, tz) for tz in common_timezones], default="UTC"
    )

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "role",
            "organization",
            "timezone",
        ]
        read_only_fields = ["id", "email", "role", "organization"]


class OrganizationUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "first_name", "last_name", "email", "role"]


class OrganizationUserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["first_name", "last_name", "email", "role"]
        extra_kwargs = {"email": {"required": True}}
