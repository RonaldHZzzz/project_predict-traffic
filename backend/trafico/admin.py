from django.contrib.gis.admin import GISModelAdmin
from django.contrib import admin
from .models import Segmento, MedicionTrafico, RutaAlterna, RutaAlternaSegmento

class SegmentoAdmin(GISModelAdmin):
    # Opcional: centrar mapa (pero será un mapa "default", no OSM bonito)
    default_lon = -8928700
    default_lat = 1376000
    default_zoom = 12

class RutaAlternaSegmentoInline(admin.TabularInline):
    model = RutaAlternaSegmento
    extra = 1

class RutaAlternaAdmin(admin.ModelAdmin):
    inlines = [RutaAlternaSegmentoInline]

admin.site.register(Segmento, SegmentoAdmin)
admin.site.register(MedicionTrafico)
admin.site.register(RutaAlterna, RutaAlternaAdmin)
