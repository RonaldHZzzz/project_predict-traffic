from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import Segmento
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
    try:
        data = request.data

        if "segmento_id" not in data:
            return Response({"error": "Falta segmento_id"}, status=400)

        segmento_id = int(data["segmento_id"])
        fecha = data.get("fecha", None)

        resultado = predict_congestion_24h(segmento_id=segmento_id, fecha=fecha)

        return Response(resultado, status=200)

    except Exception as e:
        return Response({"error": str(e)}, status=500)


# ==========================================
# ENDPOINT 2: RECOMENDAR MEJOR SEGMENTO (v1 - EXISTENTE)
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


# ==========================================
# ENDPOINT 3: RECOMENDAR RUTA (v1 - VEHÍCULO)
# ==========================================
@api_view(["POST"])
def recommend_route_v1(request):
    vehicle_type = request.data.get("vehicle_type", "car")

    VEHICLE_TYPES = ["car", "moto", "bus"]
    if vehicle_type not in VEHICLE_TYPES:
        return Response(
            {"detail": "Tipo de vehículo inválido. Usa: 'car', 'moto', 'bus'."},
            status=400
        )

    SEGMENTOS_BUS = [1, 2]
    SEGMENTOS_CAR = [3, 4, 5, 6, 7, 8, 9]
    SEGMENTOS_MOTO = [3, 4, 5, 6, 7, 8, 9, 10]

    if vehicle_type == "bus":
        allowed_ids = SEGMENTOS_BUS
    elif vehicle_type == "car":
        allowed_ids = SEGMENTOS_CAR
    else:
        allowed_ids = SEGMENTOS_MOTO

    segmentos = Segmento.objects.filter(segmento_id__in=allowed_ids)

    if not segmentos.exists():
        return Response(
            {"detail": f"No hay rutas permitidas para {vehicle_type}."},
            status=400
        )

    resultados = []

    for seg in segmentos:
        congestion = getattr(seg, "nivel_congestion", 1)
        velocidad = getattr(seg, "velocidad", 40)

        score = (congestion * 1.5) - (velocidad / 30)

        if vehicle_type == "moto" and seg.segmento_id == 10:
            score *= 0.6

        resultados.append({
            "segmento_id": seg.segmento_id,
            "nombre": seg.nombre,
            "score": round(score, 3),
            "congestion": congestion,
            "velocidad": velocidad,
        })

    mejor = sorted(resultados, key=lambda x: x["score"])[0]

    return Response({
        "vehiculo": vehicle_type,
        "mejor_ruta": mejor,
        "todas_las_opciones": resultados
    })


