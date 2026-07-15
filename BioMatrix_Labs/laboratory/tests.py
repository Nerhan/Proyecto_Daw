from django.core.exceptions import ValidationError
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase

from laboratory.models import Assistant, Project, Scientist, User
from laboratory.validators import (
    validate_license_length,
    validate_positive_budget,
    validate_positive_duration,
    validate_shift_format,
    validate_storage_temperature,
    validate_unsa_email,
)


class ValidatorTests(TestCase):
    def test_unsa_email_accepts_institutional_domain(self):
        validate_unsa_email('alumno@unsa.edu.pe')  # no debe lanzar

    def test_unsa_email_rejects_other_domains(self):
        with self.assertRaises(ValidationError):
            validate_unsa_email('alumno@gmail.com')

    def test_shift_format_rejects_short_values(self):
        with self.assertRaises(ValidationError):
            validate_shift_format('AM')

    def test_shift_format_accepts_descriptive_values(self):
        validate_shift_format('Mañana')

    def test_license_length_rejects_short_values(self):
        with self.assertRaises(ValidationError):
            validate_license_length('AB1')

    def test_positive_budget_rejects_negative(self):
        with self.assertRaises(ValidationError):
            validate_positive_budget(-100)

    def test_positive_budget_accepts_zero_and_positive(self):
        validate_positive_budget(0)
        validate_positive_budget(1500)

    def test_storage_temperature_rejects_above_4c(self):
        with self.assertRaises(ValidationError):
            validate_storage_temperature(4.1)

    def test_storage_temperature_accepts_4c_or_below(self):
        validate_storage_temperature(4.0)
        validate_storage_temperature(-20)

    def test_positive_duration_rejects_zero_and_negative(self):
        with self.assertRaises(ValidationError):
            validate_positive_duration(0)
        with self.assertRaises(ValidationError):
            validate_positive_duration(-10)


class UserPasswordTests(TestCase):
    def test_set_password_hashes_and_check_password_verifies(self):
        user = User(email='hash@unsa.edu.pe')
        user.set_password('claveSegura123')
        self.assertNotEqual(user.password_hash, 'claveSegura123')
        self.assertTrue(user.check_password('claveSegura123'))
        self.assertFalse(user.check_password('otraClave'))


