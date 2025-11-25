"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle2, Upload } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function AdminPage() {
  const [trainingStatus, setTrainingStatus] = useState<"idle" | "training" | "success" | "error">("idle")
  const [datasetDays, setDatasetDays] = useState(8)
  const [message, setMessage] = useState("")

  const handleTrainModel = async () => {
    setTrainingStatus("training")
    setMessage("")

    try {
      const response = await fetch("/api/modelos/entrenar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          datos_dias: datasetDays,
          tipo_modelo: "ARIMA",
        }),
      })

      const data = await response.json()

      if (data.success) {
        setTrainingStatus("success")
        setMessage(
          `Modelo entrenado exitosamente. ID: ${data.data.modelo_id}. MAPE: ${(data.data.metricas.mape * 100).toFixed(2)}%`,
        )
      } else {
        setTrainingStatus("error")
        setMessage(data.error || "Error al entrenar el modelo")
      }
    } catch (error) {
      setTrainingStatus("error")
      setMessage("Error de conexión al entrenar el modelo")
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Page Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Panel de Administración</h1>
            <p className="text-muted-foreground">
              Gestión de datos, entrenamiento de modelos y configuración del sistema
            </p>
          </div>

          {/* System Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Estado del Sistema</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="font-semibold">Operacional</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Uptime: 99.8%</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Datos Históricos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8 días</div>
                <p className="text-xs text-muted-foreground mt-1">768 registros por segmento</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Segmentos Monitoreados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4</div>
                <p className="text-xs text-muted-foreground mt-1">Los Chorros: Sta. Tecla a Colón</p>
              </CardContent>
            </Card>
          </div>

          {/* Data Management */}
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Datos</CardTitle>
              <CardDescription>Importar y validar datos de tráfico históricos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="dataset-file">Cargar Dataset CSV</Label>
                <div className="mt-2 flex items-center gap-2">
                  <Input id="dataset-file" type="file" accept=".csv" className="flex-1" />
                  <Button variant="outline" size="icon">
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Formato: segmento_id, fecha_hora, velocidad_promedio, nivel_congestion
                </p>
              </div>

              <div className="border-t border-border pt-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Última validación</h4>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Registros válidos</span>
                    <Badge>3,072</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Registros con errores</span>
                    <Badge variant="outline">0</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Fecha última actualización</span>
                    <Badge variant="outline">Hoy 14:32</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Model Training */}
          <Card>
            <CardHeader>
              <CardTitle>Entrenamiento de Modelos</CardTitle>
              <CardDescription>Entrenar modelo ARIMA baseline con datos históricos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="days-input">Días de datos para entrenamiento</Label>
                <div className="mt-2 flex gap-2">
                  <Input
                    id="days-input"
                    type="number"
                    min="3"
                    max="30"
                    value={datasetDays}
                    onChange={(e) => setDatasetDays(Number.parseInt(e.target.value) || 8)}
                    className="flex-1"
                  />
                  <Button onClick={handleTrainModel} disabled={trainingStatus === "training"} className="px-6">
                    {trainingStatus === "training" ? "Entrenando..." : "Entrenar"}
                  </Button>
                </div>
              </div>

              {message && (
                <Alert
                  className={trainingStatus === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}
                >
                  {trainingStatus === "success" ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <AlertDescription className={trainingStatus === "success" ? "text-green-800" : "text-red-800"}>
                    {message}
                  </AlertDescription>
                </Alert>
              )}

              <div className="border-t border-border pt-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Modelo Actual</h4>
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tipo</span>
                      <Badge>ARIMA v0.1</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Última actualización</span>
                      <span className="font-medium">2024-11-13 10:30</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Segmentos entrenados</span>
                      <Badge variant="outline">4/4</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Endpoints API</CardTitle>
              <CardDescription>Configuración REST API del sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between font-mono bg-muted p-2 rounded">
                  <span>GET /api/segmentos</span>
                  <Badge>Listado segmentos</Badge>
                </div>
                <div className="flex items-center justify-between font-mono bg-muted p-2 rounded">
                  <span>GET /api/trafico/actual</span>
                  <Badge>Datos actuales</Badge>
                </div>
                <div className="flex items-center justify-between font-mono bg-muted p-2 rounded">
                  <span>GET /api/trafico/historico</span>
                  <Badge>Datos históricos</Badge>
                </div>
                <div className="flex items-center justify-between font-mono bg-muted p-2 rounded">
                  <span>GET /api/predicciones</span>
                  <Badge>Predicciones 24h</Badge>
                </div>
                <div className="flex items-center justify-between font-mono bg-muted p-2 rounded">
                  <span>POST /api/modelos/entrenar</span>
                  <Badge>Entrenar modelo</Badge>
                </div>
                <div className="flex items-center justify-between font-mono bg-muted p-2 rounded">
                  <span>GET /api/metricas</span>
                  <Badge>KPIs sistema</Badge>
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
