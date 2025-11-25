from django.db import models

from django.contrib.gis.db import models # Usar siempre gis.db

# trafico_api/models.py
from django.contrib.gis.db import models

class Segmento(models.Model):
    # Usaremos el ID del CSV como primary key
    segmento_id = models.IntegerField(primary_key=True) 
    nombre = models.CharField(max_length=200)
    geometria = models.LineStringField(srid=4326) # Aquí guardaremos la línea completa
    
    def __str__(self):
        return self.nombre

class MedicionTrafico(models.Model):
    segmento = models.ForeignKey(Segmento, on_delete=models.CASCADE)
    fecha_hora = models.DateTimeField()
    velocidad_promedio = models.DecimalField(max_digits=5, decimal_places=2)
    nivel_congestion = models.IntegerField()