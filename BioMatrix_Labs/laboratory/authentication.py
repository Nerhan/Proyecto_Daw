from drf_spectacular.extensions import OpenApiAuthenticationExtension
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import AuthenticationFailed, InvalidToken

from laboratory.models import User


class LaboratoryJWTAuthentication(JWTAuthentication):
    """Autentica contra laboratory.User en lugar del AUTH_USER_MODEL por
    defecto de Django, que en este proyecto solo se usa para /admin/."""

    def get_user(self, validated_token):
        user_id = validated_token.get('user_id')
        if user_id is None:
            raise InvalidToken('El token no contiene un user_id válido.')

        try:
            user = User.objects.get(id=user_id)
        except (User.DoesNotExist, ValueError, TypeError):
            raise AuthenticationFailed('Usuario no encontrado.', code='user_not_found')

        if user.status != 'active':
            raise AuthenticationFailed('Usuario inactivo o suspendido.', code='user_inactive')

        return user


class LaboratoryJWTAuthenticationScheme(OpenApiAuthenticationExtension):
    """Le dice a drf-spectacular cómo documentar LaboratoryJWTAuthentication
    (reutiliza el esquema 'BearerAuth' ya declarado en SPECTACULAR_SETTINGS)."""

    target_class = LaboratoryJWTAuthentication
    name = 'BearerAuth'

    def get_security_definition(self, auto_schema):
        return {
            'type': 'http',
            'scheme': 'bearer',
            'bearerFormat': 'JWT',
        }
