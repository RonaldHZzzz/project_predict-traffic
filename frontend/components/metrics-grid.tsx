"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { TrafficMetrics } from "@/lib/traffic-data"

interface MetricsGridProps {
  metrics: TrafficMetrics
  congestionLevel: number
}

export function MetricsGrid({ metrics, congestionLevel }: MetricsGridProps) {
  const getCongestingStatus = (level: number) => {
    if (level < 30)
      return { label: "Fluido", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" }
    if (level < 50)
      return { label: "Moderado", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100" }
    if (level < 75)
      return {
        label: "Congestionado",
        className: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
      }
    return { label: "Colapsado", className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100" }
  }

  const status = getCongestingStatus(congestionLevel)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Estado General</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold">{congestionLevel}%</div>
            <Badge className={status.className}>{status.label}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Tiempo Estimado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{metrics.estimatedTime} min</div>
          <p className="text-xs text-muted-foreground mt-2">De entrada a salida</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Vehículos por Hora</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{Math.round(metrics.totalVehicles / 1000)}k</div>
          <p className="text-xs text-muted-foreground mt-2">Total en puntos monitoreados</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Velocidad Promedio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{metrics.avgSpeed} km/h</div>
          <p className="text-xs text-muted-foreground mt-2">En todo el tramo</p>
        </CardContent>
      </Card>
    </div>
  )
}
