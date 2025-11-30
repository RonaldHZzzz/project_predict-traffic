import "leaflet/dist/leaflet.css";
import L from "leaflet";
import dynamic from "next/dynamic";
import { useMemo, useEffect } from "react";
import { useMap } from "react-leaflet";
import type { TrafficPoint, Segmento, BusStop } from "@/lib/traffic-data";
import { MapContent } from "./MapContent";

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

// --- Componente para centrar el mapa en el tramo seleccionado ---
function MapUpdater({
  selectedSegment,
}: {
  selectedSegment: Segmento | undefined;
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedSegment && selectedSegment.geometry.length > 0) {
      const bounds = selectedSegment.geometry.map(
        ([lng, lat]) => [lat, lng] as [number, number]
      );
      // Hacemos zoom al tramo con padding
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16, animate: true });
    }
  }, [selectedSegment, map]);

  return null;
}

export interface MapDisplayProps {
  points: TrafficPoint[];
  segmentos?: Segmento[];
  selectedSegmentId?: number | null;
  onSelectSegment?: (id: number | null, pointId?: string | null) => void;
  busStops?: BusStop[]; // ahora opcional
  recommendedRoute?: any | null;
}

export function MapDisplay({
  points,
  segmentos = [],
  selectedSegmentId = null,
  onSelectSegment,
  busStops = [],
  recommendedRoute = null,
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

  const selectedSegmentData = useMemo(
    () => segmentos.find((s) => s.segmento_id === selectedSegmentId),
    [segmentos, selectedSegmentId]
  );

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
      <style jsx global>{`
        .segment-glow {
          filter: drop-shadow(0 0 5px currentColor)
            drop-shadow(0 0 10px currentColor);
          stroke-dasharray: 12, 12;
          animation: dash 60s linear infinite;
        }

        @keyframes dash {
          to {
            stroke-dashoffset: -1000;
          }
        }

        .bus-stop-icon {
          width: 24px;
          height: 24px;
          border-radius: 9999px;
          background: rgba(34, 197, 94, 0.95);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 14px;
          box-shadow: 0 0 10px rgba(34, 197, 94, 0.8);
          border: 2px solid white;
        }
      `}</style>

      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        className="z-0"
      >
        <MapUpdater selectedSegment={selectedSegmentData} />

        {/* TileLayer rápido de OpenStreetMap */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        <MapContent
          points={points}
          segmentos={segmentos}
          busStops={busStops ?? []}
          selectedSegmentId={selectedSegmentId}
          onSelectSegment={onSelectSegment}
          congestionBySegmento={congestionBySegmento}
          getLineColor={getLineColor}
        />
      </MapContainer>
    </div>
  );
}