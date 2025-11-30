import useCustomApi from "@/hooks/useCustomApi";

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
  congestion: number,
): "fluido" | "moderado" | "congestionado" | "colapsado" {
  // El backend devuelve un nivel de congestión de 1 a 5.
  // Se convierte la escala de 1-5 a un porcentaje para unificar la lógica.
  const congestionPercent =
    congestion > 0 && congestion <= 5 ? congestion * 20 : congestion;

  if (congestionPercent < 30) return "fluido"; // Nivel < 1.5
  if (congestionPercent < 50) return "moderado"; // Nivel < 2.5
  if (congestionPercent < 75) return "congestionado"; // Nivel < 3.75
  return "colapsado"; // Nivel >= 3.75
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
  const response = await fetch("http://127.0.0.1:8000/api/segmentos/", {
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
//  Tipo para las paradas de bus
export interface BusStop {
  id: number;
  segmento: number;
  osm_id: string;
  nombre: string | null;
  lat: number;
  lon: number;
}

export async function getBusStopsBySegment(
  segmentoId: number
): Promise<BusStop[]> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

  const res = await fetch(
    `${baseUrl}/trafico/segmentos/${segmentoId}/paradas/`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    throw new Error("Error cargando paradas del segmento");
  }

  return res.json();
}

// ---------------------------
// Obtener PREDICCIONES desde Django
// ---------------------------

export interface PredictionResult {
  segmento_id: number;
  fecha: string;
  hora: string;
  nivel_congestion: number;
  velocidad_kmh: number;
  longitud_km: number;
  tiempo_estimado_min: number;
  carga_vehicular: number;
  construccion_vial: number;
  paradas_cercanas: number;
}



// ... (existing code) ...

// Función para obtener las predicciones de todos los segmentos para una fecha dada
export async function getPredictionsForDate(
  date: Date
): Promise<PredictionResult[]> {
  const segments = await getSegmentos();
  if (!segments || segments.length === 0) {
    return [];
  }

  const api = useCustomApi();
  const dateString = date.toISOString().split("T")[0]; // Formato YYYY-MM-DD

  const predictionPromises = segments.map((segment) => {
    return api
      .post("/api/predict-traffic/", {
        segmento_id: segment.segmento_id,
        fecha: dateString,
      })
      .then((res) => {
        if (Array.isArray(res.data)) {
          return res.data.map((d: any) => ({
            ...d,
            segmento_id: segment.segmento_id,
          }));
        }
        return [];
      })
      .catch((err) => {
        console.error(
          `Error fetching prediction for segment ${segment.segmento_id}`,
          err.message
        );
        return [];
      });
  });

  try {
    const resultsBySegment = await Promise.all(predictionPromises);
    return resultsBySegment.flat();
  } catch (error) {
    console.error("One or more prediction fetches failed", error);
    return [];
  }
}



