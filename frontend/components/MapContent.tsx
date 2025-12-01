"use client";

import { useEffect, useRef } from "react";
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
  recommendedRoute?: any | null;
  isRecommending?: boolean;
  constructionSegmentId?: number | null;
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
  recommendedRoute = null,
  isRecommending = false,
  constructionSegmentId = null,
}: MapContentProps) {
  const map = useMap();
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const loadingOverlayRef = useRef<L.LayerGroup<any> | null>(null);

  // ⭐⭐ AQUI AGREGAMOS EL recommendedId ⭐⭐
  const recommendedId =
    recommendedRoute?.segmento_recomendado?.segmento_id ?? null;

  useEffect(() => {
    // Limpiar capa de ruta anterior
    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    // Log para depuración
    if (recommendedRoute) {
      console.log("Ruta recomendada recibida:", recommendedRoute);
    }

    // Dibujar nueva ruta recomendada
    if (recommendedId) {
      const bestSegment = segmentos.find(
        (s) => s.segmento_id === recommendedId
      );

      if (bestSegment) {
        const routePositions = bestSegment.geometry.map(
          ([lng, lat]) => [lat, lng] as [number, number]
        );

        if (routePositions.length > 0) {
          const routePolyline = L.polyline(routePositions, {
            color: "#2563eb",
            weight: 8,
            opacity: 0.9,
            className: "recommended-route",
          }).addTo(map);

          map.fitBounds(routePolyline.getBounds(), { padding: [40, 40] });
          routeLayerRef.current = routePolyline;
        }
      }
    }
  }, [recommendedId, recommendedRoute, segmentos, map]);

  useEffect(() => {
    // Clean map layers except recommended route
    map.eachLayer((layer) => {
      if ((layer instanceof L.Polyline || layer instanceof L.Marker) && layer !== routeLayerRef.current) {
        map.removeLayer(layer);
      }
    });

    // Dibujar segmentos
    segmentos.forEach((segmento) => {
      const isRecommended = recommendedId && segmento.segmento_id === recommendedId;

      // No dibujar el segmento recomendado aquí porque ya lo dibujamos en el efecto anterior
      if (isRecommended) return;

      const positions = segmento.geometry.map(
        ([lng, lat]) => [lat, lng] as [number, number]
      );

      const isAnyRecommended = recommendedId !== null;

      let color = getLineColor(congestionBySegmento.get(segmento.segmento_id) ?? 25);
      let weight = 5;
      let opacity = 0.8;
      let className = "";

      const isSelected = selectedSegmentId === segmento.segmento_id;
      const isConstruction = constructionSegmentId === segmento.segmento_id;

      if (isConstruction) {
        color = "#ffcc00"; // Amarillo para construcción
        weight = 8;
        opacity = 1;
        className = "segment-glow";
      } else if (isAnyRecommended) {
        // Atenuar todos los que NO son recomendados
        color = '#808080';
        weight = 2;
        opacity = 0.3;
      } else if (selectedSegmentId !== null) {
        if (isSelected) {
          weight = 8;
          opacity = 1;
          className = "segment-glow";
        } else {
          opacity = 0.3;
          weight = 3;
        }
      }

      const polyline = L.polyline(positions, {
        color,
        weight,
        opacity,
        className,
      }).addTo(map);

      if (onSelectSegment) {
        polyline.on("click", () => {
          onSelectSegment(isSelected ? null : segmento.segmento_id, null);
        });
      }
    });

    // Dibujar puntos
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

    // Dibujar paradas de bus
    (busStops ?? []).forEach((stop) => {
      L.marker([stop.lat, stop.lon], { icon: busStopIcon })
        .addTo(map)
        .bindPopup(
          `<div class="text-sm"><p class="font-semibold">${
            stop.nombre || "Parada de bus"
          }</p><p class="text-xs mt-1">Segmento: ${stop.segmento}</p></div>`
        );
    });
  }, [
    points,
    segmentos,
    busStops,
    selectedSegmentId,
    congestionBySegmento,
    getLineColor,
    onSelectSegment,
    map,
    recommendedRoute,
    recommendedId,
    constructionSegmentId,
  ]);

  return null;
}
