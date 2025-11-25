import { NextResponse } from "next/server"

function generateHistoricalData(days = 8) {
  const segmentos = ["seg-1", "seg-2", "seg-3", "seg-4"]
  const nombres = ["Tramo 1: Sta. Tecla", "Tramo 2: Descenso Principal", "Tramo 3: Curvas", "Tramo 4: Colón"]
  const data = []

  for (let d = 0; d < days; d++) {
    for (let h = 0; h < 24; h++) {
      segmentos.forEach((seg, idx) => {
        const isPeakHour = [7, 8, 17, 18].includes(h)

        data.push({
          segmento_id: seg,
          segmento_nombre: nombres[idx],
          fecha_hora: new Date(
            new Date().getTime() - (days - d) * 24 * 60 * 60 * 1000 + h * 60 * 60 * 1000,
          ).toISOString(),
          velocidad_promedio: isPeakHour ? 35 + Math.random() * 20 : 75 + Math.random() * 15,
          nivel_congestion: isPeakHour ? 3 + Math.random() * 2 : 1 + Math.random() * 1.5,
          cantidad_vehiculos: isPeakHour ? 2000 + Math.random() * 1000 : 800 + Math.random() * 600,
        })
      })
    }
  }

  return data
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const dias = Number.parseInt(searchParams.get("dias") || "8")
  const segmentoId = searchParams.get("segmento_id")

  let data = generateHistoricalData(dias)

  if (segmentoId) {
    data = data.filter((d) => d.segmento_id === segmentoId)
  }

  return NextResponse.json({
    success: true,
    data,
    filters: { dias, segmento_id: segmentoId },
    timestamp: new Date().toISOString(),
  })
}
