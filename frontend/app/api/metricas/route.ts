import { NextResponse } from "next/server"

export async function GET() {
  const metrics = {
    sistema: {
      estado_general: "operacional",
      uptime_percentage: 99.8,
      ultima_actualizacion: new Date().toISOString(),
    },
    trafico_actual: {
      velocidad_promedio_red: 58,
      congestion_promedio: 2.1,
      total_vehiculos: 7500,
      capacidad_total: 12000,
      ocupacion_porcentaje: 62.5,
    },
    predicciones: {
      modelo_actualizado: "2024-11-13",
      proximas_horas_criticas: [7, 8, 17, 18],
      confianza_promedio: 0.88,
    },
    alertas: {
      activas: 2,
      resueltas_hoy: 5,
      criticas: 1,
    },
  }

  return NextResponse.json({
    success: true,
    data: metrics,
    timestamp: new Date().toISOString(),
  })
}
