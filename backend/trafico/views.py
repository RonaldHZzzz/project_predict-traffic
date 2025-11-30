import os
import requests
from django.conf import settings

from django.shortcuts import get_object_or_404
from django.contrib.gis.measure import D

from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import generics, status

from django_filters.rest_framework import DjangoFilterBackend

from .models import Segmento, MedicionTrafico, ParadaBus
from .serializers import (
    SegmentoMapSerializer,
    MedicionStatsSerializer,
    ParadaBusSerializer,
)

# -------------------------------
# VISTA 1: API GEOESPACIAL (MAPA)
# -------------------------------
class Segmentos(generics.ListAPIView):
    """
    Retorna los segmentos de carretera con sus coordenadas geométricas.
    Ideal para librerías de mapas como Leaflet o Mapbox.
    """
    queryset = Segmento.objects.all()
    serializer_class = SegmentoMapSerializer
    pagination_class = None  # No paginamos el mapa, queremos todos los tramos


# --------------------------------------
# VISTA 2: API DE DATOS (GRÁFICOS/DASH)
# --------------------------------------
class MedicionList(generics.ListAPIView):
    """
    Retorna el historial de mediciones de velocidad y congestión.
    Se puede filtrar por 'segmento' o 'nivel_congestion'.
    """
    queryset = MedicionTrafico.objects.all().order_by("-fecha_hora")
    serializer_class = MedicionStatsSerializer

    # Configuración de Filtros (ej: /trafico/mediciones/?segmento=1)
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["segmento", "nivel_congestion"]


# -----------------------------
# MATRIX API (MAPBOX)
# -----------------------------
@swagger_auto_schema(
    method="post",
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        properties={
            "coordinates": openapi.Schema(
                type=openapi.TYPE_ARRAY,
                items=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        "lat": openapi.Schema(
                            type=openapi.TYPE_NUMBER, example=13.676
                        ),
                        "lng": openapi.Schema(
                            type=openapi.TYPE_NUMBER, example=-89.29
                        ),
                    },
                ),
                example=[
                    {"lat": 13.676, "lng": -89.29},
                    {"lat": 13.680, "lng": -89.300},
                    {"lat": 13.692, "lng": -89.315},
                ],
            ),
        },
        required=["coordinates"],
    ),
)
@api_view(["POST"])
def matrix_api(request):
    """
    Calcula los tiempos y distancias entre varios puntos usando Mapbox Matrix API.
    """
    coordinates = request.data.get("coordinates", None)

    if not coordinates or len(coordinates) < 2:
        return Response(
            {"error": "Debes enviar al menos dos coordenadas."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Construcción del string de coordenadas para Mapbox
    coords_str = ";".join([f"{c['lng']},{c['lat']}" for c in coordinates])

    # Token desde settings.py (cargado con os.getenv)
    access_token = settings.MAPBOX_ACCESS_TOKEN

    # URL de Matrix API
    url = (
        "https://api.mapbox.com/directions-matrix/v1/mapbox/driving-traffic/"
        f"{coords_str}?annotations=duration,distance&access_token={access_token}"
    )

    response = requests.get(url)
    data = response.json()

    return Response(data)


# ------------------------------
# NUEVAS VISTAS: PARADAS DE BUS
# ------------------------------
from django.shortcuts import get_object_or_404
from django.contrib.gis.measure import D
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .models import Segmento, ParadaBus
from .serializers import ParadaBusSerializer


@api_view(["GET"])
def paradas_todos_segmentos(request):
    """
    Devuelve TODAS las paradas de bus.
    Endpoint: /trafico/paradas/
    """
    paradas = ParadaBus.objects.all()
    serializer = ParadaBusSerializer(paradas, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["GET"])
def paradas_por_segmento(request, segmento_id):
    """
    Devuelve las paradas cercanas a la geometría del segmento.
    Usa distancia en metros (convertida a grados).
    Si no encuentra nada, intenta por segmento_id.
    """
    segmento = get_object_or_404(Segmento, pk=segmento_id)

    # Aumentamos el radio por defecto a 300m (puedes subirlo si quieres)
    dist_metros = float(request.query_params.get("dist", 30))

    # Convertir metros a grados aprox (1 grado ~ 111,000 m)
    dist_grados = dist_metros / 111_000.0

    # 1) Intento con cercanía geométrica
    try:
        paradas_qs = ParadaBus.objects.filter(
            geom__dwithin=(segmento.geometria, dist_grados)
        )
    except Exception as e:
        print("⚠️ Error en geom__dwithin:", e)
        paradas_qs = ParadaBus.objects.none()

    # 2) Si no encontró NADA por geometría, intentamos por segmento_id
    if not paradas_qs.exists():
        paradas_qs = ParadaBus.objects.filter(segmento_id=segmento_id)

    serializer = ParadaBusSerializer(paradas_qs, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)
