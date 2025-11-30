import pandas as pd
import joblib
import os
import numpy as np
from django.utils import timezone
from datetime import timedelta

# Importamos los modelos
from .models import PrediccionPorSegmento, PrediccionRutaOptima
from trafico.models import Segmento, RutaAlterna

BASE_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "models"
)

# INFO SEGMENTOS (Tu configuración original)
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

# --- FUNCIONES AUXILIARES (Tus funciones originales de cálculo) ---

def congestion_base_hora(h: int) -> float:
    if 0 <= h <= 4: return 1
    if h == 5: return 3.5
    if 6 <= h <= 10: return np.random.uniform(4.5, 5)
    if 11 <= h <= 12: return np.random.uniform(3, 4)
    if 13 <= h <= 15: return 3
    if 16 <= h <= 21: return np.random.uniform(4.5, 5)
    if h == 22: return 3.5
    if h == 23: return np.random.uniform(1, 2)
    return 2

def velocidad_por_congestion(cong: float) -> float:
    if cong < 2: return np.random.uniform(40, 55)
    if cong < 3: return np.random.uniform(30, 40)
    if cong < 4: return np.random.uniform(20, 30)
    return np.random.uniform(6, 12)

def carga_por_congestion(cong: float, segmento_id: int) -> int:
    carga = 200 + cong * 90
    if cong >= 4.3: carga *= 1.35
    if segmento_id in (1, 2): carga *= 1.10
    return int(carga)

def load_model_nuevo(segmento_id: int):
    model_path = os.path.join(BASE_PATH, f"model_segmento_nuevo_{segmento_id}.pkl")
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"No existe modelo para segmento {segmento_id}")
    return joblib.load(model_path)


# ============================================================
# 1. PREDICCIÓN DE TRÁFICO (Genera y Guarda en BD)
# ============================================================
import pandas as pd
import numpy as np
import joblib
import os
from datetime import timedelta
from django.utils import timezone

from .models import PrediccionPorSegmento
from trafico.models import Segmento

# -----------------------------------
# CONFIGURACIÓN
# -----------------------------------

BASE_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "models"
)

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


# -----------------------------------
# FUNCIONES AUXILIARES
# -----------------------------------

def congestion_base_hora(h):
    if 0 <= h <= 4: return 1
    if h == 5: return 3.5
    if 6 <= h <= 10: return np.random.uniform(4.5, 5)
    if 11 <= h <= 12: return np.random.uniform(3, 4)
    if 13 <= h <= 15: return 3
    if 16 <= h <= 21: return np.random.uniform(4.5, 5)
    if h == 22: return 3.5
    if h == 23: return np.random.uniform(1, 2)
    return 2


def velocidad_por_congestion(cong):
    if cong < 2: return np.random.uniform(40, 55)
    if cong < 3: return np.random.uniform(30, 40)
    if cong < 4: return np.random.uniform(20, 30)
    return np.random.uniform(6, 12)


def carga_por_congestion(cong, segmento_id):
    carga = 200 + cong * 90
    if cong >= 4.3: carga *= 1.35
    if segmento_id in (1, 2): carga *= 1.10
    return int(carga)


def load_model_nuevo(segmento_id):
    model_path = os.path.join(BASE_PATH, f"model_segmento_nuevo_{segmento_id}.pkl")
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"No existe modelo para segmento {segmento_id}")
    return joblib.load(model_path)


# ============================================================
# 1. FUNCIÓN COMPLETA: PREDICCIÓN DE 24 HORAS
# ============================================================

