import django_filters
from drf_spectacular.utils import extend_schema
from rest_framework import serializers as drf_serializers, status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from laboratory.models import (
    User, Scientist, Assistant, Project, Sample, Test, SampleTest, AssistantProject
)
from laboratory.permissions import IsAdminOrReadOnly, IsAdminOrScientist, UserManagementPermission
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

    def _current_user(self):
        user = self.request.user
        return user if getattr(user, 'is_authenticated', False) else None

    def perform_create(self, serializer):
        user = self._current_user()
        serializer.save(created_id=user, modified_id=user)

    def perform_update(self, serializer):
        serializer.save(modified_id=self._current_user())


class UserViewSet(AuditedModelViewSet):
    queryset = User.objects.all().select_related('created_id', 'modified_id').order_by('-id')
    permission_classes = [UserManagementPermission]
    http_method_names = ['get', 'put', 'patch', 'delete', 'head', 'options']
    filterset_fields = ['role', 'status']
    ordering_fields = ['email', 'role', 'status', 'created']

    def get_serializer_class(self):
        # Si es una consulta de listado o detalle (GET), devolvemos el JSON anidado complejo
        if self.action in ['list', 'retrieve']:
            return UserDetailSerializer
        return UserSerializer


class ScientistViewSet(AuditedModelViewSet):
    queryset = Scientist.objects.all().select_related('user', 'created_id', 'modified_id').order_by('-id')
    serializer_class = ScientistSerializer
    permission_classes = [IsAdminOrReadOnly]
    filterset_fields = ['specialty', 'status']
    search_fields = ['names', 'father_surname', 'license_number']
    ordering_fields = ['names', 'father_surname', 'specialty', 'license_number', 'status', 'created']


class AssistantViewSet(AuditedModelViewSet):
    queryset = Assistant.objects.all().select_related('user', 'created_id', 'modified_id').order_by('-id')
    serializer_class = AssistantSerializer
    permission_classes = [IsAdminOrScientist]
    filterset_fields = ['laboratory_zone', 'status']
    search_fields = ['names', 'father_surname']
    ordering_fields = ['names', 'father_surname', 'laboratory_zone', 'shift_hours', 'status', 'created']


class ProjectViewSet(AuditedModelViewSet):
    queryset = Project.objects.all().select_related(
        'scientists', 'scientists__user', 'scientists__created_id', 'scientists__modified_id',
        'created_id', 'modified_id',
    ).order_by('-id')
    permission_classes = [IsAdminOrScientist]
    filterset_fields = ['status', 'scientists']
    search_fields = ['project_name', 'funding_source']
    ordering_fields = ['project_name', 'budget', 'funding_source', 'status', 'created']

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return ProjectDetailSerializer
        return ProjectSerializer


class SampleViewSet(AuditedModelViewSet):
    queryset = Sample.objects.all().select_related('created_id', 'modified_id').order_by('-id')
    serializer_class = SampleSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status', 'sample_type', 'projects']
    search_fields = ['sample_type', 'description']
    ordering_fields = ['sample_type', 'storage_temperature', 'collection_date', 'status', 'created']


class TestViewSet(AuditedModelViewSet):
    queryset = Test.objects.all().select_related('created_id', 'modified_id').order_by('-id')
    serializer_class = TestSerializer
    permission_classes = [IsAdminOrScientist]
    filterset_fields = ['status']
    search_fields = ['test_name']
    ordering_fields = ['test_name', 'estimated_duration', 'status', 'created']


class SampleTestFilter(django_filters.FilterSet):
    status = django_filters.ChoiceFilter(
        choices=[('pending', 'pending'), ('completed', 'completed'), ('rejected', 'rejected')]
    )

    class Meta:
        model = SampleTest
        fields = ['status', 'samples', 'tests']


class SampleTestViewSet(AuditedModelViewSet):
    queryset = SampleTest.objects.all().select_related('created_id', 'modified_id').order_by('-id')
    serializer_class = SampleTestSerializer
    permission_classes = [IsAuthenticated]
    filterset_class = SampleTestFilter
    search_fields = ['result_data']
    ordering_fields = ['test_date', 'status', 'created']


class AssistantProjectViewSet(AuditedModelViewSet):
    queryset = AssistantProject.objects.all().select_related('created_id', 'modified_id').order_by('-id')
    serializer_class = AssistantProjectSerializer
    permission_classes = [IsAdminOrScientist]
    filterset_fields = ['status', 'assistants', 'projects']
    ordering_fields = ['assignment_date', 'status', 'created']


class LoginSerializer(drf_serializers.Serializer):
    email = drf_serializers.EmailField()
    password = drf_serializers.CharField(write_only=True, style={'input_type': 'password'})


class TokenResponseSerializer(drf_serializers.Serializer):
    access = drf_serializers.CharField()
    refresh = drf_serializers.CharField()
    role = drf_serializers.CharField()


class DetailResponseSerializer(drf_serializers.Serializer):
    detail = drf_serializers.CharField()


class LoginView(APIView):
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


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: UserDetailSerializer})
    def get(self, request):
        return Response(UserDetailSerializer(request.user).data)


class ChangePasswordSerializer(drf_serializers.Serializer):
    current_password = drf_serializers.CharField(write_only=True)
    new_password = drf_serializers.CharField(write_only=True, min_length=8)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(request=ChangePasswordSerializer, responses={200: DetailResponseSerializer})
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        if not user.check_password(serializer.validated_data['current_password']):
            return Response(
                {'current_password': ['La contraseña actual es incorrecta.']},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({'detail': 'Contraseña actualizada correctamente.'})
