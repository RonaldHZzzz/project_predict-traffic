import requests
import os
from django.utils import timezone
from datetime import timedelta
from .models import FactorExterno

# Configuración
# Lo ideal es usar variables de entorno, pero para prototipo lo definimos aquí o en settings
OPENWEATHER_API_KEY = "438d9c28512c6766e99b25808783fd8b" # ¡Reemplaza esto con tu Key real!
LAT_LOS_CHORROS = 13.6769
LON_LOS_CHORROS = -89.2797

def obtener_datos_clima():
    """Consulta cruda a la API"""
    url = "https://api.openweathermap.org/data/2.5/weather"
    params = {
        "lat": LAT_LOS_CHORROS,
        "lon": LON_LOS_CHORROS,
        "appid": OPENWEATHER_API_KEY,
        "units": "metric",
        "lang": "es"
    }
    try:
        response = requests.get(url, params=params, timeout=5)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"Error conectando a OpenWeather: {e}")
        return None

def actualizar_alertas_clima():
    """
    Lógica de Negocio:
    1. Obtiene el clima actual.
    2. Decide si es un factor de riesgo (Lluvia, Tormenta, Niebla).
    3. Crea o actualiza un FactorExterno en la BD para que el algoritmo de tráfico lo vea.
    """
    data = obtener_datos_clima()
    if not data:
        return

    # Extraer datos relevantes
    clima_main = data['weather'][0]['main'] # Rain, Clear, Clouds, Thunderstorm
    descripcion = data['weather'][0]['description'].capitalize()
    temp = data['main']['temp']
    
    # Determinar impacto en el tráfico
    impacto = 1 # 1=Bajo (Normal)
    es_riesgo = False
    tipo_evento = "CLIMA"
    
    # Reglas de negocio para Los Chorros (según tu documento)
    if clima_main in ['Rain', 'Drizzle']:
        impacto = 3 # Alto impacto
        es_riesgo = True
        descripcion = f"Lluvia activa: {descripcion}. Pavimento liso."
    elif clima_main == 'Thunderstorm':
        impacto = 4 # Crítico
        es_riesgo = True
        descripcion = f"Tormenta eléctrica: {descripcion}. Visibilidad reducida."
    elif clima_main == 'Fog' or clima_main == 'Mist':
        impacto = 2 # Medio
        es_riesgo = True
        descripcion = f"Neblina en la zona. Conducir con precaución."

    # Buscar si ya existe una alerta climática reciente (últimas 3 horas) para no duplicar
    hace_poco = timezone.now() - timedelta(hours=3)
    alerta_existente = FactorExterno.objects.filter(
        tipo="CLIMA",
        activo=True,
        fecha_inicio__gte=hace_poco
    ).first()

    if es_riesgo:
        if alerta_existente:
            # Actualizar existente
            alerta_existente.descripcion = f"{descripcion} (Temp: {temp}°C)"
            alerta_existente.nivel_impacto = impacto
            alerta_existente.fecha_fin = timezone.now() + timedelta(hours=1) # Extender duración
            alerta_existente.save()
            print(f"🔄 Alerta climática actualizada: {descripcion}")
        else:
            # Crear nueva alerta
            FactorExterno.objects.create(
                nombre=f"Condición: {clima_main}",
                tipo="CLIMA",
                fecha_inicio=timezone.now(),
                fecha_fin=timezone.now() + timedelta(hours=1),
                latitud=LAT_LOS_CHORROS,
                longitud=LON_LOS_CHORROS,
                nivel_impacto=impacto,
                descripcion=f"{descripcion} (Temp: {temp}°C)",
                activo=True
            )
            print(f"⚠️ Nueva alerta climática creada: {descripcion}")
    else:
        # Si el clima está bien, desactivamos alertas viejas
        if alerta_existente:
            alerta_existente.activo = False
            alerta_existente.save()
            print("☀️ Clima despejado. Alertas desactivadas.")