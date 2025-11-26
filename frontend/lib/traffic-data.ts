// ---------------------------
// Tipos de datos
// ---------------------------
export interface TrafficPoint {
  id: string
  name: string
  lat: number
  lng: number
  status: "fluido" | "moderado" | "congestionado" | "colapsado"
  congestion: number
  avgSpeed: number
  vehiclesPerHour: number
}

export interface TrafficMetrics {
  timestamp: Date
  totalVehicles: number
  avgSpeed: number
  estimatedTime: number
  status: string
}

export interface SegmentoAPI {
  id: number
  nombre: string
  coordenadas: { lat: number; lng: number }
  longitud_km: number
}

// ---------------------------
// Status helpers
// ---------------------------
export function getTrafficStatus(congestion: number): "fluido" | "moderado" | "congestionado" | "colapsado" {
  if (congestion < 30) return "fluido"
  if (congestion < 50) return "moderado"
  if (congestion < 75) return "congestionado"
  return "colapsado"
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "fluido":
      return "#10b981"
    case "moderado":
      return "#f59e0b"
    case "congestionado":
      return "#ff7242"
    case "colapsado":
      return "#ef4444"
    default:
      return "#6b7280"
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case "fluido":
      return "Fluido"
    case "moderado":
      return "Moderado"
    case "congestionado":
      return "Congestionado"
    case "colapsado":
      return "Colapsado"
    default:
      return "Desconocido"
  }
}

// ---------------------------
// Obtener puntos REALES desde Django
// ---------------------------
export async function getTrafficPoints(): Promise<TrafficPoint[]> {
  const response = await fetch("http://127.0.0.1:8000/segmentos/", {
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error("Error obteniendo segmentos del backend")
  }

  const data = await response.json()
  let segmentos: any[] = []

  // 1) Si el backend devuelve un array plano: [ { id, nombre, coordenadas, ... }, ... ]
  if (Array.isArray(data)) {
    segmentos = data
  }
  // 2) Si el backend usa paginación de DRF: { count, results: [...] }
  else if (data && Array.isArray(data.results)) {
    segmentos = data.results
  }
  // 3) Si el backend devuelve GeoJSON: { type: "FeatureCollection", features: [...] }
  else if (data && Array.isArray(data.features)) {
    segmentos = data.features.map((f: any) => {
      const coords = f.geometry?.coordinates

      // Si es LineString: [[lng, lat], [lng, lat], ...]
      let lat = 0
      let lng = 0

      if (Array.isArray(coords) && Array.isArray(coords[0])) {
        lng = coords[0][0]
        lat = coords[0][1]
      } else if (Array.isArray(coords)) {
        // Por si fuera Point: [lng, lat]
        lng = coords[0]
        lat = coords[1]
      }

      return {
        id: f.id ?? f.properties?.id ?? f.properties?.segmento_id,
        nombre: f.properties?.nombre ?? f.properties?.segmento_nombre ?? "Segmento sin nombre",
        coordenadas: { lat, lng },
        longitud_km: f.properties?.longitud_km ?? 1,
      }
    })
  } else {
    console.error("Formato de respuesta inesperado de /segmentos/:", data)
    return []
  }

  // Convertimos segmentos genéricos a TrafficPoint
  return segmentos.map((seg: any) => {
    const lat = seg.coordenadas?.lat ?? seg.lat ?? 0
    const lng = seg.coordenadas?.lng ?? seg.lng ?? 0

    const congestion = Math.floor(Math.random() * 60) + 10
    const avgSpeed = Math.floor(Math.random() * 60) + 20
    const vehicles = Math.floor(Math.random() * 2000) + 500

    return {
      id: String(seg.id ?? seg.segmento_id ?? crypto.randomUUID()),
      name: seg.nombre ?? seg.segmento_nombre ?? "Segmento sin nombre",
      lat,
      lng,
      congestion,
      avgSpeed,
      vehiclesPerHour: vehicles,
      status: getTrafficStatus(congestion),
    } as TrafficPoint
  })
}

// ---------------------------
// Calcular métricas con puntos reales
// ---------------------------
export function getCurrentMetrics(points: TrafficPoint[]): TrafficMetrics {
  if (!points || points.length === 0) {
    return {
      timestamp: new Date(),
      totalVehicles: 0,
      avgSpeed: 0,
      estimatedTime: 0,
      status: "Desconocido",
    }
  }

  const avgCongestion = points.reduce((acc, p) => acc + p.congestion, 0) / points.length
  const avgSpeed = points.reduce((acc, p) => acc + p.avgSpeed, 0) / points.length
  const totalVehicles = points.reduce((acc, p) => acc + p.vehiclesPerHour, 0)

  // Para cálculo simple: 12 km / velocidad promedio
  const estimatedTime = Math.round((12 / avgSpeed) * 60)

  return {
    timestamp: new Date(),
    totalVehicles,
    avgSpeed: Math.round(avgSpeed),
    estimatedTime,
    status: getStatusLabel(getTrafficStatus(avgCongestion)),
  }
}

// ---------------------------
// Datos simulados extra (pueden quedarse si aún usas gráficas)
// ---------------------------
export interface HourlyData {
  hour: number
  vehicles: number
  avgSpeed: number
  congestion: number
}

export function generateHourlyData(): HourlyData[] {
  const hours = []
  const peak = [7, 8, 17, 18]

  for (let i = 0; i < 24; i++) {
    const onPeak = peak.includes(i)
    hours.push({
      hour: i,
      vehicles: onPeak ? 2500 + Math.random() * 1000 : 800 + Math.random() * 600,
      avgSpeed: onPeak ? 35 + Math.random() * 20 : 75 + Math.random() * 15,
      congestion: onPeak ? 65 + Math.random() * 25 : 25 + Math.random() * 30,
    })
  }
  return hours
}

export interface DailyComparison {
  day: string
  trafficVolume: number
  avgCongestion: number
}

export function generateDailyComparison(): DailyComparison[] {
  const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
  return days.map((day) => ({
    day,
    trafficVolume: 18000 + Math.random() * 8000,
    avgCongestion: 45 + Math.random() * 25,
  }))
}
