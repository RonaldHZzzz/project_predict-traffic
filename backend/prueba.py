import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# ============================
# PARÁMETROS GENERALES
# ============================
DIAS = 30

SEGMENTOS = {
    1: {"longitud": 12.755, "paradas": 6, "construccion": 1},
    2: {"longitud": 13.073, "paradas": 4, "construccion": 0},
    3: {"longitud": 12.969, "paradas": 3, "construccion": 0},
    4: {"longitud": 13.055, "paradas": 5, "construccion": 0},
    5: {"longitud": 12.614, "paradas": 3, "construccion": 0},
    6: {"longitud": 13.621, "paradas": 6, "construccion": 0},
    7: {"longitud": 13.167, "paradas": 2, "construccion": 0},
    8: {"longitud": 13.335, "paradas": 2, "construccion": 0},
    9: {"longitud": 15.138, "paradas": 4, "construccion": 0},
    10: {"longitud": 41.974, "paradas": 1, "construccion": 0},
}

start_date = datetime.now() - timedelta(days=DIAS)
rows = []

DIAS_ES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]


# ============================
# TABLA OFICIAL DE CONGESTIÓN
# ============================
def congestion_base_hora(h: int) -> float:
    if 0 <= h <= 4:
        return 1
    if 5 <= h <= 7:
        return 4
    if 8 <= h <= 12:
        return np.random.uniform(2, 3)
    if 13 <= h <= 15:
        return 3
    if 16 <= h <= 20:
        return np.random.uniform(4, 5)
    if 21 <= h <= 22:
        return 4
    if h == 23:
        return np.random.uniform(1, 2)
    return 2


def velocidad_por_congestion(cong: float) -> float:
    """
    Velocidad coherente con CONGESTIÓN:
      1  → 40–55 km/h (fluido)
      2  → 30–40 km/h
      3  → 20–30 km/h
      4  → 10–20 km/h
      5  → 5–12 km/h
    """
    if cong <= 1.5:
        return np.random.uniform(40, 55)
    elif cong <= 2.5:
        return np.random.uniform(30, 40)
    elif cong <= 3.5:
        return np.random.uniform(20, 30)
    elif cong <= 4.5:
        return np.random.uniform(10, 20)
    else:
        return np.random.uniform(5, 12)


# ============================
# GENERACIÓN DEL DATASET
# ============================
for d in range(DIAS):
    fecha = start_date + timedelta(days=d)
    tipo_dia_en = fecha.strftime("%A")
    tipo_dia = DIAS_ES[fecha.weekday()]
    es_fin = 1 if tipo_dia_en in ["Saturday", "Sunday"] else 0

    for h in range(24):
        hora_str = f"{h:02d}:00"

        # Tabla oficial base
        base = congestion_base_hora(h)

        # Calendario / personas
        entrada_estudiantes = 1 if h in (7, 8) else 0
        salida_estudiantes = 1 if h in (12, 17, 18) else 0
        entrada_trabajadores = 1 if h in (7, 8) else 0
        salida_trabajadores = 1 if h in (17, 18) else 0

        # Lluvia en la tarde
        precipitacion = 0.0
        if h in (16, 17, 18, 19, 20):
            precipitacion = float(np.random.choice([0, 0, 0.5, 1.0, 2.0]))

        # Hora pico (por simplicidad: cuando base >= 4)
        hora_pico = 1 if base >= 4 else 0

        for seg_id, info in SEGMENTOS.items():
            cong = base

            # Ajustes por dinámicas humanas
            cong += (entrada_estudiantes + salida_estudiantes) * 0.3
            cong += (entrada_trabajadores + salida_trabajadores) * 0.4

            # Transporte colectivo pasa por 1 y 2 → más congestión
            if seg_id in (1, 2):
                cong += 0.5

            # Lluvia
            if precipitacion > 0:
                cong += 0.4

            cong = float(np.clip(cong, 1, 5))

            # Velocidad en función de la congestión
            velocidad = velocidad_por_congestion(cong)

            # Penalización extra construcción en segmento 1
            if info["construccion"] == 1:
                velocidad *= 0.8

            # Penalización ligera por lluvia
            if precipitacion > 0:
                velocidad *= 0.9

            velocidad = max(5, velocidad)

            # Carga vehicular CONSISTENTE con congestión
            base_carga = 150 + cong * 70  # más congestión → más carga

            if hora_pico:
                base_carga *= 1.5

            if seg_id in (1, 2):
                base_carga *= 1.2  # transporte colectivo

            if precipitacion > 0:
                base_carga *= 1.1

            if es_fin:
                base_carga *= 0.7

            carga = int(base_carga)

            rows.append([
                seg_id,
                fecha.strftime("%Y-%m-%d"),
                hora_str,
                tipo_dia,
                es_fin,
                precipitacion,
                entrada_estudiantes,
                salida_estudiantes,
                entrada_trabajadores,
                salida_trabajadores,
                hora_pico,
                info["longitud"],
                info["paradas"],
                cong,
                velocidad,
                carga,
                info["construccion"],
            ])

# ============================
# CREAR CSV FINAL
# ============================
cols = [
    "segmento_id", "fecha", "hora", "tipo_dia", "es_fin",
    "precipitacion", "entrada_estudiantes", "salida_estudiantes",
    "entrada_trabajadores", "salida_trabajadores", "hora_pico",
    "longitud_km", "paradas_cercanas",
    "nivel_congestion", "velocidad_kmh",
    "carga_vehicular", "construccion_vial"
]

df = pd.DataFrame(rows, columns=cols)
df.to_csv("dataset_trafico_30dias.csv", index=False)
print("✔ DATASET GENERADO CON TABLA OFICIAL: dataset_trafico_30dias.csv")
