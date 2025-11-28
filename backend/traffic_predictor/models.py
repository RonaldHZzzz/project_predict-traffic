from django.db import models
# Importamos los modelos de tu otra app 'trafico'
from trafico.models import Segmento, RutaAlterna

class PrediccionPorSegmento(models.Model):
    """
    Almacena la predicción de tráfico para un segmento individual en una fecha y hora específica.
    """
    segmento = models.ForeignKey(Segmento, on_delete=models.CASCADE, related_name='predicciones')
    fecha_hora_prediccion = models.DateTimeField(help_text="Fecha y hora para la cual se hace la predicción")
    
    # Valores predichos
    nivel_congestion_predicho = models.IntegerField(help_text="Nivel de congestión estimado (0-2)")
    velocidad_estimada = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    # Metadatos de control
    fecha_creacion = models.DateTimeField(auto_now_add=True, help_text="Cuándo se generó este registro")
    fecha_actualizacion = models.DateTimeField(auto_now=True, help_text="Última vez que se actualizó")

    class Meta:
        # ESTO ES CLAVE: Garantiza que solo haya una predicción por segmento y hora.
        # Facilita el uso de update_or_create() de Django.
        unique_together = ('segmento', 'fecha_hora_prediccion')
        ordering = ['fecha_hora_prediccion']
        verbose_name = "Predicción por Segmento"
        verbose_name_plural = "Predicciones por Segmento"

    def __str__(self):
        return f"Predicción {self.segmento.nombre} - {self.fecha_hora_prediccion}"


class PrediccionRutaOptima(models.Model):
    """
    Almacena cuál es la mejor ruta (o segmento) calculada para un momento específico.
    Evita tener que correr el algoritmo de optimización cada vez.
    """
    fecha_hora_objetivo = models.DateTimeField(unique=True, help_text="Fecha y hora para la cual esta ruta es la mejor")
    
    # La ruta ganadora
    ruta_recomendada = models.ForeignKey(RutaAlterna, on_delete=models.CASCADE, related_name='recomendaciones')
    
    # Datos agregados de la recomendación (opcional, pero útil para mostrar rápido en el frontend)
    tiempo_promedio_estimado = models.DecimalField(max_digits=10, decimal_places=2, help_text="Tiempo total estimado en minutos")
    nivel_trafico_promedio = models.DecimalField(max_digits=4, decimal_places=2, help_text="Promedio de congestión de la ruta completa")

    fecha_calculo = models.DateTimeField(auto_now_add=True, help_text="Cuándo se tomó esta decisión")

    class Meta:
        ordering = ['-fecha_hora_objetivo']
        verbose_name = "Predicción de Ruta Óptima"
        verbose_name_plural = "Predicciones de Rutas Óptimas"

    def __str__(self):
        return f"Mejor ruta para {self.fecha_hora_objetivo}: {self.ruta_recomendada.nombre}"