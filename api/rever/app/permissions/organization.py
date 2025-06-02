from rest_framework import permissions


class IsOrganizationMember(permissions.BasePermission):
    def has_permission(self, request, view):
        # This is a preliminary check before object-level permissions.
        return (
            request.user
            and request.user.is_authenticated
            and hasattr(request.user, "organization")
            and request.user.organization is not None
        )

    def has_object_permission(self, request, view, obj):
        """
        - Objects with direct organization attribute
        - Objects with related models that have organization (e.g., bill items)
        """
        # If the object has an organization attribute
        if hasattr(obj, "organization"):
            return obj.organization == request.user.organization

        # For related objects that might have organization through a relation
        # Example: BillItem has organization through bill
        if hasattr(obj, "bill") and hasattr(obj.bill, "organization"):
            return obj.bill.organization == request.user.organization

        # For attachment objects that might have content_object with organization
        if hasattr(obj, "content_object") and hasattr(obj.content_object, "organization"):
            return obj.content_object.organization == request.user.organization

        # If we can't determine the organization, deny access
        return False


class IsSuperAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        from rever.db.models.auth import User

        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == User.Role.SUPER_ADMIN
        )


class IsSuperAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        from rever.db.models.auth import User

        # Allow GET, HEAD, OPTIONS requests for authenticated users
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated

        # Restrict other methods to super admins
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == User.Role.SUPER_ADMIN
        )


class IsFinanceManager(permissions.BasePermission):
    def has_permission(self, request, view):
        from rever.db.models.auth import User

        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == User.Role.FINANCE_MANAGER
        )


class IsFinanceManagerOrSuperAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        from rever.db.models.auth import User

        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in [User.Role.FINANCE_MANAGER, User.Role.SUPER_ADMIN]
        )
