"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { PredictionsChart } from "@/components/predictions-chart"
import { SegmentsVisualization } from "@/components/segments-visualization"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function PredictionsPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Page Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Predicciones de Tráfico</h1>
            <p className="text-muted-foreground">
              Análisis predictivo 24 horas con modelo baseline ARIMA y alertas de congestión crítica
            </p>
          </div>

          {/* Model Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Modelo Actual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">ARIMA</div>
                <p className="text-xs text-muted-foreground mt-1">Baseline v0.1</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Confianza Promedio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">88%</div>
                <p className="text-xs text-muted-foreground mt-1">Últimas 24h</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Horas Críticas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  <Badge>7-8 AM</Badge>
                  <Badge>5-6 PM</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Picos esperados</p>
              </CardContent>
            </Card>
          </div>

          {/* Predictions Chart */}
          <PredictionsChart />

          {/* Segments Status */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Estado Actual de Segmentos</h2>
            <SegmentsVisualization />
          </div>

          {/* Model Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Métricas del Modelo</CardTitle>
              <CardDescription>Performance del modelo ARIMA baseline</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">MAPE (Mean Absolute Percentage Error)</p>
                  <p className="text-3xl font-bold text-primary">12%</p>
                  <p className="text-xs text-muted-foreground mt-1">Error porcentual promedio</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">RMSE (Root Mean Squared Error)</p>
                  <p className="text-3xl font-bold text-primary">2.5</p>
                  <p className="text-xs text-muted-foreground mt-1">Desviación cuadrática</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">R² (Coeficiente de Determinación)</p>
                  <p className="text-3xl font-bold text-primary">0.92</p>
                  <p className="text-xs text-muted-foreground mt-1">Varianza explicada</p>
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
