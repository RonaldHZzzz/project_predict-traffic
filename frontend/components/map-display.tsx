"use client";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import dynamic from "next/dynamic";
import { useMemo, useEffect } from "react";
import { useMap } from "react-leaflet";
import type { TrafficPoint, Segmento } from "@/lib/traffic-data";

// Fix Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
  ssr: false,
});
const Polyline = dynamic(
  () => import("react-leaflet").then((mod) => mod.Polyline),
  { ssr: false }
);

// --- Componente para centrar el mapa en el tramo seleccionado ---
function MapUpdater({ 
  selectedSegment, 
  defaultCenter 
}: { 
  selectedSegment: Segmento | undefined, 
  defaultCenter: [number, number] 
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedSegment && selectedSegment.geometry.length > 0) {
      const bounds = selectedSegment.geometry.map(([lng, lat]) => [lat, lng] as [number, number]);
      // Hacemos zoom al tramo con padding para que no quede pegado a los bordes
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16, animate: true });
    }
  }, [selectedSegment, map]);

  return null;
}

export interface MapDisplayProps {
  points: TrafficPoint[];
  segmentos?: Segmento[];
  selectedSegmentId?: number | null;
  onSelectSegment?: (id: number | null) => void;
}

export function MapDisplay({ 
  points, 
  segmentos = [], 
  selectedSegmentId = null,
  onSelectSegment 
}: MapDisplayProps) {

  // Centro dinámico
  const mapCenter = useMemo(() => {
    if (!points || points.length === 0) {
      return [13.7385, -89.209] as [number, number];
    }
    const avgLat = points.reduce((acc, p) => acc + p.lat, 0) / points.length;
    const avgLng = points.reduce((acc, p) => acc + p.lng, 0) / points.length;
    return [avgLat, avgLng] as [number, number];
  }, [points]);

  const selectedSegmentData = useMemo(() => 
    segmentos.find(s => s.segmento_id === selectedSegmentId),
  [segmentos, selectedSegmentId]);

  const congestionBySegmento = useMemo(() => {
    const map = new Map<number, number>();
    points.forEach((point) => {
      map.set(parseInt(point.id), point.congestion);
    });
    return map;
  }, [points]);

  const getLineColor = (congestion: number) => {
    if (congestion < 30) return "#10b981"; // verde
    if (congestion < 50) return "#f59e0b"; // amarillo
    if (congestion < 75) return "#ff7242"; // naranja
    return "#ef4444"; // rojo
  };

  return (
    <div className="h-full rounded-lg overflow-hidden border border-border relative">
      {/* CAMBIO: CSS ajustado para mapa claro.
         En lugar de brillo blanco, usamos una sombra doble del mismo color (currentColor)
         para crear un efecto de "resplandor" intenso que se ve bien sobre blanco.
      */}
      <style jsx global>{`
        .segment-glow {
          /* Sombra suave + Sombra fuerte del mismo color */
          filter: drop-shadow(0 0 5px currentColor) drop-shadow(0 0 10px currentColor);
          stroke-dasharray: 12, 12;
          animation: dash 60s linear infinite;
        }
        
        @keyframes dash {
          to {
            stroke-dashoffset: -1000;
          }
        }
      `}</style>

      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        className="z-0"
      >
        <MapUpdater selectedSegment={selectedSegmentData} defaultCenter={mapCenter} />

        {/* CAMBIO: Volvemos al TileLayer rápido de OpenStreetMap */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />

        {segmentos.map((segmento) => {
          const positions = segmento.geometry.map(
            ([lng, lat]) => [lat, lng] as [number, number]
          );
          const congestion = congestionBySegmento.get(segmento.segmento_id) ?? 25;
          const color = getLineColor(congestion);

          const isSelected = selectedSegmentId === segmento.segmento_id;
          const isAnySelected = selectedSegmentId !== null;

          // Lógica de visibilidad
          const opacity = isAnySelected ? (isSelected ? 1 : 0.2) : 0.8; 
          // Subí la opacidad de los no seleccionados a 0.2 para que no desaparezcan por completo en fondo blanco
          
          const weight = isSelected ? 8 : 5;
          const className = isSelected ? "segment-glow" : "";

          const eventHandlers = {
            click: () => {
              if (onSelectSegment) {
                onSelectSegment(isSelected ? null : segmento.segmento_id);
              }
            },
          };

          return (
            <Polyline
              key={segmento.segmento_id}
              positions={positions}
              color={color}
              weight={weight}
              opacity={opacity}
              lineJoin="round"
              className={className}
              eventHandlers={eventHandlers}
            />
          );
        })}

        {points.map((point) => (
          <Marker key={point.id} position={[point.lat, point.lng]}>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{point.name}</p>
                <p className="text-xs mt-1">Congestión: {Math.round(point.congestion)}%</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}