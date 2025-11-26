import os
import requests
from django.conf import settings
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import generics
from django_filters.rest_framework import DjangoFilterBackend
from .models import Segmento, MedicionTrafico
from .serializers import SegmentoMapSerializer, MedicionStatsSerializer

# VISTA 1: API GEOESPACIAL (Para el Mapa)
# Devuelve los tramos en formato GeoJSON estándar (RFC 7946)
class Segmentos(generics.ListAPIView):
    """
    Retorna los segmentos de carretera con sus coordenadas geométricas.
    Ideal para librerías de mapas como Leaflet o Mapbox.
    """
    queryset = Segmento.objects.all()
    serializer_class = SegmentoMapSerializer
    pagination_class = None # No paginamos el mapa, queremos todos los tramos

# VISTA 2: API DE DATOS (Para Gráficos/Dashboard)
# Devuelve el historial de mediciones de tráfico
class MedicionList(generics.ListAPIView):
    """
    Retorna el historial de mediciones de velocidad y congestión.
    Se puede filtrar por 'segmento' o 'nivel_congestion'.
    """
    queryset = MedicionTrafico.objects.all().order_by('-fecha_hora')
    serializer_class = MedicionStatsSerializer
    
    # Configuración de Filtros (ej: /api/mediciones/?segmento=1)
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['segmento', 'nivel_congestion']

@swagger_auto_schema(
    method='post',
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        properties={
            'coordinates': openapi.Schema(
                type=openapi.TYPE_ARRAY,
                items=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'lat': openapi.Schema(type=openapi.TYPE_NUMBER, example=13.676),
                        'lng': openapi.Schema(type=openapi.TYPE_NUMBER, example=-89.29),
                    }
                ),
                example=[
                    {"lat": 13.676, "lng": -89.29},
                    {"lat": 13.680, "lng": -89.300},
                    {"lat": 13.692, "lng": -89.315}
                ]
            ),
        },
        required=['coordinates']
    )
)

@api_view(['POST'])
def matrix_api(request):
    """
    Calcula los tiempos y distancias entre varios puntos usando Mapbox Matrix API.
    """
    coordinates = request.data.get("coordinates", None)

    if not coordinates or len(coordinates) < 2:
        return Response({"error": "Debes enviar al menos dos coordenadas."}, status=400)

    # Construcción del string de coordenadas para Mapbox
    coords_str = ";".join([f"{c['lng']},{c['lat']}" for c in coordinates])

    # Token desde settings.py (cargado con os.getenv)
    access_token = settings.MAPBOX_ACCESS_TOKEN

    # URL de Matrix API 
    url = (
        f"https://api.mapbox.com/directions-matrix/v1/mapbox/driving-traffic/"
        f"{coords_str}?annotations=duration,distance&access_token={access_token}"
    )

    response = requests.get(url)
    data = response.json()

    return Response(data)