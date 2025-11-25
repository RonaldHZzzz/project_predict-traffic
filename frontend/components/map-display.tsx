"use client"

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

  return (
    <div className="h-full rounded-lg overflow-hidden border border-border">
      <MapContainer center={[13.7385, -89.209]} zoom={15} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        <Polyline positions={roadLine} color="#3b82f6" weight={5} opacity={0.8} />

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
