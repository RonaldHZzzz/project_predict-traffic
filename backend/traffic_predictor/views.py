from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from .predict import predict_congestion_24h


# ----------------------------
# SCHEMA PARA SWAGGER
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
            description="Formato YYYY-MM-DD (opcional, default = hoy)",
            default="2025-02-01"
        )
    }
)


@swagger_auto_schema(
    method='post',
    request_body=predict_request_schema,
    responses={200: "Predicción generada correctamente"}
)
@api_view(["POST"])
def predict_traffic(request):
    """
    Endpoint para predecir congestion de 24 horas por segmento.
    """
    try:
        data = request.data

        if "segmento_id" not in data:
            return Response(
                {"error": "Campo requerido faltante: segmento_id"},
                status=status.HTTP_400_BAD_REQUEST
            )

        segmento_id = int(data["segmento_id"])
        fecha = data.get("fecha", None)  # si no viene, se usa fecha actual

        resultado = predict_congestion_24h(
            segmento_id=segmento_id,
            fecha=fecha
        )

        return Response(resultado, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
