"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import type { TrafficPoint, Segmento, BusStop } from "@/lib/traffic-data";

interface MapContentProps {
  points: TrafficPoint[];
  segmentos: Segmento[];
  busStops: BusStop[];
  selectedSegmentId: number | null;
  onSelectSegment: ((id: number | null, pointId?: string | null) => void) | undefined;
  congestionBySegmento: Map<number, number>;
  getLineColor: (congestion: number) => string;
}

const busStopIcon = L.divIcon({
  html: `<div class="bus-stop-icon">🚌</div>`,
  className: "",
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -28],
});

export function MapContent({
  points,
  segmentos,
  busStops,
  selectedSegmentId,
  onSelectSegment,
  congestionBySegmento,
  getLineColor,
}: MapContentProps) {
  const map = useMap();

  useEffect(() => {
    // Clear existing layers
    map.eachLayer((layer) => {
      if (layer instanceof L.Polyline || layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Add new polylines
    segmentos.forEach((segmento) => {
      const positions = segmento.geometry.map(
        ([lng, lat]) => [lat, lng] as [number, number]
      );
      const congestion =
        congestionBySegmento.get(segmento.segmento_id) ?? 25;
      const color = getLineColor(congestion);

      const isSelected = selectedSegmentId === segmento.segmento_id;
      const isAnySelected = selectedSegmentId !== null;

      const opacity = isAnySelected ? (isSelected ? 1 : 0.2) : 0.8;
      const weight = isSelected ? 8 : 5;
      const className = isSelected ? "segment-glow" : "";

      const polyline = L.polyline(positions, {
        color,
        weight,
        opacity,
        className,
      }).addTo(map);

      if (onSelectSegment) {
        polyline.on("click", () => {
          onSelectSegment(
            isSelected ? null : segmento.segmento_id,
            null
          );
        });
      }
    });

    // Add new markers
    points.forEach((point) => {
      L.marker([point.lat, point.lng])
        .addTo(map)
        .bindPopup(
          `<div class="text-sm"><p class="font-semibold">${
            point.name
          }</p><p class="text-xs mt-1">Congestión: ${Math.round(
            point.congestion
          )}%</p></div>`
        );
    });

    // Add bus stops
    (busStops ?? []).forEach((stop) => {
      L.marker([stop.lat, stop.lon], { icon: busStopIcon })
        .addTo(map)
        .bindPopup(
          `<div class="text-sm"><p class="font-semibold">${
            stop.nombre || "Parada de bus"
          }</p><p class="text-xs mt-1">Segmento: ${stop.segmento}</p></div>`
        );
    });
  }, [points, segmentos, busStops, selectedSegmentId, congestionBySegmento, getLineColor, onSelectSegment, map]);

  return null;
}
