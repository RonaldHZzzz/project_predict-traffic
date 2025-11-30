import { getAccessToken } from "@/lib/auth";

const API_BASE_URL = "http://127.0.0.1:8000";

// --- Tipos de datos ---
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
  geometry: Array<[number, number]>;
}

// --- Helpers de Estado ---
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
    case "fluido": return "#10b981";
    case "moderado": return "#f59e0b";
    case "congestionado": return "#5cc53cff";
    case "colapsado": return "#ef4444";
    default: return "#6b7280";
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case "fluido": return "Fluido";
    case "moderado": return "Moderado";
    case "congestionado": return "Congestionado";
    case "colapsado": return "Colapsado";
    default: return "Desconocido";
  }
}

// ---------------------------
// Obtener segmentos REALES desde Django
// ---------------------------
export async function getSegmentos(): Promise<Segmento[]> {
  const token = getAccessToken();

  // CORRECCIÓN: La URL es /segmentos/, NO /api/segmentos/
  const response = await fetch(`${API_BASE_URL}/segmentos/`, {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (!response.ok) {
    console.error(`Error ${response.status}: ${response.statusText} en /segmentos/`);
    // Si falla, intentamos retornar vacío para no romper todo
    return [];
  }

  const data = await response.json();
  let segmentos: any[] = [];

  if (Array.isArray(data)) {
    segmentos = data;
  } else if (data && Array.isArray(data.results)) {
    segmentos = data.results;
  }

  return segmentos.map((seg: any) => ({
    segmento_id: seg.segmento_id,
    nombre: seg.nombre ?? "Segmento sin nombre",
    geometry: seg.geometry ?? [],
  })) as Segmento[];
}

// ---------------------------
// Obtener puntos REALES
// ---------------------------
export async function getTrafficPoints(): Promise<TrafficPoint[]> {
  try {
    const segmentos = await getSegmentos();

    return segmentos.map((seg: Segmento) => {
      let lat = 0;
      let lng = 0;

      if (seg.geometry && seg.geometry.length > 0) {
        [lng, lat] = seg.geometry[0];
      }

      // Datos simulados para demostración (ya que /mediciones/ no se está consumiendo aquí)
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
  } catch (error) {
    console.error("Error en getTrafficPoints:", error);
    return [];
  }
}

// --- Métricas ---
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

  const avgCongestion = points.reduce((acc, p) => acc + p.congestion, 0) / points.length;
  const avgSpeed = points.reduce((acc, p) => acc + p.avgSpeed, 0) / points.length;
  const totalVehicles = points.reduce((acc, p) => acc + p.vehiclesPerHour, 0);
  const estimatedTime = Math.round((12 / avgSpeed) * 60);

  return {
    timestamp: new Date(),
    totalVehicles,
    avgSpeed: Math.round(avgSpeed),
    estimatedTime,
    status: getStatusLabel(getTrafficStatus(avgCongestion)),
  };
}