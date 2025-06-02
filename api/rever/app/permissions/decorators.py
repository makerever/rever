from collections.abc import Callable
from functools import wraps
from typing import Any

from rest_framework import permissions


def with_additional_permissions(permission_classes: list[type[permissions.BasePermission]]):
    """
    Decorator to add additional permission classes to a view method.

    This decorator can be applied to view methods (get, post, put, etc.) to add
    additional permission checks on top of the view's default permission_classes.

    Example usage:

    class MyView(BaseAPIView):
        @with_additional_permissions([IsSuperAdmin])
        def post(self, request):
            # Only super admins can access this method
            ...

    Args:
        permission_classes: List of permission classes to add
    """

    def decorator(view_method: Callable) -> Callable:
        @wraps(view_method)
        def wrapper(self, request, *args, **kwargs) -> Any:
            view_permission_classes = getattr(self, "permission_classes", [])

            all_permissions = [perm() for perm in view_permission_classes + permission_classes]

            for permission in all_permissions:
                if not permission.has_permission(request, self):
                    self.permission_denied(request, message=getattr(permission, "message", None))

            # If we get here, all permissions passed
            return view_method(self, request, *args, **kwargs)

        return wrapper

    return decorator


def with_permission_classes(permission_classes: list[type[permissions.BasePermission]]):
    """
    Decorator to replace the view's permission classes for a specific method.

    Unlike with_additional_permissions, this decorator completely replaces
    the view's permission_classes for the decorated method.

    Example usage:

    class MyView(BaseAPIView):
        @with_permission_classes([IsSuperAdmin])
        def post(self, request):
            # Only super admins can access this method, ignoring the view's default permissions
            ...

    Args:
        permission_classes: List of permission classes to use
    """

    def decorator(view_method: Callable) -> Callable:
        @wraps(view_method)
        def wrapper(self, request, *args, **kwargs) -> Any:
            all_permissions = [perm() for perm in permission_classes]

            for permission in all_permissions:
                if not permission.has_permission(request, self):
                    self.permission_denied(request, message=getattr(permission, "message", None))

            # If we get here, all permissions passed
            return view_method(self, request, *args, **kwargs)

        return wrapper

    return decorator
