import pandas as pd
from prophet import Prophet
import joblib
import os
from datetime import datetime

# -------------------------------------------------------------
# RUTA DONDE SE GUARDARÁN LOS MODELOS
# -------------------------------------------------------------
BASE_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "models"
)

if not os.path.exists(BASE_PATH):
    os.makedirs(BASE_PATH)


# -------------------------------------------------------------
# FUNCIÓN PRINCIPAL DE ENTRENAMIENTO
# -------------------------------------------------------------
def train_all_segments():
    """
    Entrena un modelo Prophet para cada segmento usando el dataset final.
    """

    print("=== Iniciando entrenamiento de Prophet para todos los segmentos ===")

    # ----------------------------------------
    # 1. Cargar dataset final
    # ----------------------------------------
    df = pd.read_csv("training_master.csv")

    # Crear columna datetime para Prophet
    df["ds"] = pd.to_datetime(df["dia"] + " " + df["hora"])
    df["y"] = df["nivel_congestion"]

    # ----------------------------------------
    # 2. Preparar regresores adicionales
    # ----------------------------------------

    # Convertir hora HH:MM a número entero
    df["hour"] = pd.to_datetime(df["hora"]).dt.hour

    # Dummy tipo de día
    df = pd.get_dummies(df, columns=["tipo_dia"], drop_first=True)

    # Dummy tipo de vehículo
    df = pd.get_dummies(df, columns=["tipo_vehiculo"], drop_first=True)

    # Lista de columnas regresoras
    regresores = [
        "hour",
        "velocidad_kmh",
        "carga_vehicular",
        "construccion_vial",
        "paradas_cercanas"
    ]

    # Agregar futuras columnas de precipitacion si existen
    if "precipitacion" in df.columns:
        regresores.append("precipitacion")

    # Agregar dummies tipo_dia_
    regresores += [c for c in df.columns if "tipo_dia_" in c]

    # Agregar dummies tipo_vehiculo_
    regresores += [c for c in df.columns if "tipo_vehiculo_" in c]

    # ----------------------------------------
    # 3. Entrenar modelo por cada segmento
    # ----------------------------------------
    segmentos = sorted(df["segmento_id"].unique())

    for seg in segmentos:

        print(f"\n🔵 Entrenando modelo para Segmento {seg}...")

        data_seg = df[df["segmento_id"] == seg].copy()

        if len(data_seg) < 50:
            print(f"⚠ Segmento {seg} tiene muy pocos datos. Saltando...")
            continue

        # Crear modelo Prophet
        m = Prophet(
            daily_seasonality=True,
            weekly_seasonality=True,
            yearly_seasonality=False
        )

        # Agregar regresores
        for reg in regresores:
            m.add_regressor(reg)

        # Ajustar modelo
        m.fit(data_seg[["ds", "y"] + regresores])

        # Guardar modelo
        model_path = os.path.join(BASE_PATH, f"model_segmento_{seg}.pkl")
        joblib.dump(m, model_path)

        print(f"✔ Modelo del segmento {seg} guardado en {model_path}")

    print("\n=== ENTRENAMIENTO FINALIZADO EXITOSAMENTE ===")


# -------------------------------------------------------------
# EJECUCIÓN DIRECTA
# -------------------------------------------------------------
if __name__ == "__main__":
    train_all_segments()
