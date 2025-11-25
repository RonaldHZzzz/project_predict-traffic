"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, MapPin, Filter } from "lucide-react"

export function ControlPanel() {
  const [showAlternateRoutes, setShowAlternateRoutes] = useState(false)

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Panel de Control</CardTitle>
        <CardDescription>Controles y filtros de monitoreo</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="text-sm font-semibold mb-3">Filtros</h4>
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start bg-transparent">
              <Filter className="w-4 h-4 mr-2" />
              Por cantidad de vehículo
            </Button>
            <Button variant="outline" className="w-full justify-start bg-transparent">
              <MapPin className="w-4 h-4 mr-2" />
              Seleccionar fecha/hora
            </Button>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-3">Rutas Alternas</h4>
          <Button
            variant={showAlternateRoutes ? "default" : "outline"}
            className="w-full"
            onClick={() => setShowAlternateRoutes(!showAlternateRoutes)}
          >
            {showAlternateRoutes ? "Ocultar" : "Mostrar"} rutas alternas
          </Button>
        </div>

        <div>
          <Button className="w-full gap-2" onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4" />
            Actualizar datos
          </Button>
        </div>

        <div className="pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Última actualización: {new Date().toLocaleTimeString("es-ES")}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
