from rest_framework.permissions import SAFE_METHODS, BasePermission


def _role(request):
    return getattr(request.user, 'role', None)


def _is_authenticated(request):
    return bool(request.user and getattr(request.user, 'is_authenticated', False))


class IsAdmin(BasePermission):
    """Solo usuarios con role='admin'."""

    def has_permission(self, request, view):
        return _is_authenticated(request) and _role(request) == 'admin'


class IsAdminOrScientist(BasePermission):
    """Lectura para cualquier autenticado; escritura solo admin/scientist.

    Se usa en recursos sensibles (personal, proyectos, catálogo de tests)
    donde un asistente no debería poder crear/editar, solo consultar.
    """

    def has_permission(self, request, view):
        if not _is_authenticated(request):
            return False
        if request.method in SAFE_METHODS:
            return True
        return _role(request) in ('admin', 'scientist')
