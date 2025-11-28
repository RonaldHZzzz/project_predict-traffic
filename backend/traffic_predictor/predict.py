import pandas as pd
import joblib
import os
import numpy as np

BASE_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "models"
)

# INFO SEGMENTOS
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


# ============================================================
# TABLA OFICIAL DE CONGESTIÓN BASE
# ============================================================
def congestion_base_hora(h: int) -> float:

    # Madrugada
    if 0 <= h <= 4:
        return 1

    # 05:00 transición subiendo
    if h == 5:
        return 3.5

    # ⚠️ MAÑANA PESADA (06–10)
    if 6 <= h <= 10:
        return np.random.uniform(4.5, 5)

    # 11–12 tráfico medio
    if 11 <= h <= 12:
        return np.random.uniform(3, 4)

    # Tarde suave
    if 13 <= h <= 15:
        return 3

    # ⚠️ TARDE–NOCHE PESADA (16–21)
    if 16 <= h <= 21:
        return np.random.uniform(4.5, 5)

    # 22 transición bajando
    if h == 22:
        return 3.5

    # 23 bajito
    if h == 23:
        return np.random.uniform(1, 2)

    return 2


# ============================================================
# VELOCIDAD SEGÚN CONGESTIÓN
# ============================================================
def velocidad_por_congestion(cong: float) -> float:
    """
    Velocidad coherente con tráfico real.
    Cong 1 → 40–55 km/h
    Cong 2 → 30–40 km/h
    Cong 3 → 20–30 km/h
    Cong 4 → 10–20 km/h
    Cong 5 → 6–12 km/h (TRÁFICO PESADO)
    """

    if cong < 2:
        return np.random.uniform(40, 55)

    if cong < 3:
        return np.random.uniform(30, 40)

    if cong < 4:
        return np.random.uniform(20, 30)

    # ⚠️ Congestión extrema (4.0–5.0)
    return np.random.uniform(6, 12)


# ============================================================
# CARGA VEHICULAR SEGÚN CONGESTIÓN
# ============================================================
def carga_por_congestion(cong: float, segmento_id: int) -> int:

    carga = 200 + cong * 90   # base fuerte

    if cong >= 4.3:
        carga *= 1.35         # MUCHOS vehículos

    if segmento_id in (1, 2):
        carga *= 1.10         # afecta más transporte público

    return int(carga)


# ============================================================
# CARGAR MODELO
# ============================================================
def load_model_nuevo(segmento_id: int):
    model_path = os.path.join(BASE_PATH, f"model_segmento_nuevo_{segmento_id}.pkl")
    if not os.path.exists(model_path):
        raise FileNotFoundError(
            f"No existe un modelo entrenado para el segmento {segmento_id} en {model_path}"
        )
    return joblib.load(model_path)


# ============================================================
# PREDICCIÓN 24 HORAS
# ============================================================
def predict_congestion_24h(segmento_id: int, fecha: str | None = None):

    if segmento_id not in SEGMENTOS_INFO:
        raise ValueError(f"Segmento {segmento_id} no está definido")

    model = load_model_nuevo(segmento_id)
    info_seg = SEGMENTOS_INFO[segmento_id]

    # Fecha
    if fecha is None:
        fecha_base = pd.Timestamp.today().normalize()
    else:
        fecha_base = pd.to_datetime(fecha).normalize()

    tipo_dia = DIAS_ES[fecha_base.weekday()]

    rows = []

    # ----------------------------------------------------------
    # 1) Creamos future_df
    # ----------------------------------------------------------
    for h in range(24):

        precipitacion = 0.0
        if h in (16, 17, 18, 19, 20):
            precipitacion = float(np.random.choice([0, 0, 0.5, 1.5, 3]))

        rows.append({
            "ds": fecha_base + pd.Timedelta(hours=h),
            "hour": h,
            "hora": f"{h:02d}:00",
            "fecha": fecha_base.strftime("%Y-%m-%d"),
            "tipo_dia": tipo_dia,
            "precipitacion": precipitacion,
            "entrada_estudiantes": 1 if h in (7,) else 0,
            "salida_estudiantes": 1 if h in (12, 17) else 0,
            "entrada_trabajadores": 1 if h in (7,) else 0,
            "salida_trabajadores": 1 if h in (17,) else 0,
            "construccion_vial": 1 if segmento_id == 1 else 0,
            "longitud_km": info_seg["longitud_km"],
            "paradas_cercanas": info_seg["paradas_cercanas"],
            "velocidad_kmh": 0,
            "carga_vehicular": 0,
        })

    future_df = pd.DataFrame(rows)
    future_df = pd.get_dummies(future_df, columns=["tipo_dia"], drop_first=False)

    for reg in model.extra_regressors.keys():
        if reg not in future_df.columns:
            future_df[reg] = 0

    # ----------------------------------------------------------
    # 2) Predicción Prophet
    # ----------------------------------------------------------
    forecast = model.predict(future_df)

    def clamp(v): return max(1, min(5, float(v)))

    resultados = []

    # ----------------------------------------------------------
    # 3) COMBINAMOS TABLA BASE + MODELO
    # ----------------------------------------------------------
    for i, f in forecast.iterrows():

        h = int(future_df.loc[i, "hour"])

        base = congestion_base_hora(h)
        y_model = clamp(f["yhat"])

        nivel = clamp(0.7 * base + 0.3 * y_model)

        vel = velocidad_por_congestion(nivel)
        long_km = float(future_df.loc[i, "longitud_km"])
        tiempo = (long_km / vel) * 60

        carga = carga_por_congestion(nivel, segmento_id)

        resultados.append({
            "segmento_id": segmento_id,
            "fecha": future_df.loc[i, "fecha"],
            "hora": future_df.loc[i, "hora"],
            "nivel_congestion": round(nivel, 2),
            "nivel_congestion_min": round(nivel - 0.15, 2),
            "nivel_congestion_max": round(nivel + 0.15, 2),
            "ancho_intervalo_confianza": 0.3,
            "longitud_km": round(long_km, 2),
            "velocidad_kmh": round(vel, 2),
            "tiempo_estimado_min": round(tiempo, 2),
            "carga_vehicular": carga,
            "construccion_vial": int(future_df.loc[i, "construccion_vial"]),
            "paradas_cercanas": int(future_df.loc[i, "paradas_cercanas"]),
        })

    return resultados


# TEST
if __name__ == "__main__":
    r = predict_congestion_24h(1, "2025-02-01")
    for x in r:
        print(x)
