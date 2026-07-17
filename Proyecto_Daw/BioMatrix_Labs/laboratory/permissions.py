from rest_framework.permissions import SAFE_METHODS, BasePermission


def _role(request):
    return getattr(request.user, 'role', None)


def _is_authenticated(request):
    return bool(request.user and getattr(request.user, 'is_authenticated', False))


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return _is_authenticated(request) and _role(request) == 'admin'


class IsAdminOrScientist(BasePermission):
    def has_permission(self, request, view):
        if not _is_authenticated(request):
            return False
        if request.method in SAFE_METHODS:
            return True
        return _role(request) in ('admin', 'scientist')


class UserManagementPermission(BasePermission):
    def has_permission(self, request, view):
        return _is_authenticated(request) and _role(request) == 'admin'


class IsAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if not _is_authenticated(request):
            return False
        if request.method in SAFE_METHODS:
            return True
        return _role(request) == 'admin'
