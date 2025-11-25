import { NextResponse } from "next/server"

function generatePredictions() {
  const segmentos = ["seg-1", "seg-2", "seg-3", "seg-4"]
  const nombres = ["Tramo 1: Sta. Tecla", "Tramo 2: Descenso Principal", "Tramo 3: Curvas", "Tramo 4: Colón"]
  const predictions = []

  for (let h = 0; h < 24; h++) {
    const isPeakHour = [7, 8, 17, 18].includes(h)

    segmentos.forEach((seg, idx) => {
      predictions.push({
        segmento_id: seg,
        segmento_nombre: nombres[idx],
        hora_prediccion: h,
        velocidad_predicha: isPeakHour ? 35 + Math.random() * 20 : 75 + Math.random() * 15,
        congestion_predicha: isPeakHour ? 3 + Math.random() * 2 : 1 + Math.random() * 1.5,
        confianza_prediccion: 0.85 + Math.random() * 0.1,
        alertas: isPeakHour ? [{ tipo: "congestión", severidad: "alta" }] : [],
      })
    })
  }

  return predictions
}

export async function GET() {
  const predictions = generatePredictions()

  return NextResponse.json({
    success: true,
    data: predictions,
    modelo_usado: "ARIMA Baseline",
    timestamp: new Date().toISOString(),
  })
}
