"use client"
import "leaflet/dist/leaflet.css"  
import dynamic from "next/dynamic"
import { useMemo } from "react"
import type { TrafficPoint, Segmento } from "@/lib/traffic-data"

const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false })
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false })
const Polyline = dynamic(() => import("react-leaflet").then((mod) => mod.Polyline), { ssr: false })

interface MapDisplayProps {
  points: TrafficPoint[]
  segmentos?: Segmento[]
}

export function MapDisplay({ points, segmentos = [] }: MapDisplayProps) {
  // Centro dinámico: si hay puntos, promediamos sus coordenadas
  const mapCenter = useMemo(() => {
    if (!points || points.length === 0) {
      return [13.7385, -89.209] as [number, number] // centro por defecto
    }

    const avgLat = points.reduce((acc, p) => acc + p.lat, 0) / points.length
    const avgLng = points.reduce((acc, p) => acc + p.lng, 0) / points.length

    return [avgLat, avgLng] as [number, number]
  }, [points])

  // Función para obtener color según congestión
  const getLineColor = (congestion: number) => {
    if (congestion < 30) return "#10b981" // verde (fluido)
    if (congestion < 50) return "#f59e0b" // amarillo (moderado)
    if (congestion < 75) return "#ff7242" // naranja (congestionado)
    return "#ef4444" // rojo (colapsado)
  }

  // Crear un mapa de congestión por segmento_id para colorear las líneas
  const congestionBySegmento = useMemo(() => {
    const map = new Map<number, number>()
    points.forEach((point) => {
      map.set(parseInt(point.id), point.congestion)
    })
    return map
  }, [points])

  return (
    <div className="h-full rounded-lg overflow-hidden border border-border">
      <MapContainer center={mapCenter} zoom={13} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        {/* Renderizar cada segmento como una polyline */}
        {segmentos.map((segmento) => {
          // Convertir geometry de [lng, lat] a [lat, lng] para Leaflet
          const positions = segmento.geometry.map(([lng, lat]) => [lat, lng] as [number, number])
          const congestion = congestionBySegmento.get(segmento.segmento_id) ?? 25
          const color = getLineColor(congestion)

          return (
            <Polyline
              key={segmento.segmento_id}
              positions={positions}
              color={color}
              weight={4}
              opacity={0.8}
              lineJoin="round"
            />
          )
        })}

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