def predict_congestion_24h(segmento_id: int, fecha: str | None = None):

    # -------------------------
    # Validación
    # -------------------------
    if segmento_id not in SEGMENTOS_INFO:
        raise ValueError(f"Segmento {segmento_id} no definido")

    # -------------------------
    # Normalizar fecha naive
    # -------------------------
    if fecha is None:
        fecha_base = pd.Timestamp.now().normalize()
    else:
        fecha_base = pd.to_datetime(fecha).normalize()

    # -------------------------
    # Convertir a timezone-aware
    # -------------------------
    fecha_base_py = fecha_base.to_pydatetime()

    if timezone.is_naive(fecha_base_py):
        fecha_base_dt = timezone.make_aware(fecha_base_py)
    else:
        fecha_base_dt = fecha_base_py

    fecha_inicio = fecha_base_dt
    fecha_fin = fecha_base_dt + timedelta(hours=23, minutes=59)

    # -------------------------
    # Buscar en BD (cache)
    # -------------------------
    preds_bd = PrediccionPorSegmento.objects.filter(
        segmento_id=segmento_id,
        fecha_hora_prediccion__range=(fecha_inicio, fecha_fin)
    ).order_by("fecha_hora_prediccion")

    info_seg = SEGMENTOS_INFO[segmento_id]

    if preds_bd.count() >= 24:
        resultados = []
        for p in preds_bd:
            resultados.append({
                "segmento_id": segmento_id,
                "fecha": p.fecha_hora_prediccion.strftime("%Y-%m-%d"),
                "hora": p.fecha_hora_prediccion.strftime("%H:00"),
                "nivel_congestion": p.nivel_congestion_predicho,
                "velocidad_kmh": float(p.velocidad_estimada),
                "longitud_km": info_seg["longitud_km"],
                "tiempo_estimado_min": round((info_seg["longitud_km"] / float(p.velocidad_estimada) * 60), 2),
                "carga_vehicular": carga_por_congestion(p.nivel_congestion_predicho, segmento_id),
                "construccion_vial": 0,
                "paradas_cercanas": info_seg["paradas_cercanas"],
            })
        return resultados

    # -------------------------
    # Cargar modelo
    # -------------------------
    model = load_model_nuevo(segmento_id)
    tipo_dia = DIAS_ES[fecha_base_dt.weekday()]

    # -------------------------
    # Generar dataframe 24h futuros
    # -------------------------
    rows = []
    for h in range(24):
        precipitacion = 0.0
        if h in (16, 17, 18, 19, 20):
            precipitacion = float(np.random.choice([0, 0, 0.5, 1.5, 3]))

        rows.append({
            "ds": fecha_base_dt + timedelta(hours=h),
            "hour": h,
            "hora": f"{h:02d}:00",
            "fecha": fecha_base_dt.strftime("%Y-%m-%d"),
            "tipo_dia": tipo_dia,
            "precipitacion": precipitacion,
            "entrada_estudiantes": 1 if h == 7 else 0,
            "salida_estudiantes": 1 if h in (12, 17) else 0,
            "entrada_trabajadores": 1 if h == 7 else 0,
            "salida_trabajadores": 1 if h == 17 else 0,
            "construccion_vial": 1 if segmento_id == 1 else 0,
            "longitud_km": info_seg["longitud_km"],
            "paradas_cercanas": info_seg["paradas_cercanas"],
        })

    future_df = pd.DataFrame(rows)
    future_df = pd.get_dummies(future_df, columns=["tipo_dia"], drop_first=False)
    
    future_df['ds'] = future_df['ds'].dt.tz_localize(None)

    # Asegurar columnas requeridas por Prophet
    for reg in model.extra_regressors.keys():
        if reg not in future_df.columns:
            future_df[reg] = 0

    # -------------------------
    # Pronóstico Prophet
    # -------------------------
    forecast = model.predict(future_df)

    def clamp(v): return max(1, min(5, float(v)))

    resultados = []
    objetos_db = []
    segmento_obj = Segmento.objects.get(pk=segmento_id)

    # -------------------------
    # Construcción final de 24 horas
    # -------------------------
    for i, f in forecast.iterrows():
        h = int(future_df.loc[i, "hour"])

        base = congestion_base_hora(h)
        y_model = clamp(f["yhat"])
        nivel = clamp(0.7 * base + 0.3 * y_model)

        vel = velocidad_por_congestion(nivel)
        long_km = float(future_df.loc[i, "longitud_km"])
        tiempo = (long_km / vel) * 60
        carga = carga_por_congestion(nivel, segmento_id)

        fecha_hora_exacta = future_df.loc[i, "ds"]

        # Asegurar aware datetime
        if timezone.is_naive(fecha_hora_exacta):
            fecha_hora_exacta = timezone.make_aware(fecha_hora_exacta)

        # JSON
        resultados.append({
            "segmento_id": segmento_id,
            "fecha": future_df.loc[i, "fecha"],
            "hora": future_df.loc[i, "hora"],
            "nivel_congestion": round(nivel, 2),
            "velocidad_kmh": round(vel, 2),
            "tiempo_estimado_min": round(tiempo, 2),
            "longitud_km": long_km,
            "carga_vehicular": carga,
            "paradas_cercanas": int(future_df.loc[i, "paradas_cercanas"]),
        })

        # Para guardar en BD
        objetos_db.append(
            PrediccionPorSegmento(
                segmento=segmento_obj,
                fecha_hora_prediccion=fecha_hora_exacta,
                nivel_congestion_predicho=int(round(nivel)),
                velocidad_estimada=round(vel, 2),
            )
        )

    # -------------------------
    # Guardar en BD
    # -------------------------
    PrediccionPorSegmento.objects.filter(
        segmento=segmento_obj,
        fecha_hora_prediccion__range=(fecha_inicio, fecha_fin)
    ).delete()

    PrediccionPorSegmento.objects.bulk_create(objetos_db)

    return resultados


