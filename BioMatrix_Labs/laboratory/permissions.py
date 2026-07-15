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


class UserManagementPermission(BasePermission):
    """Reglas de gestión de cuentas (UserViewSet). Reservado a admin.

    No existe auto-registro ni alta directa de cuentas aquí (no se admite
    POST, ver UserViewSet.http_method_names): las cuentas de scientist se
    crean junto con su perfil de Científico, y las de assistant junto con su
    perfil de Asistente (ver ScientistSerializer/AssistantSerializer). Esta
    vista solo sirve para que el admin administre cuentas ya existentes
    (activar/suspender, cambiar email o contraseña, eliminar).
    """

    def has_permission(self, request, view):
        return _is_authenticated(request) and _role(request) == 'admin'


class IsAdminOrReadOnly(BasePermission):
    """Lectura para cualquier autenticado; escritura solo admin.

    Se usa en Científicos: dar de alta o editar un científico implica
    gestionar su cuenta de acceso (email/password), igual que en
    UserManagementPermission, así que queda reservado al admin.
    """

    def has_permission(self, request, view):
        if not _is_authenticated(request):
            return False
        if request.method in SAFE_METHODS:
            return True
        return _role(request) == 'admin'
