"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { MetricsGrid } from "@/components/metrics-grid"
import { ControlPanel } from "@/components/control-panel"
import { getTrafficPoints, getCurrentMetrics } from "@/lib/traffic-data"
import { Skeleton } from "@/components/ui/skeleton"

const MapDisplay = dynamic(() => import("@/components/map-display").then((mod) => ({ default: mod.MapDisplay })), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-full rounded-lg" />,
})

export default function DashboardPage() {
  const [trafficPoints, setTrafficPoints] = useState([])
  const [metrics, setMetrics] = useState(null)
  const [avgCongestion, setAvgCongestion] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = () => {
      const points = getTrafficPoints()
      setTrafficPoints(points)

      const currentMetrics = getCurrentMetrics()
      setMetrics(currentMetrics)

      const avgCong = points.reduce((acc, p) => acc + p.congestion, 0) / points.length
      setAvgCongestion(avgCong)

      setIsLoading(false)
    }

    loadData()
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 p-4 md:p-6">
          <Skeleton className="h-40 w-full mb-6 rounded-lg" />
          <Skeleton className="h-96 w-full rounded-lg" />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Metrics Grid */}
          {metrics && <MetricsGrid metrics={metrics} congestionLevel={Math.round(avgCongestion)} />}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map - Takes 2 columns */}
            <div className="lg:col-span-2">
              <div className="bg-card rounded-lg border border-border overflow-hidden" style={{ height: "500px" }}>
                {trafficPoints.length > 0 && <MapDisplay points={trafficPoints} />}
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              <ControlPanel />
            </div>
          </div>

          {/* Traffic Status */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-3">
              <h2 className="text-xl font-semibold mb-4">Estado de Puntos de Monitoreo</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {trafficPoints.map((point) => (
                  <div key={point.id} className="bg-card border border-border rounded-lg p-4">
                    <h3 className="font-semibold text-sm mb-3 line-clamp-2">{point.name}</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Velocidad</span>
                        <span className="font-medium">{Math.round(point.avgSpeed)} km/h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Congestión</span>
                        <span className="font-medium">{Math.round(point.congestion)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Vehículos/h</span>
                        <span className="font-medium">{Math.round(point.vehiclesPerHour)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
