from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer
from .models import Segmento, MedicionTrafico

class SegmentoMapSerializer(GeoFeatureModelSerializer):
    """
    Serializador para el MAPA. 
    Convierte los datos en formato GeoJSON estándar que Leaflet/Mapbox entienden.
    """
    class Meta:
        model = Segmento
        geo_field = "geometria"
        fields = ('segmento_id', 'nombre')

class MedicionStatsSerializer(serializers.ModelSerializer):
    """
    Serializador para GRÁFICOS y ESTADÍSTICAS.
    Muestra los datos puros sin geometría.
    """
    nombre_tramo = serializers.CharField(source='segmento.nombre', read_only=True)

    class Meta:
        model = MedicionTrafico
        fields = ('id', 'fecha_hora', 'velocidad_promedio', 'nivel_congestion', 'nombre_tramo')