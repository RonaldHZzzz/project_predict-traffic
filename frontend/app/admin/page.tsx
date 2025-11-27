"use client"

import { useEffect, useState } from "react"
import { Cloud, CloudRain, Sun, Wind, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function AdminPage() {


  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Consumir tu API de Django
    fetch('http://localhost:8000/api/factores/clima-actual/')
      .then(res => res.json())
      .then(data => {
        setData(data)
        setLoading(false)
      })
      .catch(err => console.error("Error clima:", err))
  }, [])

  if (loading) return <Skeleton className="h-[180px] w-full rounded-lg" />

  const alertas = data?.alertas_trafico || []
  const clima = data?.clima_actual

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Condiciones Externas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Icono dinámico simple */}
            {clima?.desc.includes("lluvia") ? (
              <CloudRain className="h-8 w-8 text-blue-500" />
            ) : clima?.desc.includes("nub") ? (
              <Cloud className="h-8 w-8 text-gray-500" />
            ) : (
              <Sun className="h-8 w-8 text-yellow-500" />
            )}
            <div>
              <div className="text-2xl font-bold">{Math.round(clima?.temp)}°C</div>
              <p className="text-xs text-muted-foreground capitalize">
                {clima?.desc}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {alertas.length > 0 ? (
            alertas.map((alerta: any, i: number) => (
              <div key={i} className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 p-2 rounded text-xs text-red-600 dark:text-red-400">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold">{alerta.nombre}:</span> {alerta.descripcion}
                </div>
              </div>
            ))
          ) : (
            <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-2 rounded">
                <Sun className="h-3 w-3" />
                <span>Sin alertas meteorológicas activas.</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}