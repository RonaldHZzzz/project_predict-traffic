"use client"

import { type TrafficPoint, getStatusColor, getStatusLabel } from "@/lib/traffic-data"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface TrafficStatusProps {
  points: TrafficPoint[]
}

export function TrafficStatus({ points }: TrafficStatusProps) {
  return (
    <div className="space-y-3 max-h-[500px] overflow-y-auto">
      {points.map((point) => (
        <Card key={point.id}>
          <CardContent className="pt-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm mb-1">{point.name}</h4>
                <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                  <div>
                    <span className="block font-medium text-foreground">{Math.round(point.avgSpeed)} km/h</span>
                    Velocidad
                  </div>
                  <div>
                    <span className="block font-medium text-foreground">{Math.round(point.vehiclesPerHour)}</span>
                    Vehículos/h
                  </div>
                  <div>
                    <span className="block font-medium text-foreground">{Math.round(point.congestion)}%</span>
                    Congestión
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0">
                <Badge
                  style={{
                    backgroundColor: getStatusColor(point.status),
                    color: "white",
                  }}
                >
                  {getStatusLabel(point.status)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
