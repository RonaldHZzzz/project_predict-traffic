import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Simulate model training
    const resultado = {
      modelo_id: `modelo-${Date.now()}`,
      tipo: "ARIMA",
      estado: "entrenado",
      metricas: {
        mape: 0.12,
        rmse: 2.5,
        r_squared: 0.92,
      },
      fecha_entrenamiento: new Date().toISOString(),
      segmentos_incluidos: 4,
      datos_utilizados: body.datos_dias || 8,
    }

    return NextResponse.json({
      success: true,
      data: resultado,
      mensaje: "Modelo entrenado correctamente",
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Error al entrenar modelo" }, { status: 400 })
  }
}
