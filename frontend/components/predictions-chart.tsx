"use client"

import { useEffect, useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface PredictionData {
  hora: number
  velocidad_predicha: number
  congestion_predicha: number
  confianza_prediccion: number
  alertas: Array<{ tipo: string; severidad: string }>
}

export function PredictionsChart() {
  const [predictions, setPredictions] = useState<PredictionData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [criticalAlerts, setCriticalAlerts] = useState<string[]>([])

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        const response = await fetch("/api/predicciones")
        const data = await response.json()

        // Get unique predictions by hour
        const uniquePredictions = data.data.reduce((acc: any, curr: any) => {
          const existing = acc.find((p: any) => p.hora === curr.hora)
          if (!existing) {
            acc.push(curr)
          }
          return acc
        }, [])

        setPredictions(uniquePredictions.sort((a: any, b: any) => a.hora - b.hora))

        // Extract critical alerts
        const alerts = uniquePredictions
          .filter((p: any) => p.alertas.length > 0)
          .map((p: any) => `Hora ${p.hora}: ${p.alertas[0].tipo}`)
        setCriticalAlerts(alerts)
      } catch (error) {
        console.error("Error fetching predictions:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPredictions()
  }, [])

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Cargando predicciones...</div>
  }

  return (
    <div className="space-y-4">
      {criticalAlerts.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Alertas críticas detectadas:</strong> {criticalAlerts.join(" | ")}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Predicciones 24 Horas</CardTitle>
          <CardDescription>Modelo ARIMA Baseline - Confianza promedio: 88%</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={predictions}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                dataKey="hora"
                label={{ value: "Hora del Día", position: "insideBottomRight", offset: -5 }}
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
              />
              <YAxis
                yAxisId="left"
                label={{ value: "Velocidad (km/h)", angle: -90, position: "insideLeft" }}
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                label={{ value: "Congestión (1-5)", angle: 90, position: "insideRight" }}
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                }}
                labelStyle={{ color: "var(--color-foreground)" }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="velocidad_predicha"
                stroke="var(--color-chart-2)"
                strokeWidth={2}
                dot={false}
                name="Velocidad Predicha (km/h)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="congestion_predicha"
                stroke="var(--color-chart-1)"
                strokeWidth={2}
                dot={false}
                name="Congestión Predicha (1-5)"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
