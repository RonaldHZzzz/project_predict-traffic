"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Segmento {
  segmento_id: string
  segmento_nombre: string
  velocidad_promedio: number
  nivel_congestion: number
  cantidad_vehiculos: number
  capacidad_segmento: number
}

export function SegmentsVisualization({ onSelectSegment }: { onSelectSegment?: (id: number | null) => void }) {

  const [segmentos, setSegmentos] = useState<Segmento[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchSegmentos = async () => {
      try {
        const response = await fetch("/api/trafico/actual")
        const data = await response.json()
        setSegmentos(data.data)
      } catch (error) {
        console.error("Error fetching segments:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSegmentos()
    const interval = setInterval(fetchSegmentos, 30000)
    return () => clearInterval(interval)
  }, [])

  const getCongestionColor = (level: number) => {
    if (level < 1.5) return "bg-emerald-100 text-emerald-800"
    if (level < 2.5) return "bg-amber-100 text-amber-800"
    if (level < 3.5) return "bg-orange-100 text-orange-800"
    return "bg-red-100 text-red-800"
  }

  const getCongestionLabel = (level: number) => {
    if (level < 1.5) return "Fluido"
    if (level < 2.5) return "Moderado"
    if (level < 3.5) return "Congestionado"
    return "Crítico"
  }

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Cargando segmentos...</div>
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">

      {segmentos.map((seg) => (
      <Card
      key={seg.segmento_id}
      className="cursor-pointer hover:bg-accent/40 transition"
      onClick={() => onSelectSegment?.(Number(seg.segmento_id))}
     >
          <CardHeader className="pb-3">
  <CardTitle className="text-base">{seg.segmento_nombre}</CardTitle>

  <Badge className={getCongestionColor(seg.nivel_congestion)}>
    {getCongestionLabel(seg.nivel_congestion)}
  </Badge>

  {/* NUEVO: mostrar estado textual */}
  <div className="mt-1 text-sm font-semibold">
    Estado: {getCongestionLabel(seg.nivel_congestion)}
  </div>
</CardHeader>

          <CardContent className="space-y-3">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Velocidad</span>
                <span className="font-semibold">{Math.round(seg.velocidad_promedio)} km/h</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full"
                  style={{ width: `${Math.min((seg.velocidad_promedio / 100) * 100, 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Capacidad</span>
                <span className="font-semibold">
                  {Math.round((seg.cantidad_vehiculos / seg.capacidad_segmento) * 100)}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-warning h-2 rounded-full"
                  style={{
                    width: `${Math.min((seg.cantidad_vehiculos / seg.capacidad_segmento) * 100, 100)}%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="pt-2 border-t border-border">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Vehículos/h</span>
                <span className="font-semibold">{Math.round(seg.cantidad_vehiculos)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
