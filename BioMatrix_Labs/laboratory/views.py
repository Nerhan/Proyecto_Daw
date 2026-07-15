from drf_spectacular.utils import extend_schema_view # (Opcional por si lo usas luego)
from drf_spectacular.openapi import AutoSchema
from rest_framework import viewsets
from rest_framework.permissions import AllowAny

from laboratory.models import (
    User, Scientist, Assistant, Project, Sample, Test, SampleTest, AssistantProject
)
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

class UserViewSet(viewsets.ModelViewSet):
    schema = AutoSchema()
    queryset = User.objects.all().order_by('-id')
    permission_classes = [AllowAny]

    def get_serializer_class(self):
        # Si es una consulta de listado o detalle (GET), devolvemos el JSON anidado complejo
        if self.action in ['list', 'retrieve']:
            return UserDetailSerializer
        return UserSerializer

class ScientistViewSet(viewsets.ModelViewSet):
    schema = AutoSchema()
    queryset = Scientist.objects.all().order_by('-id')
    serializer_class = ScientistSerializer
    permission_classes = [AllowAny]

class AssistantViewSet(viewsets.ModelViewSet):
    schema = AutoSchema()
    queryset = Assistant.objects.all().order_by('-id')
    serializer_class = AssistantSerializer
    permission_classes = [AllowAny]

class ProjectViewSet(viewsets.ModelViewSet):
    schema = AutoSchema()
    queryset = Project.objects.all().order_by('-id')
    permission_classes = [AllowAny]

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return ProjectDetailSerializer
        return ProjectSerializer

class SampleViewSet(viewsets.ModelViewSet):
    schema = AutoSchema()
    queryset = Sample.objects.all().order_by('-id')
    serializer_class = SampleSerializer
    permission_classes = [AllowAny]

class TestViewSet(viewsets.ModelViewSet):
    schema = AutoSchema()
    queryset = Test.objects.all().order_by('-id')
    serializer_class = TestSerializer
    permission_classes = [AllowAny]

class SampleTestViewSet(viewsets.ModelViewSet):
    schema = AutoSchema()
    queryset = SampleTest.objects.all().order_by('-id')
    serializer_class = SampleTestSerializer
    permission_classes = [AllowAny]

class AssistantProjectViewSet(viewsets.ModelViewSet):
    schema = AutoSchema()
    queryset = AssistantProject.objects.all().order_by('-id')
    serializer_class = AssistantProjectSerializer
    permission_classes = [AllowAny]