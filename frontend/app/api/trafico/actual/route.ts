import { NextResponse } from "next/server"

function generateTrafficData() {
  const segmentos = ["seg-1", "seg-2", "seg-3", "seg-4"]
  const nombres = ["Tramo 1: Sta. Tecla", "Tramo 2: Descenso Principal", "Tramo 3: Curvas", "Tramo 4: Colón"]

  return segmentos.map((seg, idx) => {
    const hour = new Date().getHours()
    const isPeakHour = [7, 8, 17, 18].includes(hour)

    return {
      segmento_id: seg,
      segmento_nombre: nombres[idx],
      timestamp: new Date().toISOString(),
      velocidad_promedio: isPeakHour ? 35 + Math.random() * 20 : 75 + Math.random() * 15,
      nivel_congestion: isPeakHour ? 3 + Math.random() * 2 : 1 + Math.random() * 1.5,
      cantidad_vehiculos: isPeakHour ? 2000 + Math.random() * 1000 : 800 + Math.random() * 600,
      capacidad_segmento: 3000,
    }
  })
}

export async function GET() {
  const datos = generateTrafficData()

  return NextResponse.json({
    success: true,
    data: datos,
    timestamp: new Date().toISOString(),
  })
}