# ==========================================
# ENDPOINT 4: RECOMENDAR RUTA (v2 - VEHÍCULO + FECHA + HORA)
# ==========================================
@swagger_auto_schema(
    method='post',
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        required=["vehicle_type", "fecha_hora"],
        properties={
            "vehicle_type": openapi.Schema(
                type=openapi.TYPE_STRING,
                enum=["car", "moto", "bus"],
                description="Tipo de vehículo"
            ),
            "fecha_hora": openapi.Schema(
                type=openapi.TYPE_STRING,
                description="Fecha y hora (YYYY-MM-DD HH:MM:SS)"
            ),
            "construction_segment_id": openapi.Schema(
                type=openapi.TYPE_INTEGER,
                description="ID del segmento con construcción (opcional)"
            ),
        }
    ),
    responses={200: "Ruta recomendada generada correctamente"}
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def recommend_route_v2(request):
    vehicle_type = request.data.get("vehicle_type")
    fecha_hora = request.data.get("fecha_hora")
    construction_segment_id = request.data.get("construction_segment_id")

    if not vehicle_type or not fecha_hora:
        return Response(
            {"detail": "Debe enviar vehicle_type y fecha_hora"},
            status=400
        )

    SEGMENTOS_BUS = [1, 2]
    SEGMENTOS_CAR = [3, 4, 5, 6, 7, 8, 9]
    SEGMENTOS_MOTO = [3, 4, 5, 6, 7, 8, 9, 10]

    if vehicle_type == "bus":
        allowed_segments = SEGMENTOS_BUS
    elif vehicle_type == "car":
        allowed_segments = SEGMENTOS_CAR
    else:
        allowed_segments = SEGMENTOS_MOTO

    fecha, hora = fecha_hora.split(" ")
    hora = hora[:5]
    predictions = []

    for seg_id in allowed_segments:
        pred_list = predict_congestion_24h(seg_id, fecha)
        hour_pred = next((p for p in pred_list if p["hora"] == hora), None)

        if hour_pred:
            predictions.append({
                "segmento_id": seg_id,
                "pred": hour_pred
            })

    if not predictions:
        return Response(
            {"detail": "No hay datos de predicción para esta fecha y hora."},
            status=404
        )

    results = []

    for item in predictions:
        seg_id = item["segmento_id"]
        pred = item["pred"]

        congestion = pred["nivel_congestion"]
        velocidad = pred["velocidad_kmh"]

        score = congestion * 1.2 - (velocidad / 40)

        if vehicle_type == "moto" and seg_id == 10:
            score *= 0.6
        
        if construction_segment_id and seg_id == construction_segment_id:
            score *= 1.5

        results.append({
            "segmento_id": seg_id,
            "score": round(score, 3),
            "prediccion": pred
        })

    mejor = sorted(results, key=lambda x: x["score"])[0]

    return Response({
        "vehiculo": vehicle_type,
        "fecha_hora": fecha_hora,
        "segmento_recomendado": mejor,
        "todas_las_opciones": results
    })


