import pandas as pd
import joblib
from prophet import Prophet
import os
from datetime import datetime, timedelta


# -------------------------------------------------------------
#   RUTA DE MODELOS
# -------------------------------------------------------------
BASE_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "models"
)


def load_model(segmento_id):
    model_path = os.path.join(BASE_PATH, f"model_segmento_{segmento_id}.pkl")

    if not os.path.exists(model_path):
        raise FileNotFoundError(
            f"No existe un modelo entrenado para el segmento {segmento_id} en {model_path}"
        )

    return joblib.load(model_path)


# -------------------------------------------------------------
#   PREDICCIÓN DE 24 HORAS PARA UN SEGMENTO
# -------------------------------------------------------------
def predict_congestion_24h(segmento_id, fecha=None):
    """
    Predice 24 horas de congestión cada 1 hora para un segmento dado.
    """
    model = load_model(segmento_id)

    # Si no envías fecha, se usa la actual
    if fecha is None:
        fecha = datetime.now().strftime("%Y-%m-%d")

    resultados = []

    # ---------------------------------------------------------
    # 24 horas → 0,1,2,3...23
    # ---------------------------------------------------------
    for hora in range(24):

        time_str = f"{hora:02d}:00"
        ds = pd.to_datetime(f"{fecha} {time_str}")

        future_df = pd.DataFrame({"ds": [ds]})

        # ---------------- VARIABLES DEFAULT REALISTICAS ----------------
        future_df["hour"] = hora
        future_df["velocidad_kmh"] = 40
        future_df["carga_vehicular"] = 200
        future_df["construccion_vial"] = 0
        future_df["paradas_cercanas"] = 3
        future_df["precipitacion"] = 0

        future_df["tipo_vehiculo_moto"] = 0
        future_df["tipo_vehiculo_bus"] = 0

        # -------------------- Dummies tipo día ------------------------
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

        dummies = [
            "tipo_dia_Lunes",
            "tipo_dia_Martes",
            "tipo_dia_Miércoles",
            "tipo_dia_Jueves",
            "tipo_dia_Viernes",
            "tipo_dia_Sábado",
            "tipo_dia_Domingo",
        ]

        for d in dummies:
            nombre = d.replace("tipo_dia_", "")
            future_df[d] = 1 if nombre == dia_es else 0

        # ----------------- Completar regresores faltantes --------------
        for reg in model.extra_regressors.keys():
            if reg not in future_df.columns:
                future_df[reg] = 0

        # --------------------- HACER PREDICCIÓN ------------------------
        pred = model.predict(future_df)

        def clamp(v): return max(1, min(5, float(v)))

        resultados.append({
            "segmento_id": segmento_id,
            "fecha": fecha,
            "hora": time_str,
            "congestion": clamp(pred["yhat"].iloc[0]),
            "min": clamp(pred["yhat_lower"].iloc[0]),
            "max": clamp(pred["yhat_upper"].iloc[0]),
            "tendencia": float(pred["trend"].iloc[0])
        })

    return resultados


# -------------------------------------------------------------
# PRUEBA
# -------------------------------------------------------------
if __name__ == "__main__":
    pred_24h = predict_congestion_24h(segmento_id=1)
    print(pred_24h)
