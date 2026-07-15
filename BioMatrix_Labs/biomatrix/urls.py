from django.urls import path, include
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from laboratory.views import (
    UserViewSet, ScientistViewSet, AssistantViewSet, ProjectViewSet,
    SampleViewSet, TestViewSet, SampleTestViewSet, AssistantProjectViewSet,
    LoginView
)
# IMPORTAR ESTO PARA LA DOCUMENTACIÓN:
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

from rest_framework_simplejwt.views import TokenRefreshView

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'scientists', ScientistViewSet, basename='scientist')
router.register(r'assistants', AssistantViewSet, basename='assistant')
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'samples', SampleViewSet, basename='sample')
router.register(r'tests', TestViewSet, basename='test')
router.register(r'sample-tests', SampleTestViewSet, basename='sample-test')
router.register(r'assistant-projects', AssistantProjectViewSet, basename='assistant-project')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    
    # --- ENDPOINTS DE SWAGGER ---
    # Genera el archivo schema.yml (el esquema crudo de OpenAPI)
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    # Renderiza la hermosa interfaz gráfica interactiva de Swagger UI
    path('api/docs/swagger/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    # Renderiza la interfaz alternativa Redoc (es super limpia y elegante)
    path('api/docs/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    
    # Login contra laboratory.User (no contra el User interno de Django).
    path('api/token/', LoginView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]