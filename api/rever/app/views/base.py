from typing import Any

from django.db.models import Model
from rest_framework import permissions
from rest_framework.views import APIView

from rever.app.permissions.organization import IsOrganizationMember


class BaseAPIView(APIView):
    """
    Base API View that all views should inherit from.

    By default, this view requires authentication and organization membership.
    It provides helper methods for organization-based filtering and permission checks.

    Subclasses can override get_permission_classes() to add additional permissions
    or use the provided decorators and mixins for more fine-grained control.
    """

    permission_classes = [permissions.IsAuthenticated, IsOrganizationMember]

    def get_permissions(self):
        """
        Get the list of permission instances for this view.

        This method returns permission instances based on the permission_classes
        attribute. Subclasses can override this method to add additional permissions
        or implement more complex permission logic.
        """
        return [permission() for permission in self.get_permission_classes()]

    def get_permission_classes(self) -> list[type[permissions.BasePermission]]:
        """
        Get the list of permission classes for this view.

        This method returns the permission_classes attribute by default.
        Subclasses can override this method to add additional permissions
        or implement more complex permission logic.

        Example:
            def get_permission_classes(self):
                # Add IsSuperAdmin permission for this view
                return super().get_permission_classes() + [IsSuperAdmin]
        """
        return self.permission_classes

    def get_organization(self):
        """Get the current user's organization"""
        return self.request.user.organization

    def filter_by_organization(self, queryset):
        """Filter a queryset by the current user's organization"""
        return queryset.filter(organization=self.get_organization())

    def check_object_organization(self, obj):
        """
        Check if an object belongs to the current user's organization.
        Returns True if the object belongs to the user's organization, False otherwise.
        """
        if hasattr(obj, "organization"):
            return obj.organization == self.get_organization()
        return False

    def get_object_by_id(self, model_class: type[Model], object_id: Any) -> Model | None:
        """
        Get an object by ID, ensuring it belongs to the current user's organization.
        Returns None if the object doesn't exist or doesn't belong to the user's organization.
        """
        try:
            obj = model_class.objects.get(id=object_id)
            if self.check_object_organization(obj):
                return obj
            return None
        except model_class.DoesNotExist:
            return None


class BasePublicAPIView(APIView):
    """
    Base API View for public endpoints that don't require authentication.
    """

    permission_classes = [permissions.AllowAny]

    def get_permissions(self):
        """
        Get the list of permission instances for this view.

        This method returns permission instances based on the permission_classes
        attribute. Subclasses can override this method to add additional permissions
        or implement more complex permission logic.
        """
        return [permission() for permission in self.get_permission_classes()]

    def get_permission_classes(self) -> list[type[permissions.BasePermission]]:
        """
        Get the list of permission classes for this view.

        This method returns the permission_classes attribute by default.
        Subclasses can override this method to add additional permissions
        or implement more complex permission logic.
        """
        return self.permission_classes
