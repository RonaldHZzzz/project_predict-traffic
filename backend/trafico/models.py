from django.db import models

from django.contrib.gis.db import models # Usar siempre gis.db

# trafico_api/models.py


class Segmento(models.Model):
    segmento_id = models.IntegerField(primary_key=True)
    nombre = models.CharField(max_length=200)
    geometria = models.LineStringField(srid=4326)

    # NUEVOS CAMPOS AÑADIDOS
    longitud_km = models.FloatField(null=True, blank=True,
                                    help_text="Longitud total del tramo en kilómetros")
    paradas_cercanas = models.IntegerField(default=0,
                                           help_text="Cantidad de paradas cercanas en el tramo")

    def __str__(self):
        return self.nombre

class MedicionTrafico(models.Model):
    segmento = models.ForeignKey(Segmento, on_delete=models.CASCADE)
    fecha_hora = models.DateTimeField()
    velocidad_promedio = models.DecimalField(max_digits=5, decimal_places=2)
    nivel_congestion = models.IntegerField()

class RutaAlterna(models.Model):
    nombre = models.CharField(max_length=150)
    descripcion = models.TextField(blank=True)
    # opcional: segmento inicial y final para referencia
    segmento_inicio = models.ForeignKey(
        "Segmento", on_delete=models.SET_NULL, null=True, blank=True, related_name="rutas_inicio"
    )
    segmento_fin = models.ForeignKey(
        "Segmento", on_delete=models.SET_NULL, null=True, blank=True, related_name="rutas_fin"
    )
    activa = models.BooleanField(default=True)

    def __str__(self):
        return self.nombre


class RutaAlternaSegmento(models.Model):
    ruta = models.ForeignKey(RutaAlterna, on_delete=models.CASCADE, related_name="tramos")
    segmento = models.ForeignKey("Segmento", on_delete=models.CASCADE)
    orden = models.PositiveIntegerField(help_text="Orden del tramo dentro de la ruta")

    class Meta:
        ordering = ["orden"]
        unique_together = ("ruta", "segmento", "orden")

    def __str__(self):
        return f"{self.ruta.nombre} - {self.segmento.segmento_id} (#{self.orden})"    