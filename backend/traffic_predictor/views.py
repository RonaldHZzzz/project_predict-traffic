from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from .predict import predict_congestion


# ----------------------------
# SCHEMA PARA SWAGGER
# ----------------------------
predict_request_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    required=["segmento_id", "fecha", "hora"],
    properties={
        "segmento_id": openapi.Schema(
            type=openapi.TYPE_INTEGER,
            description="ID del segmento (1-10)",
            default=1
        ),
        "fecha": openapi.Schema(type=openapi.TYPE_STRING, description="Formato YYYY-MM-DD", default="2025-02-01"),
        "hora": openapi.Schema(type=openapi.TYPE_STRING, description="Formato HH:MM", default="06:00"),
        "precipitacion": openapi.Schema(type=openapi.TYPE_NUMBER, description="mm de lluvia", default=0),
        "tipo_vehiculo": openapi.Schema(type=openapi.TYPE_STRING, description="carro, moto, bus", default="carro"),
        "velocidad": openapi.Schema(type=openapi.TYPE_NUMBER, description="Velocidad actual km/h", default=35),
        "carga": openapi.Schema(type=openapi.TYPE_NUMBER, description="Flujo vehicular actual", default=400),
        "construccion_vial": openapi.Schema(type=openapi.TYPE_INTEGER, description="0 o 1", default=0),
        "paradas_cercanas": openapi.Schema(type=openapi.TYPE_INTEGER, description="Cantidad de paradas cercanas", default=0),
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
    Endpoint para predecir congestion.
    """
    try:
        data = request.data

        # Validar campos obligatorios
        required = ["segmento_id", "fecha", "hora"]
        for field in required:
            if field not in data:
                return Response(
                    {"error": f"Campo requerido faltante: {field}"},
                    status=status.HTTP_400_BAD_REQUEST
                )

        resultado = predict_congestion(
            segmento_id=int(data["segmento_id"]),
            fecha=data["fecha"],
            hora=data["hora"],
            precipitacion=float(data.get("precipitacion", 0)),
            tipo_vehiculo=data.get("tipo_vehiculo", "carro"),
            velocidad_actual=float(data.get("velocidad", 35)),
            carga_actual=float(data.get("carga", 400)),
            construccion_vial=int(data.get("construccion_vial", 0)),
            paradas_cercanas=int(data.get("paradas_cercanas", 0))
        )

        return Response(resultado, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
