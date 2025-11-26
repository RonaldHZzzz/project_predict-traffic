from django.db import models

class FactorExterno(models.Model):
    TIPOS = [
        ('CLIMA', 'Condición Climática'),
        ('EVENTO', 'Evento Social/Deportivo'),
        ('OBRA', 'Obra Vial / Construcción'),
        ('ACCIDENTE', 'Accidente de Tránsito'),
        ('ESCUELA', 'Horario Escolar'),
    ]

    NIVELES_IMPACTO = [
        (1, 'Bajo (Poco tráfico extra)'),
        (2, 'Medio'),
        (3, 'Alto (Bastante congestión)'),
        (4, 'Crítico (Bloqueo total)'),
    ]

    nombre = models.CharField(max_length=100, help_text="Ej: Lluvia Torrencial, Concierto en Estadio")
    tipo = models.CharField(max_length=20, choices=TIPOS)
    fecha_inicio = models.DateTimeField()
    fecha_fin = models.DateTimeField()
    
    # Ubicación aproximada (opcional, pero útil para el mapa)
    latitud = models.FloatField(null=True, blank=True)
    longitud = models.FloatField(null=True, blank=True)
    
    # Qué tanto afecta al tráfico (para tu algoritmo A*)
    nivel_impacto = models.IntegerField(choices=NIVELES_IMPACTO, default=2)
    
    descripcion = models.TextField(blank=True)
    activo = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.nombre} ({self.get_tipo_display()})"

    class Meta:
        verbose_name = "Factor Externo"
        verbose_name_plural = "Factores Externos"
        ordering = ['-fecha_inicio']