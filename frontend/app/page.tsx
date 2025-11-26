"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { MetricsGrid } from "@/components/metrics-grid"
import { ControlPanel } from "@/components/control-panel"
import { getTrafficPoints, getCurrentMetrics } from "@/lib/traffic-data"
import { Skeleton } from "@/components/ui/skeleton"
// 👇 la usaremos cuando creemos el helper de Matrix
import { getMatrixData } from "@/lib/matrix"
import 'leaflet/dist/leaflet.css';

const MapDisplay = dynamic(
  () => import("@/components/map-display").then((mod) => ({ default: mod.MapDisplay })),
  {
    ssr: false,
    loading: () => <Skeleton className="w-full h-full rounded-lg" />,
  },
)

export default function DashboardPage() {
  const [trafficPoints, setTrafficPoints] = useState<any[]>([])
  const [metrics, setMetrics] = useState<any | null>(null)
  const [avgCongestion, setAvgCongestion] = useState(0)
  
  // Estado para la carga inicial (muestra skeletons)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  
  const [matrixData, setMatrixData] = useState<any | null>(null)
  const [matrixError, setMatrixError] = useState<string | null>(null)

  // Función separada para cargar datos
  const fetchData = async (isFirstLoad = false) => {
    try {
      if (isFirstLoad) {
        setIsInitialLoading(true)
        setMatrixError(null)
      }

      const points = await getTrafficPoints()
      setTrafficPoints(points)

      const currentMetrics = getCurrentMetrics(points)
      setMetrics(currentMetrics)

      const avgCong = points.reduce((acc: number, p: any) => acc + p.congestion, 0) / points.length
      setAvgCongestion(avgCong)

      if (points.length >= 2) {
        const coordinates = points.map((p: any) => ({
          lat: p.lat,
          lng: p.lng,
        }))

        const matrix = await getMatrixData(coordinates)
        setMatrixData(matrix)
      }
    } catch (error) {
      console.error("Error cargando datos:", error)
      if (isFirstLoad) {
         setMatrixError("No se pudo cargar la información de tráfico o la matriz de tiempos.")
      }
    } finally {
      if (isFirstLoad) {
        setIsInitialLoading(false)
      }
    }
  }

  useEffect(() => {
    // Carga inicial
    fetchData(true)

    // Intervalo para refrescar datos sin mostrar skeleton
    const interval = setInterval(() => {
      fetchData(false)
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  if (isInitialLoading) {
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

  let tiempoRuta1 = null
  let tiempoRuta2 = null

  if (matrixData?.durations && matrixData.durations.length > 0) {
    const row0 = matrixData.durations[0]
    if (row0[1] != null) tiempoRuta1 = Math.round(row0[1] / 60) // en minutos
    if (row0[2] != null) tiempoRuta2 = Math.round(row0[2] / 60)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Metrics Grid */}
          {metrics && <MetricsGrid metrics={metrics} congestionLevel={Math.round(avgCongestion)} />}

          {/* Bloque simple para mostrar tiempos de Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-lg p-4">
              <h2 className="text-sm font-semibold mb-2">Tiempos entre rutas (Matrix API)</h2>
              {matrixError && <p className="text-xs text-red-500">{matrixError}</p>}
              {!matrixError && !matrixData && <p className="text-xs text-muted-foreground">Cargando matriz...</p>}

              {matrixData && (
                <div className="space-y-1 text-xs">
                  {tiempoRuta1 !== null && (
                    <p>
                      Ruta 1 (origen → punto 2): <span className="font-semibold">{tiempoRuta1} min</span>
                    </p>
                  )}
                  {tiempoRuta2 !== null && (
                    <p>
                      Ruta 2 (origen → punto 3): <span className="font-semibold">{tiempoRuta2} min</span>
                    </p>
                  )}
                  {!tiempoRuta1 && !tiempoRuta2 && <p>No hay suficientes puntos para calcular rutas.</p>}
                </div>
              )}
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map - Takes 2 columns */}
            <div className="lg:col-span-2">
              <div className="bg-card rounded-lg border border-border overflow-hidden" style={{ height: "500px" }}>
                {/* Renderizamos el mapa siempre que no sea carga inicial */}
                <MapDisplay points={trafficPoints} />
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
                {trafficPoints.map((point: any) => (
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