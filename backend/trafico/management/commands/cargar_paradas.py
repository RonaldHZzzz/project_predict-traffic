from django.core.management.base import BaseCommand
from django.contrib.gis.geos import Point

from trafico.models import Segmento, ParadaBus

# 👇 Ajusta este import según dónde tengas la función
# Por ejemplo si está en traffic_predictor/paradas_osm.py:
# from traffic_predictor.paradas_osm import get_bus_stops_in_segment_bbox
from paradas_osm import get_bus_stops_in_segment_bbox



class Command(BaseCommand):
    help = "Carga paradas oficiales de bus (OSM) para cada segmento"

    def handle(self, *args, **options):
        segmentos = Segmento.objects.all()

        if not segmentos.exists():
            self.stdout.write(self.style.WARNING("No hay segmentos en la BD"))
            return

        for segmento in segmentos:
            self.stdout.write(
                self.style.NOTICE(
                    f"Buscando paradas para segmento {segmento.segmento_id} - {segmento.nombre}..."
                )
            )

            # Esta función debe devolver una lista de paradas con lon/lat, id y nombre.
            paradas = get_bus_stops_in_segment_bbox(segmento)

            if not paradas:
                self.stdout.write("  → Sin paradas encontradas para este segmento")
                continue

            creadas = 0

            for parada in paradas:
                # ⚠️ ADAPTA ESTAS CLAVES A LO QUE DEVUELVE TU FUNCION
                # Ejemplo típico de Overpass: {"id": 123, "lat": ..., "lon": ..., "tags": {"name": "Parada X"}}
                osm_id = str(parada.get("osm_id") or parada.get("id"))

                if not osm_id:
                    continue

                # Evitar duplicados por osm_id
                if ParadaBus.objects.filter(osm_id=osm_id).exists():
                    continue

                lon = parada.get("lon")
                lat = parada.get("lat")

                if lon is None or lat is None:
                    continue

                nombre = (
                    parada.get("name")
                    or parada.get("tags", {}).get("name")
                    or ""
                )

                ParadaBus.objects.create(
                    segmento=segmento,
                    osm_id=osm_id,
                    nombre=nombre,
                    geom=Point(lon, lat),
                )
                creadas += 1

            self.stdout.write(
                self.style.SUCCESS(f"  → {creadas} paradas creadas para este segmento")
            )

        self.stdout.write(self.style.SUCCESS("Carga de paradas finalizada ✅"))
