import pandas as pd
import joblib
import os
import numpy as np
from datetime import datetime, timedelta


# -------------------------------------------------------------
#   RUTA DE MODELOS
# -------------------------------------------------------------
BASE_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "models"
)

# -------------------------------------------------------------
#   SEGMENTOS (longitud, paradas, construcción)
# -------------------------------------------------------------
SEGMENTOS_INFO = {
    1: {"longitud_km": 12.755, "paradas_cercanas": 6, "construccion": 1},
    2: {"longitud_km": 13.073, "paradas_cercanas": 4, "construccion": 0},
    3: {"longitud_km": 12.969, "paradas_cercanas": 3, "construccion": 0},
    4: {"longitud_km": 13.055, "paradas_cercanas": 5, "construccion": 0},
    5: {"longitud_km": 12.614, "paradas_cercanas": 3, "construccion": 0},
    6: {"longitud_km": 13.621, "paradas_cercanas": 6, "construccion": 0},
    7: {"longitud_km": 13.167, "paradas_cercanas": 2, "construccion": 0},
    8: {"longitud_km": 13.335, "paradas_cercanas": 2, "construccion": 0},
    9: {"longitud_km": 15.138, "paradas_cercanas": 4, "construccion": 0},
    10: {"longitud_km": 41.974, "paradas_cercanas": 1, "construccion": 0},
}

DIAS_ES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]


def es_hora_pico(h):
    """Horas pico reales: 5–8 AM y 15–20 PM"""
    return 1 if (5 <= h <= 8 or 15 <= h <= 20) else 0


def load_model(segmento_id):
    model_path = os.path.join(BASE_PATH, f"model_segmento_{segmento_id}.pkl")
    if not os.path.exists(model_path):
        raise FileNotFoundError(
            f"No existe modelo entrenado para el segmento {segmento_id}"
        )
    return joblib.load(model_path)


# -------------------------------------------------------------
#   PREDICCIÓN DE 24 HORAS COMPLETA Y REALISTA
# -------------------------------------------------------------
def predict_congestion_24h(segmento_id, fecha=None):
    model = load_model(segmento_id)
    info_seg = SEGMENTOS_INFO[segmento_id]

    # Usar fecha actual si no llegó una
    if fecha is None:
        fecha_base = datetime.now().date()
    else:
        fecha_base = pd.to_datetime(fecha).date()

    tipo_dia = DIAS_ES[pd.Timestamp(fecha_base).weekday()]

    resultados = []

    for h in range(24):

        hora_str = f"{h:02d}:00"
        ds = pd.to_datetime(f"{fecha_base} {hora_str}")

        # ---------------------- RECREAR EL MISMO DATASET ----------------------
        hora_pico = es_hora_pico(h)

        entrada_estudiantes = 1 if h in (7, 8) else 0
        salida_estudiantes = 1 if h in (12, 17, 18) else 0

        entrada_trabajadores = 1 if h in (7, 8) else 0
        salida_trabajadores = 1 if h in (17, 18) else 0

        precipitacion = 0
        if h in (16, 17, 18, 19, 20):
            precipitacion = float(np.random.choice([0, 0, 0.6, 1.2, 2.0]))

        # Velocidad realista
        if hora_pico:
            velocidad_kmh = np.random.uniform(15, 35)
        else:
            velocidad_kmh = np.random.uniform(40, 80)

        # Ajustes
        if info_seg["construccion"]:
            velocidad_kmh -= 5
        if precipitacion > 0:
            velocidad_kmh -= 3

        velocidad_kmh = max(10, velocidad_kmh)

        # Carga vehicular realista
        base_carga = 400 if hora_pico else 150
        if segmento_id in (1, 2):
            base_carga += 80
        if tipo_dia in ["Sábado", "Domingo"]:
            base_carga *= 0.7

        carga_vehicular = int(base_carga)

        # ----------------------------------------------------------------------

        # Construcción del DF futuro
        row = {
            "ds": ds,
            "hour": h,
            "precipitacion": precipitacion,
            "hora_pico": hora_pico,
            "entrada_estudiantes": entrada_estudiantes,
            "salida_estudiantes": salida_estudiantes,
            "entrada_trabajadores": entrada_trabajadores,
            "salida_trabajadores": salida_trabajadores,
            "construccion_vial": info_seg["construccion"],
            "longitud_km": info_seg["longitud_km"],
            "paradas_cercanas": info_seg["paradas_cercanas"],
            "velocidad_kmh": velocidad_kmh,
            "carga_vehicular": carga_vehicular,
            "tipo_dia": tipo_dia
        }

        future_df = pd.DataFrame([row])

        # Dummies del tipo de día
        future_df = pd.get_dummies(future_df, columns=["tipo_dia"], drop_first=False)

        # Añadir columnas que el modelo espera
        for reg in model.extra_regressors.keys():
            if reg not in future_df.columns:
                future_df[reg] = 0

        # ---------------------- PREDICCIÓN ----------------------
        pred = model.predict(future_df)

        def clamp(v):
            return max(1, min(5, float(v)))

        # Cálculo de tiempo estimado
        tiempo_min = (info_seg["longitud_km"] / velocidad_kmh) * 60

        resultados.append({
            "segmento_id": segmento_id,
            "fecha": str(fecha_base),
            "hora": hora_str,
            "nivel_congestion": clamp(pred["yhat"].iloc[0]),
            "nivel_congestion_min": clamp(pred["yhat_lower"].iloc[0]),
            "nivel_congestion_max": clamp(pred["yhat_upper"].iloc[0]),
            "ancho_confianza": round(pred["yhat_upper"].iloc[0] - pred["yhat_lower"].iloc[0], 3),
            "longitud_km": info_seg["longitud_km"],
            "velocidad_kmh": round(velocidad_kmh, 2),
            "tiempo_estimado_min": round(tiempo_min, 2),
            "carga_vehicular": carga_vehicular,
            "construccion_vial": info_seg["construccion"],
            "paradas_cercanas": info_seg["paradas_cercanas"]
        })

    return resultados


# -------------------------------------------------------------
# PRUEBA
# -------------------------------------------------------------
if __name__ == "__main__":
    res = predict_congestion_24h(1, "2025-02-01")
    print(res[:3])
