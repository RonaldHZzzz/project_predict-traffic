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
from traffic_predictor.predict import predict_congestion_24h
from datetime import datetime
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

@swagger_auto_schema(
    method="get",
    manual_parameters=[
        openapi.Parameter(
            "fecha",
            openapi.IN_QUERY,
            description="Fecha para la cual obtener las métricas (formato YYYY-MM-DD).",
            type=openapi.TYPE_STRING,
        ),
        openapi.Parameter(
            "segmento_id",
            openapi.IN_QUERY,
            description="ID del segmento específico para filtrar las métricas.",
            type=openapi.TYPE_INTEGER,
            required=False,
        ),
    ],
)
@api_view(["GET"])
def metricas_diarias(request):
    """
    Devuelve las métricas de tráfico agregadas por hora para un día específico.
    Puede filtrar por un segmento_id opcional.
    """
    fecha_str = request.query_params.get("fecha")
    if fecha_str:
        try:
            fecha = datetime.strptime(fecha_str, "%Y-%m-%d").date()
        except ValueError:
            return Response(
                {"error": "Formato de fecha inválido. Use YYYY-MM-DD."},
                status=status.HTTP_400_BAD_REQUEST,
            )
    else:
        fecha = datetime.now().date()

    segmento_id = request.query_params.get("segmento_id")

    if segmento_id:
        try:
            segmentos_qs = Segmento.objects.filter(segmento_id=segmento_id)
            if not segmentos_qs.exists():
                return Response(
                    {"error": f"Segmento con ID {segmento_id} no encontrado."},
                    status=status.HTTP_404_NOT_FOUND,
                )
        except ValueError:
            return Response(
                {"error": "segmento_id debe ser un número entero."},
                status=status.HTTP_400_BAD_REQUEST,
            )
    else:
        segmentos_qs = Segmento.objects.all()

    hourly_metrics = {hour: {"nivel_congestion_total": 0, "velocidad_total": 0, "carga_vehicular_total": 0, "tiempo_estimado_total": 0, "count": 0} for hour in range(24)}

    for segmento in segmentos_qs:
        try:
            daily_predictions = predict_congestion_24h(segmento.segmento_id, fecha.strftime("%Y-%m-%d"))
            for prediction in daily_predictions:
                hora_int = int(prediction["hora"][:2])
                metrics = hourly_metrics[hora_int]
                metrics["nivel_congestion_total"] += prediction["nivel_congestion"]
                metrics["velocidad_total"] += prediction["velocidad_kmh"]
                metrics["carga_vehicular_total"] += prediction["carga_vehicular"]
                metrics["tiempo_estimado_total"] += prediction["tiempo_estimado_min"]
                metrics["count"] += 1
        except Exception as e:
            # Optionally log the error or handle segments with failed predictions
            print(f"Error predicting for segment {segmento.segmento_id}: {e}")
            continue

    aggregated_metrics = []

    # Define thresholds for peak hours
    CONGESTION_PEAK_THRESHOLD = 4.0
    CARGA_VEHICULAR_PEAK_THRESHOLD = 1000.0  # This threshold might need to be adjusted based on data

    for hour, totals in hourly_metrics.items():
        if totals["count"] > 0:
            avg_congestion = round(totals["nivel_congestion_total"] / totals["count"], 2)
            avg_velocidad = round(totals["velocidad_total"] / totals["count"], 2)
            avg_carga_vehicular = round(totals["carga_vehicular_total"] / totals["count"], 2)
            total_tiempo_estimado = round(totals["tiempo_estimado_total"], 2)  # Sum, not average

            is_peak_hour = (
                avg_congestion >= CONGESTION_PEAK_THRESHOLD
            )

            aggregated_metrics.append({
                "hora": f"{hour:02d}:00",
                "nivel_congestion_promedio": avg_congestion,
                "velocidad_promedio": avg_velocidad,
                "carga_vehicular_promedio": avg_carga_vehicular,
                "tiempo_estimado_total": total_tiempo_estimado,
                "is_peak_hour": is_peak_hour,
            })

    # Sort by hour for consistent output
    aggregated_metrics.sort(key=lambda x: x['hora'])

    # Identify peak hours
    principal_peak_hour = None
    secondary_peak_hour = None
    most_congested_hours = []

    # Sort metrics by congestion level to find peaks
    sorted_by_congestion = sorted(aggregated_metrics, key=lambda x: x['nivel_congestion_promedio'], reverse=True)

    if sorted_by_congestion:
        # Principal Peak Hour
        principal_peak_hour = {
            "hora": sorted_by_congestion[0]["hora"],
            "nivel_congestion": sorted_by_congestion[0]["nivel_congestion_promedio"]
        }

        # Secondary Peak Hour (if available and different from principal)
        if len(sorted_by_congestion) > 1:
            for item in sorted_by_congestion[1:]:
                if item["hora"] != principal_peak_hour["hora"]:
                    secondary_peak_hour = {
                        "hora": item["hora"],
                        "nivel_congestion": item["nivel_congestion_promedio"]
                    }
                    break

    # Most Congested Hours (nivel_congestion between 4 and 5)
    for metric in aggregated_metrics:
        if 4.0 <= metric["nivel_congestion_promedio"] <= 5.0:
            most_congested_hours.append({
                "hora": metric["hora"],
                "nivel_congestion": metric["nivel_congestion_promedio"]
            })

    response_data = {
        "hourly_metrics": aggregated_metrics,
        "principal_peak_hour": principal_peak_hour,
        "secondary_peak_hour": secondary_peak_hour,
        "most_congested_hours": most_congested_hours,
    }

    return Response(response_data)
