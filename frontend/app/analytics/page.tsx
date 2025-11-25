"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { AnalyticsCharts } from "@/components/analytics-charts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { generateHourlyData, generateDailyComparison } from "@/lib/traffic-data"
import { Skeleton } from "@/components/ui/skeleton"

export default function AnalyticsPage() {
  const [hourlyData, setHourlyData] = useState([])
  const [dailyData, setDailyData] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = () => {
      setHourlyData(generateHourlyData())
      setDailyData(generateDailyComparison())
      setIsLoading(false)
    }

    loadData()
  }, [])

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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Page Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Análisis de Tráfico</h1>
            <p className="text-muted-foreground">
              Visualización de datos históricos y patrones de congestión en Los Chorros
            </p>
          </div>

          {/* Charts */}
          {hourlyData.length > 0 && dailyData.length > 0 && (
            <AnalyticsCharts hourlyData={hourlyData} dailyData={dailyData} />
          )}

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Hora Pico Principal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">7-8 AM</div>
                <p className="text-xs text-muted-foreground mt-2">Mayor flujo de entrada</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Hora Pico Secundaria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">5-6 PM</div>
                <p className="text-xs text-muted-foreground mt-2">Mayor flujo de salida</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Día Más Congestionado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">Viernes</div>
                <p className="text-xs text-muted-foreground mt-2">Pico fin de semana</p>
              </CardContent>
            </Card>
          </div>

          {/* Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Información Clave</CardTitle>
              <CardDescription>Patrones observados en el análisis histórico</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold text-sm">Congestión Matutina</h4>
                  <p className="text-sm text-muted-foreground">
                    Se observan picos consistentes entre las 7-8 AM con congestión promedio de 70%
                  </p>
                </div>
                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold text-sm">Congestión Vespertina</h4>
                  <p className="text-sm text-muted-foreground">
                    Los flujos de salida alcanzan congestión de 65-75% entre las 5-6 PM
                  </p>
                </div>
                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold text-sm">Flujo Nocturno</h4>
                  <p className="text-sm text-muted-foreground">
                    Menor presión vehicular después de las 9 PM con congestión promedio de 15-20%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
