import pandas as pd
import joblib
from prophet import Prophet
import os
from datetime import datetime


# -------------------------------------------------------------
#   RUTA DE MODELOS
# -------------------------------------------------------------
BASE_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "models"
)


def load_model(segmento_id):
    """
    Carga el modelo Prophet entrenado para un segmento específico.
    """
    model_path = os.path.join(BASE_PATH, f"model_segmento_{segmento_id}.pkl")

    if not os.path.exists(model_path):
        raise FileNotFoundError(
            f"No existe un modelo entrenado para el segmento {segmento_id} en {model_path}"
        )

    return joblib.load(model_path)


# -------------------------------------------------------------
#   GENERAR PREDICCIÓN
# -------------------------------------------------------------
def predict_congestion(
    segmento_id,
    fecha,
    hora,
    precipitacion=0,
    tipo_vehiculo="carro",
    velocidad_actual=40,
    carga_actual=200,
    construccion_vial=0,
    paradas_cercanas=0
):
    """
    Genera la predicción de congestión para un segmento usando Prophet.
    """

    # ---------------------------------------------------------
    # 1. Cargar modelo
    # ---------------------------------------------------------
    model = load_model(segmento_id)

    # ---------------------------------------------------------
    # 2. Construir base del dataframe futuro
    # ---------------------------------------------------------
    fecha_hora = f"{fecha} {hora}"
    ds = pd.to_datetime(fecha_hora)

    future_df = pd.DataFrame({"ds": [ds]})

    # ===== Regresores numéricos principales =====
    future_df["hour"] = ds.hour
    future_df["velocidad_kmh"] = velocidad_actual
    future_df["carga_vehicular"] = carga_actual
    future_df["construccion_vial"] = construccion_vial
    future_df["paradas_cercanas"] = paradas_cercanas
    future_df["precipitacion"] = precipitacion

    # ===== Dummies de tipo vehículo =====
    future_df["tipo_vehiculo_moto"] = 1 if tipo_vehiculo == "moto" else 0
    future_df["tipo_vehiculo_bus"] = 1 if tipo_vehiculo == "bus" else 0

    # ---------------------------------------------------------
    # 3. Generar dummies REALISTAS tipo_dia
    # ---------------------------------------------------------
    dia_semana_en = ds.strftime("%A")

    map_dias = {
        "Monday": "Lunes",
        "Tuesday": "Martes",
        "Wednesday": "Miércoles",
        "Thursday": "Jueves",
        "Friday": "Viernes",
        "Saturday": "Sábado",
        "Sunday": "Domingo",
    }

    dia_es = map_dias[dia_semana_en]

    dummies_tipo_dia = [
        "tipo_dia_Lunes",
        "tipo_dia_Martes",
        "tipo_dia_Miércoles",
        "tipo_dia_Jueves",
        "tipo_dia_Viernes",
        "tipo_dia_Sábado",
        "tipo_dia_Domingo",
    ]

    for d in dummies_tipo_dia:
        nombre = d.replace("tipo_dia_", "")
        future_df[d] = 1 if nombre == dia_es else 0

    # ---------------------------------------------------------
    # 4. AGREGAR CUALQUIER REGRESOR QUE FALTE (CLAVE)
    # ---------------------------------------------------------
    for reg in model.extra_regressors.keys():
        if reg not in future_df.columns:
            future_df[reg] = 0

    # ---------------------------------------------------------
    # 5. Predecir
    # ---------------------------------------------------------
    forecast = model.predict(future_df)

    def clamp(val):
        return max(1, min(5, float(val)))

    yhat       = clamp(forecast["yhat"].iloc[0])
    yhat_lower = clamp(forecast["yhat_lower"].iloc[0])
    yhat_upper = clamp(forecast["yhat_upper"].iloc[0])

    tendencia = float(forecast["trend"].iloc[0])

    # ---------------------------------------------------------
    # 7. Retornar
    # ---------------------------------------------------------
    return {
        "fecha": fecha,
        "hora": hora,
        "segmento_id": segmento_id,
        "congestion_predicha": yhat,
        "congestion_min": yhat_lower,
        "congestion_max": yhat_upper,
        "tendencia": tendencia,
    }


# -------------------------------------------------------------
# PRUEBA LOCAL
# -------------------------------------------------------------
if __name__ == "__main__":
    resultado = predict_congestion(
        segmento_id=1,
        fecha="2025-02-01",
        hora="5:00",
        precipitacion=0,
        tipo_vehiculo="carro",
        velocidad_actual=66,
        carga_actual=400,
        construccion_vial=1,
        paradas_cercanas=4
    )
    print("Predicción generada:\n", resultado)