# paradas_osm.py
import requests

OVERPASS_URL = "https://overpass-api.de/api/interpreter"


def get_bus_stops_in_segment_bbox(segmento, padding=0.0005):
    """
    Dado un objeto Segmento (con geometria = LineStringField SRID 4326),
    consulta en OpenStreetMap las paradas oficiales de bus (highway=bus_stop)
    dentro de un bounding box alrededor del segmento.

    Retorna una lista de diccionarios con:
    - id (osm_id)
    - lat
    - lon
    - name
    """
    # extent = (minx, miny, maxx, maxy) = (lon_min, lat_min, lon_max, lat_max)
    minx, miny, maxx, maxy = segmento.geometria.extent

    # Overpass usa: (south, west, north, east) = (lat_min, lon_min, lat_max, lon_max)
    south = miny - padding
    west = minx - padding
    north = maxy + padding
    east = maxx + padding

    query = f"""
    [out:json];
    node
      ["highway"="bus_stop"]
      ({south},{west},{north},{east});
    out body;
    """

    response = requests.post(OVERPASS_URL, data={"data": query}, timeout=60)
    response.raise_for_status()
    data = response.json()

    bus_stops = []

    for el in data.get("elements", []):
        bus_stops.append(
            {
                "id": el["id"],
                "lat": el["lat"],
                "lon": el["lon"],
                "name": el.get("tags", {}).get("name"),
            }
        )

    return bus_stops
