from rest_framework import serializers
from .models import Segmento, MedicionTrafico, ParadaBus


class SegmentoMapSerializer(serializers.ModelSerializer):
    """
    Serializador para el MAPA. 
    Retorna los segmentos con geometría como array de pares de coordenadas [lng, lat].
    """
    geometry = serializers.SerializerMethodField()
    
    def get_geometry(self, obj):
        """Extrae las coordenadas de la LineString como array de pares [lng, lat]"""
        if obj.geometria:
            coords = list(obj.geometria.coords)
            return coords  # Retorna [(lng, lat), (lng, lat), ...]
        return None
    
    class Meta:
        model = Segmento
        fields = ("segmento_id", "nombre", "geometry")


class MedicionStatsSerializer(serializers.ModelSerializer):
    """
    Serializador para GRÁFICOS y ESTADÍSTICAS.
    Muestra los datos puros sin geometría.
    """
    nombre_tramo = serializers.CharField(source="segmento.nombre", read_only=True)

    class Meta:
        model = MedicionTrafico
        fields = ("id", "fecha_hora", "velocidad_promedio", "nivel_congestion", "nombre_tramo")


class ParadaBusSerializer(serializers.ModelSerializer):
    """
    Serializador para las paradas de bus.
    Expone lat/lon listos para el frontend.
    """
    lat = serializers.SerializerMethodField()
    lon = serializers.SerializerMethodField()

    class Meta:
        model = ParadaBus
        fields = (
            "id",
            "osm_id",
            "nombre",
            "segmento",
            "lat",
            "lon",
        )

    def get_lat(self, obj):
        return obj.geom.y if obj.geom else None  

    def get_lon(self, obj):
        return obj.geom.x if obj.geom else None  