# ==========================================
# ENDPOINT 5: OBTENER DATOS DE ANALÍTICAS
# ==========================================
@swagger_auto_schema(
    method='get',
    manual_parameters=[
        openapi.Parameter('date', openapi.IN_QUERY, description="Fecha para la cual obtener analíticas (YYYY-MM-DD)", type=openapi.TYPE_STRING, required=True),
        openapi.Parameter('segment_id', openapi.IN_QUERY, description="ID de un segmento específico o 'all' para todos", type=openapi.TYPE_STRING, required=False, default='all')
    ],
    responses={200: "Datos de analíticas obtenidos correctamente"}
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_analytics_data(request):
    try:
        date_str = request.query_params.get('date')
        segment_filter = request.query_params.get('segment_id', 'all')

        if not date_str:
            return Response({"error": "Parámetro 'date' es requerido (YYYY-MM-DD)."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            from datetime import datetime
            datetime.strptime(date_str, "%Y-%m-%d")
        except ValueError:
            return Response({"error": "Formato de fecha inválido. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)

        # Get all segments dynamically from the database
        all_segments_db = Segmento.objects.all().order_by('segmento_id')
        all_segment_ids = [seg.segmento_id for seg in all_segments_db]
        segment_id_to_name_map = {seg.segmento_id: seg.nombre for seg in all_segments_db}

        # Prepare segment list for the frontend
        segments_for_frontend = [{"id": seg.segmento_id, "name": seg.nombre} for seg in all_segments_db]

        target_segment_ids = []
        if segment_filter == 'all':
            target_segment_ids = all_segment_ids
        else:
            try:
                seg_id = int(segment_filter)
                if seg_id not in all_segment_ids:
                    return Response({"error": f"segment_id '{segment_filter}' inválido. IDs válidos: {all_segment_ids}"}, status=status.HTTP_400_BAD_REQUEST)
                target_segment_ids.append(seg_id)
            except ValueError:
                return Response({"error": f"segment_id '{segment_filter}' inválido. Debe ser un número entero o 'all'."}, status=status.HTTP_400_BAD_REQUEST)

        aggregated_hourly_chart_data = {}
        hourly_data_raw = []

        for seg_id in target_segment_ids:
            segment_name = segment_id_to_name_map.get(seg_id, f"ID {seg_id}")
            predictions_24h = predict_congestion_24h(segmento_id=seg_id, fecha=date_str)
            for pred in predictions_24h:
                hour = pred["hora"]
                if hour not in aggregated_hourly_chart_data:
                    aggregated_hourly_chart_data[hour] = {}
                
                congestion_percentage = round(((pred["nivel_congestion"] - 1) / 4) * 100, 2)

                aggregated_hourly_chart_data[hour][segment_name] = {
                    "nivel_congestion_percent": congestion_percentage,
                    "velocidad_kmh": pred["velocidad_kmh"],
                    "tiempo_estimado_min": pred["tiempo_estimado_min"],
                    "carga_vehicular": pred["carga_vehicular"],
                }
                # Add raw prediction for metric calculations
                hourly_data_raw.append(pred)

        chart_data_for_frontend = []
        for hour in sorted(aggregated_hourly_chart_data.keys()):
            hour_entry = {"hour": hour}
            for segment_name, segment_data in aggregated_hourly_chart_data[hour].items():
                hour_entry[f"{segment_name}_volume"] = segment_data["carga_vehicular"]
                hour_entry[f"{segment_name}_congestion"] = segment_data["nivel_congestion_percent"]
                hour_entry[f"{segment_name}_travel_time"] = segment_data["tiempo_estimado_min"]
                hour_entry[f"{segment_name}_avg_speed"] = segment_data["velocidad_kmh"]
            chart_data_for_frontend.append(hour_entry)

        # --- Calculate Metric Cards Data ---
        if not hourly_data_raw:
             metrics_data = {
                "hora_pico_manana": "N/A",
                "hora_pico_tarde": "N/A",
                "promedio_vehiculos": "0 veh./hr",
                "nivel_congestion_general": "0%",
            }
        else:
            total_vehicles = sum(p["carga_vehicular"] for p in hourly_data_raw)
            total_congestion_percentage = sum(round(((p["nivel_congestion"] - 1) / 4) * 100, 2) for p in hourly_data_raw)
            num_data_points = len(hourly_data_raw)

            hourly_vehicle_counts = {f"{h:02d}:00": 0.0 for h in range(24)}
            for pred in hourly_data_raw:
                hourly_vehicle_counts[pred["hora"]] += pred["carga_vehicular"]

            morning_peak_hour = max((hourly_vehicle_counts[f"{h:02d}:00"] for h in range(13)), default=0)
            morning_peak_hour_str = next((h for h,v in hourly_vehicle_counts.items() if v == morning_peak_hour and int(h[:2]) < 13), "00:00")

            evening_peak_hour = max((hourly_vehicle_counts[f"{h:02d}:00"] for h in range(12, 24)), default=0)
            evening_peak_hour_str = next((h for h,v in hourly_vehicle_counts.items() if v == evening_peak_hour and int(h[:2]) >= 12), "12:00")
            
            average_vehicles_per_hour = round(total_vehicles / num_data_points, 2) if num_data_points > 0 else 0
            average_congestion_percentage = round(total_congestion_percentage / num_data_points, 2) if num_data_points > 0 else 0

            metrics_data = {
                "hora_pico_manana": f"{morning_peak_hour_str} ({int(morning_peak_hour)} veh.)",
                "hora_pico_tarde": f"{evening_peak_hour_str} ({int(evening_peak_hour)} veh.)",
                "promedio_vehiculos": f"{average_vehicles_per_hour} veh./hr",
                "nivel_congestion_general": f"{average_congestion_percentage}%",
            }

        return Response({
            "chart_data": chart_data_for_frontend,
            "metrics": metrics_data,
            "segments": segments_for_frontend, # Return segments to frontend
        }, status=status.HTTP_200_OK)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({"error": "Error interno del servidor", "details": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)