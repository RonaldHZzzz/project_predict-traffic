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

export interface HourlyData {
  hour: number
  vehicles: number
  avgSpeed: number
  congestion: number
}

export interface DailyComparison {
  day: string
  trafficVolume: number
  avgCongestion: number
}

export interface Segmento {
  id: string
  nombre: string
  coordenadas: { lat: number; lng: number }
  geometria: [number, number][]
  longitud_km: number
}

const TRAFFIC_POINTS: TrafficPoint[] = [
  {
    id: "point-1",
    name: "Entrada Los Chorros",
    lat: 13.738,
    lng: -89.21,
    status: "moderado",
    congestion: 45,
    avgSpeed: 65,
    vehiclesPerHour: 1200,
  },
  {
    id: "point-2",
    name: "Centro Los Chorros",
    lat: 13.739,
    lng: -89.208,
    status: "congestionado",
    congestion: 72,
    avgSpeed: 35,
    vehiclesPerHour: 2100,
  },
  {
    id: "point-3",
    name: "Salida Norte",
    lat: 13.74,
    lng: -89.206,
    status: "fluido",
    congestion: 20,
    avgSpeed: 85,
    vehiclesPerHour: 800,
  },
  {
    id: "point-4",
    name: "Carril Alterno",
    lat: 13.737,
    lng: -89.212,
    status: "moderado",
    congestion: 38,
    avgSpeed: 72,
    vehiclesPerHour: 950,
  },
]

const SEGMENTOS: Segmento[] = [
  {
    id: "seg-1",
    nombre: "Tramo 1: Sta. Tecla",
    coordenadas: { lat: 13.737, lng: -89.212 },
    geometria: [
      [13.737, -89.212],
      [13.7375, -89.211],
    ],
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
    longitud_km: 0.4,
  },
]

export function getTrafficPoints(): TrafficPoint[] {
  return TRAFFIC_POINTS.map((point) => ({
    ...point,
    congestion: Math.max(0, Math.min(100, point.congestion + (Math.random() - 0.5) * 20)),
    avgSpeed: Math.max(10, Math.min(100, point.avgSpeed + (Math.random() - 0.5) * 15)),
    vehiclesPerHour: Math.max(500, point.vehiclesPerHour + Math.floor((Math.random() - 0.5) * 400)),
  }))
}

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

export function generateHourlyData(): HourlyData[] {
  const hours = []
  const peakHours = [7, 8, 17, 18] // 7-8am and 5-6pm peak hours

  for (let i = 0; i < 24; i++) {
    const isPeakHour = peakHours.includes(i)
    hours.push({
      hour: i,
      vehicles: isPeakHour ? 2500 + Math.random() * 1000 : 800 + Math.random() * 600,
      avgSpeed: isPeakHour ? 35 + Math.random() * 20 : 75 + Math.random() * 15,
      congestion: isPeakHour ? 65 + Math.random() * 25 : 25 + Math.random() * 30,
    })
  }
  return hours
}

export function generateDailyComparison(): DailyComparison[] {
  const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
  return days.map((day) => ({
    day,
    trafficVolume: 18000 + Math.random() * 8000,
    avgCongestion: 45 + Math.random() * 25,
  }))
}

export function getCurrentMetrics(): TrafficMetrics {
  const points = getTrafficPoints()
  const avgCongestion = points.reduce((acc, p) => acc + p.congestion, 0) / points.length
  const avgSpeed = points.reduce((acc, p) => acc + p.avgSpeed, 0) / points.length
  const totalVehicles = points.reduce((acc, p) => acc + p.vehiclesPerHour, 0)

  // Estimate time: 12km / average speed
  const estimatedTime = Math.round((12 / avgSpeed) * 60)

  return {
    timestamp: new Date(),
    totalVehicles,
    avgSpeed: Math.round(avgSpeed),
    estimatedTime,
    status: getStatusLabel(getTrafficStatus(avgCongestion)),
  }
}
