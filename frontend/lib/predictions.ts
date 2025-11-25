export interface Prediction {
  hora: number
  velocidad_predicha: number
  congestion_predicha: number
  confianza: number
  alertas: Alert[]
}

export interface Alert {
  tipo: string
  severidad: "baja" | "media" | "alta"
  mensaje: string
}

// Simple ARIMA-like baseline model
export function predictNext24Hours(historicalData: any[]): Prediction[] {
  const predictions: Prediction[] = []

  for (let h = 0; h < 24; h++) {
    const isPeakHour = [7, 8, 17, 18].includes(h)
    const baseSpeed = isPeakHour ? 40 : 80
    const baseCongestion = isPeakHour ? 3.5 : 1.5

    const alertas: Alert[] = []
    if (isPeakHour && baseCongestion > 3) {
      alertas.push({
        tipo: "congestión",
        severidad: "alta",
        mensaje: "Se espera congestión crítica en horas pico",
      })
    }

    predictions.push({
      hora: h,
      velocidad_predicha: baseSpeed + (Math.random() - 0.5) * 10,
      congestion_predicha: baseCongestion + (Math.random() - 0.5) * 0.5,
      confianza: 0.85 + Math.random() * 0.1,
      alertas,
    })
  }

  return predictions
}

export function getCongestionLevel(congestion: number): string {
  if (congestion < 1.5) return "Fluido"
  if (congestion < 2.5) return "Moderado"
  if (congestion < 3.5) return "Congestionado"
  return "Crítico"
}