# ============================================================
# 2. PREDICCIÓN DE MEJOR RUTA (Consume lo anterior)
# ============================================================
def recomendar_mejor_segmento(fecha_hora_str):

    # 1. Parsear la fecha
    try:
        dt_obj = pd.to_datetime(fecha_hora_str)
        if timezone.is_naive(dt_obj):
            dt_obj = timezone.make_aware(dt_obj)
    except Exception:
        return {"error": "Formato de fecha inválido"}

    # Redondear a la hora exacta
    dt_hora = dt_obj.replace(minute=0, second=0, microsecond=0)

    # 2. Revisar si ya está guardado en BD
    cached = PrediccionRutaOptima.objects.filter(
        fecha_hora_objetivo=dt_hora
    ).first()

    if cached:
        return {
            "fecha_hora": dt_hora,
            "mejor_segmento": cached.ruta_recomendada.segmento_inicio.segmento_id if cached.ruta_recomendada.segmento_inicio else None,
            "tiempo_estimado_min": float(cached.tiempo_promedio_estimado),
            "nivel_congestion": float(cached.nivel_trafico_promedio),
            "origen": "cache_bd"
        }

    # 3. Evaluar TODOS los segmentos existentes
    segmentos = Segmento.objects.all()
    if not segmentos.exists():
        return {"error": "No hay segmentos definidos"}

    mejor_seg = None
    menor_tiempo = float("inf")
    mejor_nivel = None

    for seg in segmentos:
        pred = PrediccionPorSegmento.objects.filter(
            segmento_id=seg.segmento_id,
            fecha_hora_prediccion=dt_hora
        ).first()

        if not pred:
            # Si no existe predicción → generarla
            predict_congestion_24h(seg.segmento_id, dt_hora.date().strftime("%Y-%m-%d"))
            pred = PrediccionPorSegmento.objects.filter(
                segmento_id=seg.segmento_id,
                fecha_hora_prediccion=dt_hora
            ).first()

        if not pred:
            continue

        # Cálculo de tiempo estimado
        velocidad = float(pred.velocidad_estimada or 30)
        distancia = seg.longitud_km or 10
        tiempo = (distancia / velocidad) * 60  # minutos
        nivel = pred.nivel_congestion_predicho

        if tiempo < menor_tiempo:
            menor_tiempo = tiempo
            mejor_seg = seg
            mejor_nivel = nivel

    if not mejor_seg:
        return {"error": "No se pudo determinar el mejor segmento"}

    # 4. Guardar resultado en BD como PrediccionRutaOptima
    PrediccionRutaOptima.objects.update_or_create(
        fecha_hora_objetivo=dt_hora,
        defaults={
            "ruta_recomendada": RutaAlterna.objects.create(
                nombre=f"Segmento {mejor_seg.segmento_id} (individual)",
                segmento_inicio=mejor_seg,
                activa=False
            ),
            "tiempo_promedio_estimado": menor_tiempo,
            "nivel_trafico_promedio": mejor_nivel
        }
    )

    return {
        "fecha_hora": dt_hora,
        "mejor_segmento": mejor_seg.segmento_id,
        "tiempo_estimado_min": round(menor_tiempo, 2),
        "nivel_congestion": mejor_nivel,
        "origen": "calculo_real"
    }
    """
    Lógica principal:
    1. Recibe '2025-02-01 08:00:00'.
    2. Recorre cada Ruta Alterna.
    3. Para cada tramo de la ruta, consulta 'PrediccionPorSegmento'.
       (Si no existe predicción para ese segmento, la genera al vuelo usando predict_congestion_24h).
    4. Suma tiempos.
    5. Elige la ruta más rápida y guarda en 'PrediccionRutaOptima'.
    """
    # 1. Parsear fecha
    try:
        dt_objetivo = pd.to_datetime(fecha_hora_str)

        # Hacerla timezone aware
        if timezone.is_naive(dt_objetivo):
            dt_objetivo = timezone.make_aware(dt_objetivo)
    except Exception:
        return {"error": "Formato de fecha inválido"}

    # 👉 Derivados importantes
    fecha_solo_str = dt_objetivo.date().strftime("%Y-%m-%d")       # ej. '2025-02-01'
    dt_objetivo_hora = dt_objetivo.replace(minute=0, second=0, microsecond=0)

    # 2. Verificar Caché de Ruta Óptima
    cached = PrediccionRutaOptima.objects.filter(
        fecha_hora_objetivo=dt_objetivo_hora
    ).first()
    if cached:
        return {
            "fecha_hora": dt_objetivo_hora,
            "mejor_ruta": cached.ruta_recomendada.nombre,
            "tiempo_total_min": float(cached.tiempo_promedio_estimado),
            "nivel_trafico_promedio": float(cached.nivel_trafico_promedio),
            "origen": "cache_bd"
        }

    # 3. Calcular Rutas
    rutas_activas = RutaAlterna.objects.filter(activa=True).prefetch_related('tramos')

    if not rutas_activas.exists():
        return {"error": "No hay rutas alternas configuradas en el sistema"}

    mejor_ruta_obj = None
    menor_tiempo = float('inf')
    mejor_trafico = 0

    debug_rutas = []

    for ruta in rutas_activas:
        tiempo_ruta = 0.0
        trafico_acumulado = 0.0

        tramos = ruta.tramos.all().order_by('orden')

        # ⚠️ Usar exists() en vez de if not tramos
        if not tramos.exists():
            continue

        for tramo in tramos:
            seg_id = tramo.segmento.segmento_id

            # A) Buscamos predicción en BD para este segmento y hora
            pred = PrediccionPorSegmento.objects.filter(
                segmento_id=seg_id,
                fecha_hora_prediccion=dt_objetivo_hora
            ).first()

            # B) Si no existe, generamos predicciones de ese día para ese segmento
            if not pred:
                print(f"⚠️ Faltan datos para Segmento {seg_id} a las {dt_objetivo_hora}. Generando...")
                predict_congestion_24h(seg_id, fecha_solo_str)

                pred = PrediccionPorSegmento.objects.filter(
                    segmento_id=seg_id,
                    fecha_hora_prediccion=dt_objetivo_hora
                ).first()

            # C) Extraemos datos (o defaults)
            if pred:
                velocidad = float(pred.velocidad_estimada or 30.0)
                nivel = pred.nivel_congestion_predicho
            else:
                velocidad = 30.0
                nivel = 3

            distancia = tramo.segmento.longitud_km or 10.0
            tiempo_tramo = (distancia / velocidad) * 60.0  # minutos

            tiempo_ruta += tiempo_tramo
            trafico_acumulado += nivel

        promedio_trafico_ruta = trafico_acumulado / tramos.count()

        debug_rutas.append({
            "ruta": ruta.nombre,
            "tiempo": round(tiempo_ruta, 2),
            "trafico_avg": round(promedio_trafico_ruta, 2)
        })

        if tiempo_ruta < menor_tiempo:
            menor_tiempo = tiempo_ruta
            mejor_ruta_obj = ruta
            mejor_trafico = promedio_trafico_ruta

    # 4. Guardar Resultado en BD
    if mejor_ruta_obj:
        PrediccionRutaOptima.objects.update_or_create(
            fecha_hora_objetivo=dt_objetivo_hora,
            defaults={
                "ruta_recomendada": mejor_ruta_obj,
                "tiempo_promedio_estimado": menor_tiempo,
                "nivel_trafico_promedio": mejor_trafico
            }
        )

        return {
            "fecha_hora": dt_objetivo_hora,
            "mejor_ruta": mejor_ruta_obj.nombre,
            "tiempo_total_min": round(menor_tiempo, 2),
            "nivel_trafico_promedio": round(mejor_trafico, 2),
            "analisis_rutas": debug_rutas,
            "origen": "calculo_real"
        }

    return {"error": "No se pudo determinar la mejor ruta"}