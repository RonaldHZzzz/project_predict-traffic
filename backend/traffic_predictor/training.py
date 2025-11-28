import pandas as pd
import joblib
import os
import numpy as np
from datetime import datetime

BASE_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "models"
)

# Misma info de segmentos que en el dataset
SEGMENTOS_INFO = {
    1: {"longitud_km": 12.755, "paradas_cercanas": 6},
    2: {"longitud_km": 13.073, "paradas_cercanas": 4},
    3: {"longitud_km": 12.969, "paradas_cercanas": 3},
    4: {"longitud_km": 13.055, "paradas_cercanas": 5},
    5: {"longitud_km": 12.614, "paradas_cercanas": 3},
    6: {"longitud_km": 13.621, "paradas_cercanas": 6},
    7: {"longitud_km": 13.167, "paradas_cercanas": 2},
    8: {"longitud_km": 13.335, "paradas_cercanas": 2},
    9: {"longitud_km": 15.138, "paradas_cercanas": 4},
    10: {"longitud_km": 41.974, "paradas_cercanas": 1},
}

DIAS_ES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]


def es_hora_pico(hora: int) -> int:
    if 5 <= hora <= 8:
        return 1
    if 15 <= hora <= 20:
        return 1
    return 0


def load_model_nuevo(segmento_id: int):
    model_path = os.path.join(BASE_PATH, f"model_segmento_nuevo_{segmento_id}.pkl")
    if not os.path.exists(model_path):
        raise FileNotFoundError(
            f"No existe un modelo entrenado para el segmento {segmento_id} en {model_path}"
        )
    return joblib.load(model_path)


def predict_congestion_24h(segmento_id: int, fecha: str | None = None):
    """
    Devuelve la predicción de congestión para las 24h de una fecha dada
    para un segmento específico, incluyendo:
    - intervalo de confianza
    - longitud del tramo
    - tiempo estimado de recorrido (minutos)
    """

    if segmento_id not in SEGMENTOS_INFO:
        raise ValueError(f"Segmento {segmento_id} no está definido en SEGMENTOS_INFO")

    model = load_model_nuevo(segmento_id)

    # Fecha base
    if fecha is None:
        fecha_base = pd.Timestamp.today().normalize()
    else:
        fecha_base = pd.to_datetime(fecha).normalize()

    tipo_dia = DIAS_ES[fecha_base.weekday()]
    info_seg = SEGMENTOS_INFO[segmento_id]
    longitud_km = info_seg["longitud_km"]
    paradas_cercanas = info_seg["paradas_cercanas"]

    rows = []

    for h in range(24):
        hora_str = f"{h:02d}:00"
        ds = fecha_base + pd.Timedelta(hours=h)

        hora_pico = es_hora_pico(h)

        entrada_estudiantes = 1 if h in (7, 8) else 0
        salida_estudiantes = 1 if h in (12, 17, 18) else 0
        entrada_trabajadores = 1 if h in (7, 8) else 0
        salida_trabajadores = 1 if h in (17, 18) else 0

        construccion_vial = 1 if segmento_id == 1 else 0

        # Escenario de precipitación similar al dataset
        precipitacion = 0.0
        if h in (16, 17, 18, 19, 20):
            precipitacion = float(
                np.random.choice([0, 0, 0.5, 1.0, 2.0])
            )

        # Velocidad y carga coherentes con el dataset
        if hora_pico:
            velocidad = np.random.uniform(15, 35)
        else:
            velocidad = np.random.uniform(40, 80)

        if construccion_vial:
            velocidad -= 5
        if precipitacion > 0:
            velocidad -= 3
        velocidad = max(10, velocidad)

        if hora_pico:
            base_carga = 400
        else:
            base_carga = 150
        if segmento_id in (1, 2):
            base_carga += 80
        if tipo_dia in ["Sábado", "Domingo"]:
            base_carga *= 0.7

        carga_vehicular = int(base_carga)

        rows.append(
            {
                "ds": ds,
                "hora": hora_str,
                "hour": h,
                "fecha": fecha_base.strftime("%Y-%m-%d"),
                "tipo_dia": tipo_dia,
                "precipitacion": precipitacion,
                "hora_pico": hora_pico,
                "entrada_estudiantes": entrada_estudiantes,
                "salida_estudiantes": salida_estudiantes,
                "entrada_trabajadores": entrada_trabajadores,
                "salida_trabajadores": salida_trabajadores,
                "construccion_vial": construccion_vial,
                "longitud_km": longitud_km,
                "paradas_cercanas": paradas_cercanas,
                "velocidad_kmh": velocidad,
                "carga_vehicular": carga_vehicular,
            }
        )

    future_df = pd.DataFrame(rows)

    # Dummies de tipo_dia (compatibles con el entrenamiento)
    future_df = pd.get_dummies(future_df, columns=["tipo_dia"], drop_first=False)

    # Asegurar que todos los regresores extra que espera el modelo existan
    for reg in model.extra_regressors.keys():
        if reg not in future_df.columns:
            future_df[reg] = 0

    # Predicción
    forecast = model.predict(future_df)

    def clamp(v):
        return max(1.0, min(5.0, float(v)))

    resultados = []
    for i, row in forecast.iterrows():
        yhat = clamp(row["yhat"])
        yhat_lower = clamp(row["yhat_lower"])
        yhat_upper = clamp(row["yhat_upper"])

        velocidad = float(future_df.loc[i, "velocidad_kmh"])
        long_km = float(future_df.loc[i, "longitud_km"])

        # Tiempo estimado en minutos
        tiempo_estimado_min = (long_km / max(velocidad, 1.0)) * 60.0

        resultados.append(
            {
                "segmento_id": segmento_id,
                "fecha": future_df.loc[i, "fecha"],
                "hora": future_df.loc[i, "hora"],
                "nivel_congestion": round(yhat, 2),
                "nivel_congestion_min": round(yhat_lower, 2),
                "nivel_congestion_max": round(yhat_upper, 2),
                "ancho_intervalo_confianza": round(yhat_upper - yhat_lower, 2),
                "longitud_km": round(long_km, 3),
                "velocidad_kmh": round(velocidad, 2),
                "tiempo_estimado_min": round(tiempo_estimado_min, 2),
                "carga_vehicular": int(future_df.loc[i, "carga_vehicular"]),
                "construccion_vial": int(future_df.loc[i, "construccion_vial"]),
                "paradas_cercanas": int(future_df.loc[i, "paradas_cercanas"]),
            }
        )

    return resultados


if __name__ == "__main__":
    res = predict_congestion_24h(segmento_id=1, fecha="2025-02-01")
    for r in res[:5]:
        print(r)
