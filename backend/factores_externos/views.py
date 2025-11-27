from rest_framework.views import APIView
from rest_framework.response import Response
from .models import FactorExterno
from django.utils import timezone
from .services import obtener_datos_clima # Para mostrar clima actual en tiempo real

class ClimaActualView(APIView):
    """Devuelve el clima en tiempo real y si hay alertas activas en BD"""
    
    def get(self, request):
        # 1. Obtener datos en tiempo real (para el widget visual)
        clima_real = obtener_datos_clima()
        
        # 2. Obtener alertas activas en BD (que afectan el algoritmo)
        alertas = FactorExterno.objects.filter(
            activo=True, 
            fecha_fin__gte=timezone.now()
        ).values('nombre', 'nivel_impacto', 'descripcion', 'tipo')

        return Response({
            "clima_actual": {
                "temp": clima_real['main']['temp'] if clima_real else 0,
                "desc": clima_real['weather'][0]['description'] if clima_real else "No disponible",
                "icon": clima_real['weather'][0]['icon'] if clima_real else "01d",
            },
            "alertas_trafico": list(alertas)
        })