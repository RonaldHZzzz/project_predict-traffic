import { NextResponse } from "next/server"

const SEGMENTOS = [
  {
    id: "seg-1",
    nombre: "Tramo 1: Sta. Tecla",
    coordenadas: { lat: 13.737, lng: -89.212 },
    geometria: [
      [13.737, -89.212],
      [13.7375, -89.211],
    ],
    descripcion: "Entrada desde Santa Tecla",
    longitud_km: 0.5,
  },
  {
    id: "seg-2",
    nombre: "Tramo 2: Descenso Principal",
    coordenadas: { lat: 13.738, lng: -89.21 },
    geometria: [
      [13.7375, -89.211],
      [13.739, -89.208],
    ],
    descripcion: "Descenso principal de la carretera",
    longitud_km: 0.8,
  },
  {
    id: "seg-3",
    nombre: "Tramo 3: Curvas",
    coordenadas: { lat: 13.7395, lng: -89.207 },
    geometria: [
      [13.739, -89.208],
      [13.74, -89.206],
    ],
    descripcion: "Sección de curvas pronunciadas",
    longitud_km: 0.6,
  },
  {
    id: "seg-4",
    nombre: "Tramo 4: Colón",
    coordenadas: { lat: 13.74, lng: -89.206 },
    geometria: [
      [13.74, -89.206],
      [13.7405, -89.205],
    ],
    descripcion: "Tramo hacia Colón",
    longitud_km: 0.4,
  },
]

export async function GET() {
  return NextResponse.json({
    success: true,
    data: SEGMENTOS,
    timestamp: new Date().toISOString(),
  })
}
