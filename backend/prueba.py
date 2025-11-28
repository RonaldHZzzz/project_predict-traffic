import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# PARÁMETROS
dias = 30
segmentos = {
    1: {"longitud": 12.755, "paradas": 6},
    2: {"longitud": 13.073, "paradas": 4},
    3: {"longitud": 12.969, "paradas": 3},
    4: {"longitud": 13.055, "paradas": 5},
    5: {"longitud": 12.614, "paradas": 3},
    6: {"longitud": 13.621, "paradas": 6},
    7: {"longitud": 13.167, "paradas": 2},
    8: {"longitud": 13.335, "paradas": 2},
    9: {"longitud": 15.138, "paradas": 4},
    10: {"longitud": 41.974, "paradas": 1},
}

start_date = datetime.now() - timedelta(days=dias)

rows = []

for d in range(dias):
    fecha = start_date + timedelta(days=d)

    for h in range(24):
        hora = f"{h:02d}:00"
        
        # Calendario
        tipo_dia = fecha.strftime("%A")
        es_fin = 1 if tipo_dia in ["Saturday", "Sunday"] else 0

        # Factores horarios
        entrada_estudiantes = 1 if h == 7 else 0
        salida_estudiantes  = 1 if h == 17 else 0
        entrada_trabajadores = 1 if h == 7 else 0
        salida_trabajadores  = 1 if h == 17 else 0
        
        # Horas pico
        hora_pico = 1 if h in [6,7,8,16,17,18] else 0
        
        # Precipitación simulada
        precipitacion = round(np.random.uniform(0, 10), 2) if np.random.random() < 0.2 else 0

        for seg_id, info in segmentos.items():
            
            # Congestión depende de hora + lluvia + paradas + estudiantes/trabajo
            base = 1
            
            if hora_pico:
                base += 2
            
            if precipitacion > 0:
                base += 1
            
            if entrada_estudiantes or salida_estudiantes:
                base += 1
            
            if entrada_trabajadores or salida_trabajadores:
                base += 1
            
            congestion = min(5, max(1, base))
            
            # Velocidad inversa a congestión
            velocidad = max(5, 50 - congestion*8)
            
            # Carga vehicular
            carga = int(np.random.randint(50, 500) * (1 + congestion*0.3))

            # Construcción vial aleatoria
            construccion = 1 if np.random.random() < 0.05 else 0

            # Guardar fila
            rows.append([
                seg_id,
                fecha.strftime("%Y-%m-%d"),
                hora,
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
                congestion,
                velocidad,
                carga,
                construccion
            ])

# Crear CSV
cols = [
    "segmento_id","fecha","hora","tipo_dia","es_fin",
    "precipitacion","entrada_estudiantes","salida_estudiantes",
    "entrada_trabajadores","salida_trabajadores","hora_pico",
    "longitud_km","paradas_cercanas",
    "nivel_congestion","velocidad_kmh","carga_vehicular","construccion_vial"
]

df = pd.DataFrame(rows, columns=cols)
df.to_csv("dataset_trafico_30dias.csv", index=False)

print("CSV generado: dataset_trafico_30dias.csv")
