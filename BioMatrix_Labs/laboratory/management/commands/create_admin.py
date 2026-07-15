import getpass

from django.core.management.base import BaseCommand, CommandError

from laboratory.models import User
from laboratory.validators import validate_unsa_email
from django.core.exceptions import ValidationError


class Command(BaseCommand):
    """Crea la primera cuenta admin de laboratory.User.

    Necesario porque el auto-registro público está deshabilitado: dar de
    alta usuarios es una acción de gestión reservada a admin/scientist
    (ver laboratory.permissions.UserManagementPermission), así que el primer
    admin del sistema no puede crearse a través de la API.
    """

    help = 'Crea una cuenta admin de laboratory.User (bootstrap inicial del sistema).'

    def add_arguments(self, parser):
        parser.add_argument('--email', help='Email institucional (@unsa.edu.pe)')
        parser.add_argument('--password', help='Contraseña (si se omite, se pide de forma interactiva)')

    def handle(self, *args, **options):
        email = options.get('email') or input('Email institucional (@unsa.edu.pe): ')
        email = email.strip().lower()

        try:
            validate_unsa_email(email)
        except ValidationError as e:
            raise CommandError('; '.join(e.messages))

        if User.objects.filter(email=email).exists():
            raise CommandError(f'Ya existe un usuario con el email {email}.')

        password = options.get('password')
        if not password:
            password = getpass.getpass('Contraseña: ')
            confirm = getpass.getpass('Confirmar contraseña: ')
            if password != confirm:
                raise CommandError('Las contraseñas no coinciden.')

        if len(password) < 8:
            raise CommandError('La contraseña debe tener al menos 8 caracteres.')

        user = User(email=email, role='admin', status='active')
        user.set_password(password)
        user.save()

        self.stdout.write(self.style.SUCCESS(f'Admin creado: {user.email} (id={user.id})'))
