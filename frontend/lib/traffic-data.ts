// ---------------------------
// Tipos de datos
// ---------------------------
export interface TrafficPoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: "fluido" | "moderado" | "congestionado" | "colapsado";
  congestion: number;
  avgSpeed: number;
  vehiclesPerHour: number;
}

export interface TrafficMetrics {
  timestamp: Date;
  totalVehicles: number;
  avgSpeed: number;
  estimatedTime: number;
  status: string;
}

export interface Segmento {
  segmento_id: number;
  nombre: string;
  geometry: Array<[number, number]>; // Array of [lng, lat] pairs
}

// ---------------------------
// Status helpers
// ---------------------------
export function getTrafficStatus(
  congestion: number
): "fluido" | "moderado" | "congestionado" | "colapsado" {
  if (congestion < 30) return "fluido";
  if (congestion < 50) return "moderado";
  if (congestion < 75) return "congestionado";
  return "colapsado";
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "fluido":
      return "#10b981";
    case "moderado":
      return "#f59e0b";
    case "congestionado":
      return "#ff7242";
    case "colapsado":
      return "#ef4444";
    default:
      return "#6b7280";
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case "fluido":
      return "Fluido";
    case "moderado":
      return "Moderado";
    case "congestionado":
      return "Congestionado";
    case "colapsado":
      return "Colapsado";
    default:
      return "Desconocido";
  }
}

// ---------------------------
// Obtener segmentos REALES desde Django
// ---------------------------
export async function getSegmentos(): Promise<Segmento[]> {
  const response = await fetch("http://127.0.0.1:8000/segmentos/", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Error obteniendo segmentos del backend");
  }

  const data = await response.json();
  let segmentos: any[] = [];

  // 1) Si el backend devuelve un array plano con geometry como array de pares
  if (Array.isArray(data)) {
    segmentos = data;
  }
  // 2) Si el backend usa paginación de DRF: { count, results: [...] }
  else if (data && Array.isArray(data.results)) {
    segmentos = data.results;
  } else {
    console.error("Formato de respuesta inesperado de /segmentos/:", data);
    return [];
  }

  return segmentos.map((seg: any) => ({
    segmento_id: seg.segmento_id,
    nombre: seg.nombre ?? "Segmento sin nombre",
    geometry: seg.geometry ?? [], // Array de [lng, lat]
  })) as Segmento[];
}

// ---------------------------
// Obtener puntos REALES desde Django (para compatibilidad)
// ---------------------------
export async function getTrafficPoints(): Promise<TrafficPoint[]> {
  const segmentos = await getSegmentos();

  // Convertimos cada segmento a un TrafficPoint usando el primer punto de su geometría
  return segmentos.map((seg: Segmento) => {
    let lat = 0;
    let lng = 0;

    // Extraer primer punto de la geometría [lng, lat]
    if (seg.geometry && seg.geometry.length > 0) {
      [lng, lat] = seg.geometry[0];
    }

    const congestion = Math.floor(Math.random() * 60) + 10;
    const avgSpeed = Math.floor(Math.random() * 60) + 20;
    const vehicles = Math.floor(Math.random() * 2000) + 500;

    return {
      id: String(seg.segmento_id),
      name: seg.nombre,
      lat,
      lng,
      congestion,
      avgSpeed,
      vehiclesPerHour: vehicles,
      status: getTrafficStatus(congestion),
    } as TrafficPoint;
  });
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
    };
  }

  const avgCongestion =
    points.reduce((acc, p) => acc + p.congestion, 0) / points.length;
  const avgSpeed =
    points.reduce((acc, p) => acc + p.avgSpeed, 0) / points.length;
  const totalVehicles = points.reduce((acc, p) => acc + p.vehiclesPerHour, 0);

  // Para cálculo simple: 12 km / velocidad promedio
  const estimatedTime = Math.round((12 / avgSpeed) * 60);

  return {
    timestamp: new Date(),
    totalVehicles,
    avgSpeed: Math.round(avgSpeed),
    estimatedTime,
    status: getStatusLabel(getTrafficStatus(avgCongestion)),
  };
}

// ---------------------------
// Datos simulados extra (pueden quedarse si aún usas gráficas)
// ---------------------------
export interface HourlyData {
  hour: number;
  vehicles: number;
  avgSpeed: number;
  congestion: number;
}

export function generateHourlyData(): HourlyData[] {
  const hours = [];
  const peak = [7, 8, 17, 18];

  for (let i = 0; i < 24; i++) {
    const onPeak = peak.includes(i);
    hours.push({
      hour: i,
      vehicles: onPeak
        ? 2500 + Math.random() * 1000
        : 800 + Math.random() * 600,
      avgSpeed: onPeak ? 35 + Math.random() * 20 : 75 + Math.random() * 15,
      congestion: onPeak ? 65 + Math.random() * 25 : 25 + Math.random() * 30,
    });
  }
  return hours;
}

export interface DailyComparison {
  day: string;
  trafficVolume: number;
  avgCongestion: number;
}

export function generateDailyComparison(): DailyComparison[] {
  const days = [
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
    "Domingo",
  ];
  return days.map((day) => ({
    day,
    trafficVolume: 18000 + Math.random() * 8000,
    avgCongestion: 45 + Math.random() * 25,
  }));
}
