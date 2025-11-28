from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

# Importamos funciones de lógica de tráfico
from .predict import predict_congestion_24h, recomendar_mejor_segmento


# ----------------------------
# SCHEMA 1: PREDICCIÓN CONGESTIÓN (EXISTENTE)
# ----------------------------
predict_request_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    required=["segmento_id"],
    properties={
        "segmento_id": openapi.Schema(
            type=openapi.TYPE_INTEGER,
            description="ID del segmento (1-10)",
            default=1
        ),
        "fecha": openapi.Schema(
            type=openapi.TYPE_STRING,
            description="YYYY-MM-DD",
            default="2025-02-01"
        )
    }
)

# ----------------------------
# SCHEMA 2: MEJOR RUTA (NUEVO)
# ----------------------------
route_request_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    required=["fecha_hora"],
    properties={
        "fecha_hora": openapi.Schema(
            type=openapi.TYPE_STRING,
            description="Fecha y hora exacta del viaje (YYYY-MM-DD HH:MM:SS)",
            default="2025-02-01 08:00:00"
        )
    }
)


# ==========================================
# ENDPOINT 1: PREDECIR CONGESTIÓN (24H)
# ==========================================
@swagger_auto_schema(
    method='post',
    request_body=predict_request_schema,
    responses={200: "Predicción de 24h generada correctamente"}
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def predict_traffic(request):
    """
    Devuelve la predicción hora por hora de un segmento específico.
    """
    try:
        data = request.data

        if "segmento_id" not in data:
            return Response(
                {"error": "Falta segmento_id"},
                status=status.HTTP_400_BAD_REQUEST
            )

        segmento_id = int(data["segmento_id"])
        fecha = data.get("fecha", None)

        resultado = predict_congestion_24h(segmento_id=segmento_id, fecha=fecha)

        return Response(resultado, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ==========================================
# ENDPOINT 2: RECOMENDAR MEJOR RUTA
# ==========================================
@swagger_auto_schema(
    method="post",
    request_body=route_request_schema,
    responses={200: "Mejor segmento calculado correctamente"}
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def get_best_segment(request):
    data = request.data
    fecha_hora = data.get("fecha_hora")

    if not fecha_hora:
        return Response({"error": "Debe enviar fecha_hora"}, status=400)

    resultado = recomendar_mejor_segmento(fecha_hora)
    return Response(resultado)
