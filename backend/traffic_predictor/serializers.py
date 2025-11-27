from rest_framework import serializers

class PredictTrafficSerializer(serializers.Serializer):
    segmento_id = serializers.IntegerField()
    fecha = serializers.CharField()
    hora = serializers.CharField()

    precipitacion = serializers.FloatField(required=False)
    tipo_vehiculo = serializers.CharField(required=False)
    velocidad = serializers.FloatField(required=False)
    carga = serializers.FloatField(required=False)
    construccion_vial = serializers.IntegerField(required=False)
    paradas_cercanas = serializers.IntegerField(required=False)
