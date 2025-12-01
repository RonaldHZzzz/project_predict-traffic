"use client"

import { useState } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input" // Assuming Input component is available
import { useDailyTrafficMetrics } from "../hooks/useDailyTrafficMetrics" // Adjust path as necessary
import { Skeleton } from "@/components/ui/skeleton"

export function AnalyticsCharts() {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]); // Default to today
  const [selectedSegment, setSelectedSegment] = useState<number | undefined>(undefined); // No segment selected by default

  const { data, loading, error } = useDailyTrafficMetrics(selectedDate, selectedSegment);

  return (
    <div className="space-y-6">
      {/* Date and Segment Selection */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Seleccionar Fecha</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full"
            />
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Filtrar por Segmento (Opcional)</CardTitle>
            <CardDescription>Ingrese un ID de segmento para ver métricas específicas.</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              type="number"
              placeholder="Ej: 10"
              value={selectedSegment || ''}
              onChange={(e) => setSelectedSegment(e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full"
            />
          </CardContent>
        </Card>
      </div>

      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-[350px] w-full" />
            <Skeleton className="h-[350px] w-full" />
        </div>
      )}

      {error && (
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-500">Error al cargar las métricas: {error.message}</p>
            <p className="text-muted-foreground">Asegúrate de que el servidor backend esté en funcionamiento.</p>
          </CardContent>
        </Card>
      )}

      {data && !loading && !error && (
        <>
          {/* Charts Display */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {selectedSegment ? (
              // Velocidad Promedio por Segmento
              <Card>
                <CardHeader>
                  <CardTitle>Velocidad Promedio (Segmento {selectedSegment})</CardTitle>
                  <CardDescription>Velocidad promedio por hora para el segmento seleccionado.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data.hourly_metrics}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis
                        dataKey="hora"
                        label={{ value: "Hora", position: "insideBottomRight", offset: -5 }}
                        tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                      />
                      <YAxis
                        label={{ value: "Velocidad (km/h)", angle: -90, position: "insideLeft" }}
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
                        type="monotone"
                        dataKey="velocidad_promedio"
                        stroke="var(--color-chart-1)"
                        strokeWidth={2}
                        dot={false}
                        name="Velocidad (km/h)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            ) : (
              // Tráfico por Horas (General) - when no segment selected
              <Card>
                <CardHeader>
                  <CardTitle>Volumen de Vehículos por Horas</CardTitle>
                  <CardDescription>Volumen de vehículos promedio por hora (general).</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data.hourly_metrics}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis
                        dataKey="hora"
                        label={{ value: "Hora", position: "insideBottomRight", offset: -5 }}
                        tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                      />
                      <YAxis
                        label={{ value: "Vehículos", angle: -90, position: "insideLeft" }}
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
                        type="monotone"
                        dataKey="carga_vehicular_promedio"
                        stroke="var(--color-chart-1)"
                        strokeWidth={2}
                        dot={false}
                        name="Carga Vehicular"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Congestion Level Chart (General or Segment Specific) */}
            <Card>
              <CardHeader>
                <CardTitle>Nivel de Congestión por Horas {selectedSegment ? `(Segmento ${selectedSegment})` : '(General)'}</CardTitle>
                <CardDescription>Nivel de congestión promedio por hora.</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.hourly_metrics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis
                      dataKey="hora"
                      label={{ value: "Hora", position: "insideBottomRight", offset: -5 }}
                      tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                    />
                    <YAxis
                      label={{ value: "Nivel Congestión", angle: -90, position: "insideLeft" }}
                      domain={[0, 5]} // Congestion level typically 0-5
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
                      type="monotone"
                      dataKey="nivel_congestion_promedio"
                      stroke="var(--color-chart-2)"
                      strokeWidth={2}
                      dot={false}
                      name="Nivel de Congestión"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Peak Hour Metrics (only for overall view, not per-segment) */}
          {!selectedSegment && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Hora Pico Principal</CardTitle>
                  <CardDescription>Hora con mayor congestión promedio.</CardDescription>
                </CardHeader>
                <CardContent>
                  {data.principal_peak_hour ? (
                    <div className="text-3xl font-bold">
                      {data.principal_peak_hour.hora}
                      <p className="text-muted-foreground text-sm mt-1">
                        Nivel: {data.principal_peak_hour.nivel_congestion}
                      </p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">N/A</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Hora Pico Secundaria</CardTitle>
                  <CardDescription>Segunda hora con mayor congestión promedio.</CardDescription>
                </CardHeader>
                <CardContent>
                  {data.secondary_peak_hour ? (
                    <div className="text-3xl font-bold">
                      {data.secondary_peak_hour.hora}
                      <p className="text-muted-foreground text-sm mt-1">
                        Nivel: {data.secondary_peak_hour.nivel_congestion}
                      </p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">N/A</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Horas Más Congestionadas (Nivel 4-5)</CardTitle>
                  <CardDescription>Horas con niveles de congestión altos.</CardDescription>
                </CardHeader>
                <CardContent>
                  {data.most_congested_hours && data.most_congested_hours.length > 0 ? (
                    <div className="space-y-1">
                      {data.most_congested_hours.map((peak, index) => (
                        <p key={index} className="text-lg font-semibold">
                          {peak.hora} (Nivel: {peak.nivel_congestion})
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No hay horas con congestión nivel 4-5.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  )
}