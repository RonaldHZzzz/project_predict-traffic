"use client"
import "leaflet/dist/leaflet.css"  
import dynamic from "next/dynamic"
import { useMemo } from "react"
import type { TrafficPoint } from "@/lib/traffic-data"

const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false })
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false })
const Polyline = dynamic(() => import("react-leaflet").then((mod) => mod.Polyline), { ssr: false })

interface MapDisplayProps {
  points: TrafficPoint[]
}

export function MapDisplay({ points }: MapDisplayProps) {
  // Línea base aproximada de Los Chorros (puedes luego reemplazar con geometría real del backend)
  const roadLine = useMemo(
    () => [
      [13.737, -89.212],
      [13.7375, -89.211],
      [13.738, -89.21],
      [13.7385, -89.209],
      [13.739, -89.208],
      [13.7395, -89.207],
      [13.74, -89.206],
    ],
    [],
  )

  // Centro dinámico: si hay puntos, promediamos sus coordenadas
  const mapCenter = useMemo(() => {
    if (!points || points.length === 0) {
      return [13.7385, -89.209] as [number, number] // centro por defecto
    }

    const avgLat = points.reduce((acc, p) => acc + p.lat, 0) / points.length
    const avgLng = points.reduce((acc, p) => acc + p.lng, 0) / points.length

    return [avgLat, avgLng] as [number, number]
  }, [points])

  // Color dinámico de la línea según la congestión promedio de los puntos
  const lineColor = useMemo(() => {
    if (!points || points.length === 0) return "#3b82f6" // azul por defecto

    const avgCongestion = points.reduce((acc, p) => acc + p.congestion, 0) / points.length

    if (avgCongestion < 30) return "#10b981" // verde (fluido)
    if (avgCongestion < 50) return "#f59e0b" // amarillo (moderado)
    if (avgCongestion < 75) return "#ff7242" // naranja (congestionado)
    return "#ef4444" // rojo (colapsado)
  }, [points])

  return (
    <div className="h-full rounded-lg overflow-hidden border border-border">
      <MapContainer center={mapCenter} zoom={15} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        {/* Línea principal de Los Chorros con color según congestión */}
        <Polyline positions={roadLine} color={lineColor} weight={5} opacity={0.8} />

        {/* Marcadores de cada punto de monitoreo */}
        {points.map((point) => (
          <Marker key={point.id} position={[point.lat, point.lng]}>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{point.name}</p>
                <p className="text-xs text-muted-foreground mt-1">Estado: {point.status}</p>
                <p className="text-xs mt-1">Congestión: {Math.round(point.congestion)}%</p>
                <p className="text-xs">Velocidad: {Math.round(point.avgSpeed)} km/h</p>
                <p className="text-xs">Vehículos/h: {Math.round(point.vehiclesPerHour)}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
