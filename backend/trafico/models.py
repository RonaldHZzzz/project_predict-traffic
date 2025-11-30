
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

class ParadaBus(models.Model):
    """
    Paradas oficiales de bus asociadas a un segmento.
    Solo vamos a guardar paradas que estén dentro/cerca
    de los segmentos que ya tienes en la base.
    """
    segmento = models.ForeignKey(
        Segmento,
        on_delete=models.CASCADE,
        related_name="paradas",
        help_text="Segmento al que pertenece esta parada",
    )

    osm_id = models.CharField(
        max_length=50,
        unique=True,
        help_text="ID de la parada en OpenStreetMap",
    )

    nombre = models.CharField(
        max_length=200,
        null=True,
        blank=True,
        help_text="Nombre de la parada (si existe en OSM)",
    )

    geom = models.PointField(
        srid=4326,
        help_text="Ubicación de la parada (lon/lat en WGS84)",
    )

    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Parada de bus"
        verbose_name_plural = "Paradas de bus"

    def __str__(self):
        return self.nombre or f"Parada {self.osm_id}"        