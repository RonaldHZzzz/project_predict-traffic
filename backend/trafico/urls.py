from django.urls import path
from . import views

urlpatterns = [
 
    # Matrix API
    path("matrix/", views.matrix_api, name="matrix_api"),
    # Daily Metrics
    path("metrics/daily/", views.metricas_diarias, name="metricas_diarias"),
    # Paradas de bus
    path("paradas/", views.paradas_todos_segmentos, name="paradas_todos_segmentos"),
    path(
        "segmentos/<int:segmento_id>/paradas/",
        views.paradas_por_segmento,
        name="paradas_por_segmento",
    ),
]
