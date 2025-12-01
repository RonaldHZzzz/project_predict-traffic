"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { AnalyticsCharts } from "@/components/analytics-charts"




export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold">Análisis de Tráfico Detallado</h1>
            <p className="text-muted-foreground">
              Explore las métricas de tráfico por fecha y segmento, incluyendo horas pico y niveles de congestión.
            </p>
          </div>

          {/* Analytics Charts Component */}
          <AnalyticsCharts />

        </div>
      </main>

      <Footer />
    </div>
  )
}