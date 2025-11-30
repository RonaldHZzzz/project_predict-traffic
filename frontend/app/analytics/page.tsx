"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { AnalyticsCharts } from "@/components/analytics-charts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

// =============================
// 🔵 Tipos de datos del backend
// =============================
interface TrafficPrediction {
  segmento_id: number
  fecha: string
  hora: string
  nivel_congestion: number
  velocidad_kmh: number
  tiempo_estimado_min: number
  longitud_km: number
  carga_vehicular: number
  paradas_cercanas: number
}

type HourlyData = {
  hour: string
  vehicles: number
  avgSpeed: number
  congestion: number
}
interface BestSegmentResponse {
  fecha_hora: string
  mejor_segmento: number
  tiempo_estimado_min: number
  nivel_congestion: number
  origen: string
}
function adaptToHourlyData(data: TrafficPrediction[]) {
  return data.map((item) => ({
    hour: item.hora,
    vehicles: item.carga_vehicular,
    avgSpeed: item.velocidad_kmh,
    congestion: item.nivel_congestion,
  }))
}

export default function AnalyticsPage() {
  const [hourlyData, setHourlyData] = useState<TrafficPrediction[]>([])
  const [bestSegment, setBestSegment] = useState<BestSegmentResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // ==========================================================
  // 1) Cargar predicción del tráfico (24h)
  // ==========================================================
  async function loadTrafficPredictions() {
    const today = new Date()
    const fecha = today.toISOString().split("T")[0] // YYYY-MM-DD

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/predict-traffic/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        segmento_id: 10,
        fecha: fecha
      })
    })

    const data = await res.json()
    return data
  }

  // ==========================================================
  // 2) Cargar mejor segmento
  // ==========================================================
  async function loadBestSegment() {
    const now = new Date()
    const fecha = now.toISOString().slice(0, 19).replace("T", " ")

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/recommend-route/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fecha_hora: fecha
      })
    })

    const data = await res.json()
    return data
  }

  // ==========================================================
  // 3) Al montar el componente
  // ==========================================================
  useEffect(() => {
    async function load() {
      setIsLoading(true)

      const [pred24h, best] = await Promise.all([
        loadTrafficPredictions(),
        loadBestSegment()
      ])

      setHourlyData(pred24h || [])
      setBestSegment(best || null)

      setIsLoading(false)
    }

    load()
  }, [])

  // ==========================================================
  // Loading UI
  // ==========================================================
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 p-4 md:p-6">
          <Skeleton className="h-96 w-full rounded-lg" />
        </main>
      </div>
    )
  }

  // ==========================================================
  // Calcular estadísticas rápidas
  // ==========================================================
  let horaPeak = "-"
  if (hourlyData.length > 0) {
    const highest = hourlyData.reduce((prev, curr) =>
      curr.nivel_congestion > prev.nivel_congestion ? curr : prev
    )
    horaPeak = highest.hora
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold">Análisis de Tráfico (Datos Reales)</h1>
            <p className="text-muted-foreground">
              Basado en las predicciones de tráfico generadas por el modelo
            </p>
          </div>

          {/* Charts */}
          {hourlyData.length > 0 && (
            <AnalyticsCharts hourlyData={hourlyData} />
          )}

          {/* Mejor Segmento */}
          {bestSegment !== null && (
            <Card>
              <CardHeader>
                <CardTitle>Mejor Segmento</CardTitle>
                <CardDescription>Recomendado según el estado actual del tráfico</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">
                  Segmento #{bestSegment.mejor_segmento}
                </div>
                <p className="text-muted-foreground">
                  Tiempo estimado: {bestSegment.tiempo_estimado_min} min
                </p>
                <p className="text-muted-foreground">
                  Nivel congestión: {bestSegment.nivel_congestion}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Estadísticas rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Hora pico mayor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{horaPeak}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Día actual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {new Date().toLocaleDateString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Segmentos evaluados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">10</div>
              </CardContent>
            </Card>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  )
}
