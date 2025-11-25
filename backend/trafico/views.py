from rest_framework import generics
from django_filters.rest_framework import DjangoFilterBackend
from .models import Segmento, MedicionTrafico
from .serializers import SegmentoMapSerializer, MedicionStatsSerializer

# VISTA 1: API GEOESPACIAL (Para el Mapa)
# Devuelve los tramos en formato GeoJSON estándar (RFC 7946)
class Segmentos(generics.ListAPIView):
    """
    Retorna los segmentos de carretera con sus coordenadas geométricas.
    Ideal para librerías de mapas como Leaflet o Mapbox.
    """
    queryset = Segmento.objects.all()
    serializer_class = SegmentoMapSerializer
    pagination_class = None # No paginamos el mapa, queremos todos los tramos

# VISTA 2: API DE DATOS (Para Gráficos/Dashboard)
# Devuelve el historial de mediciones de tráfico
class MedicionList(generics.ListAPIView):
    """
    Retorna el historial de mediciones de velocidad y congestión.
    Se puede filtrar por 'segmento' o 'nivel_congestion'.
    """
    queryset = MedicionTrafico.objects.all().order_by('-fecha_hora')
    serializer_class = MedicionStatsSerializer
    
    # Configuración de Filtros (ej: /api/mediciones/?segmento=1)
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['segmento', 'nivel_congestion']