class AuthFlowTests(APITestCase):
    def test_anonymous_self_registration_is_rejected(self):
        # No existe auto-registro público: dar de alta usuarios es una
        # acción de gestión (solo admin/scientist autenticados).
        response = self.client.post('/api/users/', {
            'email': 'nuevo@unsa.edu.pe',
            'password': 'claveSegura123',
            'role': 'assistant',
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(User.objects.filter(email='nuevo@unsa.edu.pe').exists())

    def test_login_with_wrong_password_is_rejected(self):
        user = User(email='login@unsa.edu.pe', role='admin')
        user.set_password('claveCorrecta')
        user.save()

        response = self.client.post('/api/token/', {
            'email': 'login@unsa.edu.pe',
            'password': 'claveIncorrecta',
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_suspended_user_cannot_authenticate_requests(self):
        user = User(email='suspendido@unsa.edu.pe', role='admin', status='suspended')
        user.set_password('claveSegura123')
        user.save()
        login_response = self.client.post('/api/token/', {
            'email': 'suspendido@unsa.edu.pe',
            'password': 'claveSegura123',
        })
        self.assertEqual(login_response.status_code, status.HTTP_401_UNAUTHORIZED)


class RolePermissionTests(APITestCase):
    def setUp(self):
        self.admin_user = self._create_user('admin@unsa.edu.pe', 'admin')
        self.scientist_user = self._create_user('cientifico@unsa.edu.pe', 'scientist')
        self.assistant_user = self._create_user('asistente@unsa.edu.pe', 'assistant')

        self.scientist_profile = Scientist.objects.create(
            names='Ana', father_surname='Perez', mother_surname='Lopez',
            specialty='Genetica', license_number='LIC-12345', user=self.scientist_user,
        )

    def _create_user(self, email, role):
        user = User(email=email, role=role)
        user.set_password('claveSegura123')
        user.save()
        return user

    def _auth_client(self, email):
        response = self.client.post('/api/token/', {'email': email, 'password': 'claveSegura123'})
        access = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')

    def test_anonymous_cannot_list_projects(self):
        response = self.client.get('/api/projects/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_assistant_cannot_create_project(self):
        self._auth_client('asistente@unsa.edu.pe')
        response = self.client.post('/api/projects/', {
            'project_name': 'Proyecto X',
            'scientists': str(self.scientist_profile.id),
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_create_project_and_audit_fields_are_set(self):
        self._auth_client('admin@unsa.edu.pe')
        response = self.client.post('/api/projects/', {
            'project_name': 'Proyecto Y',
            'scientists': str(self.scientist_profile.id),
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        project = Project.objects.get(id=response.data['id'])
        self.assertEqual(project.created_id_id, self.admin_user.id)
        self.assertEqual(project.modified_id_id, self.admin_user.id)

    def test_assistant_can_read_projects(self):
        Project.objects.create(project_name='Proyecto Z', scientists=self.scientist_profile)
        self._auth_client('asistente@unsa.edu.pe')
        response = self.client.get('/api/projects/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class UserManagementPermissionTests(APITestCase):
    """Solo la gestión de cuentas (UserViewSet) puede dar de alta usuarios,
    y un científico solo puede crear cuentas de asistente."""

    def setUp(self):
        self.admin_user = self._create_user('admin@unsa.edu.pe', 'admin')
        self.scientist_user = self._create_user('cientifico@unsa.edu.pe', 'scientist')
        self.assistant_user = self._create_user('asistente@unsa.edu.pe', 'assistant')

    def _create_user(self, email, role):
        user = User(email=email, role=role)
        user.set_password('claveSegura123')
        user.save()
        return user

    def _auth_client(self, email):
        response = self.client.post('/api/token/', {'email': email, 'password': 'claveSegura123'})
        access = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')

    def test_admin_can_create_user_with_any_role(self):
        self._auth_client('admin@unsa.edu.pe')
        response = self.client.post('/api/users/', {
            'email': 'nuevo.cientifico@unsa.edu.pe',
            'password': 'claveSegura123',
            'role': 'scientist',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_scientist_can_create_assistant_user(self):
        self._auth_client('cientifico@unsa.edu.pe')
        response = self.client.post('/api/users/', {
            'email': 'nuevo.asistente@unsa.edu.pe',
            'password': 'claveSegura123',
            'role': 'assistant',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_scientist_cannot_create_scientist_or_admin_user(self):
        self._auth_client('cientifico@unsa.edu.pe')
        response = self.client.post('/api/users/', {
            'email': 'otro.cientifico@unsa.edu.pe',
            'password': 'claveSegura123',
            'role': 'scientist',
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(User.objects.filter(email='otro.cientifico@unsa.edu.pe').exists())

    def test_assistant_cannot_access_users_endpoint(self):
        self._auth_client('asistente@unsa.edu.pe')
        list_response = self.client.get('/api/users/')
        self.assertEqual(list_response.status_code, status.HTTP_403_FORBIDDEN)

        create_response = self.client.post('/api/users/', {
            'email': 'intento@unsa.edu.pe',
            'password': 'claveSegura123',
            'role': 'assistant',
        })
        self.assertEqual(create_response.status_code, status.HTTP_403_FORBIDDEN)

    def test_scientist_cannot_update_or_delete_users(self):
        self._auth_client('cientifico@unsa.edu.pe')
        update_response = self.client.patch(
            f'/api/users/{self.assistant_user.id}/', {'status': 'suspended'}
        )
        self.assertEqual(update_response.status_code, status.HTTP_403_FORBIDDEN)

        delete_response = self.client.delete(f'/api/users/{self.assistant_user.id}/')
        self.assertEqual(delete_response.status_code, status.HTTP_403_FORBIDDEN)
