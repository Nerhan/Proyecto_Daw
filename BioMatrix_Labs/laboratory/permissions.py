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
    """Reglas de gestión de cuentas (UserViewSet).

    No existe auto-registro público: crear cuentas es una acción de gestión.
    - admin: acceso completo (leer, crear con cualquier rol, editar, borrar).
    - scientist: puede listar/leer y crear cuentas, pero la vista fuerza que
      el rol creado sea 'assistant' (ver UserViewSet.create); no puede
      editar ni borrar usuarios.
    - assistant: sin acceso a este recurso.
    """

    def has_permission(self, request, view):
        if not _is_authenticated(request):
            return False
        role = _role(request)
        if role == 'admin':
            return True
        if role == 'scientist':
            return request.method in SAFE_METHODS or view.action == 'create'
        return False
