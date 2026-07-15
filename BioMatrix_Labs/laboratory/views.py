from drf_spectacular.utils import extend_schema
from rest_framework import serializers as drf_serializers, status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from laboratory.models import (
    User, Scientist, Assistant, Project, Sample, Test, SampleTest, AssistantProject
)
from laboratory.permissions import IsAdminOrScientist
from laboratory.serializers import (
    UserSerializer, UserDetailSerializer,
    ScientistSerializer,
    AssistantSerializer,
    ProjectSerializer, ProjectDetailSerializer,
    SampleSerializer,
    TestSerializer,
    SampleTestSerializer,
    AssistantProjectSerializer
)


class AuditedModelViewSet(viewsets.ModelViewSet):
    """Rellena created_id/modified_id con el usuario autenticado.

    Queda en None cuando el registro se crea sin sesión (p. ej. el
    auto-registro en UserViewSet.create, que es AllowAny).
    """

    def _current_user(self):
        user = self.request.user
        return user if getattr(user, 'is_authenticated', False) else None

    def perform_create(self, serializer):
        user = self._current_user()
        serializer.save(created_id=user, modified_id=user)

    def perform_update(self, serializer):
        serializer.save(modified_id=self._current_user())


class UserViewSet(AuditedModelViewSet):
    queryset = User.objects.all().order_by('-id')

    def get_serializer_class(self):
        # Si es una consulta de listado o detalle (GET), devolvemos el JSON anidado complejo
        if self.action in ['list', 'retrieve']:
            return UserDetailSerializer
        return UserSerializer

    def get_permissions(self):
        # El registro (create) es la única vía para dar de alta el primer
        # usuario del sistema, por eso queda abierto; el resto de acciones
        # requiere estar autenticado.
        if self.action == 'create':
            return [AllowAny()]
        return [IsAuthenticated()]


class ScientistViewSet(AuditedModelViewSet):
    queryset = Scientist.objects.all().order_by('-id')
    serializer_class = ScientistSerializer
    permission_classes = [IsAdminOrScientist]
    filterset_fields = ['specialty', 'status']
    search_fields = ['names', 'father_surname', 'license_number']


class AssistantViewSet(AuditedModelViewSet):
    queryset = Assistant.objects.all().order_by('-id')
    serializer_class = AssistantSerializer
    permission_classes = [IsAdminOrScientist]
    filterset_fields = ['laboratory_zone', 'status']
    search_fields = ['names', 'father_surname']


class ProjectViewSet(AuditedModelViewSet):
    queryset = Project.objects.all().order_by('-id')
    permission_classes = [IsAdminOrScientist]
    filterset_fields = ['status', 'scientists']
    search_fields = ['project_name', 'funding_source']

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return ProjectDetailSerializer
        return ProjectSerializer


class SampleViewSet(AuditedModelViewSet):
    queryset = Sample.objects.all().order_by('-id')
    serializer_class = SampleSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status', 'sample_type', 'projects']
    search_fields = ['sample_type', 'description']


class TestViewSet(AuditedModelViewSet):
    queryset = Test.objects.all().order_by('-id')
    serializer_class = TestSerializer
    permission_classes = [IsAdminOrScientist]
    filterset_fields = ['status']
    search_fields = ['test_name']


class SampleTestViewSet(AuditedModelViewSet):
    # Cualquier usuario autenticado (incluye assistant) puede registrar y
    # actualizar resultados: es el trabajo diario de laboratorio.
    queryset = SampleTest.objects.all().order_by('-id')
    serializer_class = SampleTestSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status', 'samples', 'tests']
    search_fields = ['result_data']


class AssistantProjectViewSet(AuditedModelViewSet):
    # Asignar personal a un proyecto es una decisión de gestión, no trabajo
    # de banco: solo admin/scientist.
    queryset = AssistantProject.objects.all().order_by('-id')
    serializer_class = AssistantProjectSerializer
    permission_classes = [IsAdminOrScientist]
    filterset_fields = ['status', 'assistants', 'projects']


class LoginSerializer(drf_serializers.Serializer):
    email = drf_serializers.EmailField()
    password = drf_serializers.CharField(write_only=True, style={'input_type': 'password'})


class TokenResponseSerializer(drf_serializers.Serializer):
    access = drf_serializers.CharField()
    refresh = drf_serializers.CharField()
    role = drf_serializers.CharField()


class LoginView(APIView):
    """Login contra laboratory.User (el modelo de dominio real de la app),
    no contra el User interno de Django que solo se usa para /admin/."""

    permission_classes = [AllowAny]

    @extend_schema(request=LoginSerializer, responses={200: TokenResponseSerializer})
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email'].strip().lower()
        password = serializer.validated_data['password']

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'detail': 'Credenciales inválidas.'}, status=status.HTTP_401_UNAUTHORIZED)

        if user.status != 'active' or not user.check_password(password):
            return Response({'detail': 'Credenciales inválidas.'}, status=status.HTTP_401_UNAUTHORIZED)

        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'role': user.role,
        })
