import os
import joblib
import pandas as pd
from prophet import Prophet

# Carpeta donde se guardan los modelos
BASE_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "models"
)
os.makedirs(BASE_PATH, exist_ok=True)


def train_all_segments():
    print("📄 Cargando dataset: dataset_trafico_30dias.csv")
    df = pd.read_csv("dataset_trafico_30dias.csv")

    # ---------------------------------
    # Columnas básicas para Prophet
    # ---------------------------------
    df["ds"] = pd.to_datetime(df["fecha"] + " " + df["hora"])
    df["y"] = df["nivel_congestion"]

    # Hora numérica (0–23)
    df["hour"] = pd.to_datetime(df["hora"], format="%H:%M").dt.hour

    # Dummies de tipo_dia (Lunes, Martes, etc.)
    if "tipo_dia" in df.columns:
        df = pd.get_dummies(df, columns=["tipo_dia"], drop_first=False)

    # Lista base de regresores (según tu dataset)
    base_regresores = [
        "hour",
        "precipitacion",
        "hora_pico",
        "entrada_estudiantes",
        "salida_estudiantes",
        "entrada_trabajadores",
        "salida_trabajadores",
        "construccion_vial",
        "longitud_km",
        "paradas_cercanas",
        "velocidad_kmh",
        "carga_vehicular",
    ]

    # Filtrar solo los que existan en el DF
    regresores = [c for c in base_regresores if c in df.columns]

    # Agregar dinámicamente las dummies de tipo_dia_
    regresores += [c for c in df.columns if c.startswith("tipo_dia_")]

    print("📌 Regresores usados en Prophet:")
    print(regresores)

    segmentos = sorted(df["segmento_id"].unique())

    for seg in segmentos:
        print("\n===============================")
        print(f"🚀 ENTRENANDO MODELO SEGMENTO {seg}")
        print("===============================\n")

        df_seg = df[df["segmento_id"] == seg].copy()

        if len(df_seg) < 48:
            print(f"⚠ Segmento {seg} tiene pocos datos ({len(df_seg)} filas). Saltando.")
            continue

        # Crear modelo Prophet
        model = Prophet(
            daily_seasonality=True,
            weekly_seasonality=True,
            yearly_seasonality=False
        )

        # Añadir regresores al modelo
        for reg in regresores:
            model.add_regressor(reg)

        # Entrenar
        model.fit(df_seg[["ds", "y"] + regresores])

        # Guardar modelo
        model_path = os.path.join(BASE_PATH, f"model_segmento_nuevo_{seg}.pkl")
        joblib.dump(model, model_path)

        print(f"✔ Modelo segmento {seg} guardado en: {model_path}")

    print("\n✅ ENTRENAMIENTO FINALIZADO\n")


if __name__ == "__main__":
    train_all_segments()
