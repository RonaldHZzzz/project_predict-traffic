"use client"
import { useEffect, useMemo } from "react"
import dynamic from "next/dynamic"
import "leaflet/dist/leaflet.css"
import "leaflet-defaulticon-compatibility"
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css"
// We import useMap normally. It won't break build unless called during SSR without context.
// But since MapContainer is dynamic(ssr: false), its children are safe.
import { useMap } from "react-leaflet" 

import type { TrafficPoint } from "@/lib/traffic-data"

// Dynamic imports for components that rely on 'window'
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false })
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false })
// const Polyline = dynamic(() => import("react-leaflet").then((mod) => mod.Polyline), { ssr: false }) // Unused in this snippet

interface MapDisplayProps {
  points: TrafficPoint[]
}

// Helper component to recenter map. 
// This component uses useMap, so it MUST be rendered inside MapContainer.
const MapUpdater = ({ center }: { center: [number, number] }) => {
  const map = useMap() 
  useEffect(() => {
    if (map) map.setView(center, 15)
  }, [center, map])
  return null
}

export function MapDisplay({ points }: MapDisplayProps) {
  
  const defaultCenter: [number, number] = [13.6766, -89.2847]

  const mapCenter = useMemo(() => {
    if (!points || points.length === 0) return defaultCenter

    const avgLat = points.reduce((acc, p) => acc + p.lat, 0) / points.length
    const avgLng = points.reduce((acc, p) => acc + p.lng, 0) / points.length

    return [avgLat, avgLng] as [number, number]
  }, [points])

  return (
    <div className="h-[600px] w-full rounded-lg overflow-hidden border border-border relative z-0">
      <MapContainer 
        center={defaultCenter} 
        zoom={15} 
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        {/* MapUpdater is a child of MapContainer, so useMap will work fine client-side */}
        <MapUpdater center={mapCenter} />

        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />

        {points?.map((point) => (
          <Marker key={point.id} position={[point.lat, point.lng]}>
            <Popup>
              <div className="p-2">
                <h3 className="font-bold">{point.name}</h3>
                <p>Velocidad: {point.avgSpeed} km/h</p>
                <p>Congestión: {point.congestion}%</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}