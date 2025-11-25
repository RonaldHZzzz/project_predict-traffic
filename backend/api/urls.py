from django.urls import path
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from trafico.views import Segmentos, MedicionList

# --- Configuración de Swagger ---
schema_view = get_schema_view(
   openapi.Info(
      title="API de Tráfico - Los Chorros",
      default_version='v1',
      terms_of_service="https://www.google.com/policies/terms/",
      contact=openapi.Contact(email="contacto@itca.edu.sv"),
      license=openapi.License(name="BSD License"),
   ),
   public=True,
   permission_classes=(permissions.AllowAny,),
)

# --- Rutas de la API ---
urlpatterns = [
    # 1. Endpoints de Datos
    path('segmentos/', Segmentos.as_view(), name='segmentos'),
    path('mediciones/', MedicionList.as_view(), name='mediciones-list'),

    # 2. Documentación Swagger (UI)
    path('swagger<format>/', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]