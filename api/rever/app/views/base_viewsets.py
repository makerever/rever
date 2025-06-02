from typing import Any

from django.db.models import Model
from rest_framework import permissions, viewsets

from rever.app.permissions.organization import IsOrganizationMember


class BaseModelViewSet(viewsets.ModelViewSet):
    """
    Base ModelViewSet that all ModelViewSets should inherit from.
    Subclasses can override get_permission_classes() to add additional permissions
    or use the provided decorators for more fine-grained control.
    """

    permission_classes = [permissions.IsAuthenticated, IsOrganizationMember]

    def get_permissions(self):
        """
        This method returns permission instances based on the permission_classes
        attribute. Subclasses can override this method to add additional permissions
        or implement more complex permission logic.
        """
        return [permission() for permission in self.get_permission_classes()]

    def get_permission_classes(self) -> list[type[permissions.BasePermission]]:
        """
        This method returns the permission_classes attribute by default.
        Subclasses can override this method to add additional permissions
        or implement more complex permission logic.

        Example:
            def get_permission_classes(self):
                # Add IsSuperAdmin permission for this viewset
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

    def get_queryset(self):
        """
        Default implementation to filter queryset by organization.
        Override this method if you need more complex filtering.
        """
        if hasattr(self, "queryset") and self.queryset is not None:
            return self.filter_by_organization(self.queryset)

        # If queryset is not defined, try to get it from the serializer's Meta class
        if hasattr(self, "serializer_class") and hasattr(self.serializer_class, "Meta"):
            model = getattr(self.serializer_class.Meta, "model", None)
            if model is not None:
                return self.filter_by_organization(model.objects.all())

        return super().get_queryset()

    def perform_create(self, serializer):
        """
        Default implementation to set the organization when creating objects.
        """
        serializer.save(organization=self.get_organization())


class BasePublicModelViewSet(viewsets.ModelViewSet):
    """
    Base ModelViewSet for public endpoints that don't require authentication.
    """

    permission_classes = [permissions.AllowAny]

    def get_permissions(self):
        """
        Get the list of permission instances for this viewset.

        This method returns permission instances based on the permission_classes
        attribute. Subclasses can override this method to add additional permissions
        or implement more complex permission logic.
        """
        return [permission() for permission in self.get_permission_classes()]

    def get_permission_classes(self) -> list[type[permissions.BasePermission]]:
        """
        Get the list of permission classes for this viewset.

        This method returns the permission_classes attribute by default.
        Subclasses can override this method to add additional permissions
        or implement more complex permission logic.
        """
        return self.permission_classes
