import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ChartDataPoint {
  hour: string;
  [key: string]: any;
}

interface Segment {
  segmento_id: number;
  nombre: string;
}

interface AnalyticsChartsProps {
  data: ChartDataPoint[];
  selectedSegment: string; // 'all' or segment_id as string
  availableSegments: Segment[];
}

/* ──────────────────────────────────────────────── */
/*  ABREVIADOR INTELIGENTE PARA NOMBRES DE SEGMENTOS */
/* ──────────────────────────────────────────────── */
const shortenSegmentName = (name: string): string => {
  // Caso "Tramo X" → T1, T2, T3...
  const tramoMatch = name.match(/Tramo (\d+)/i);
  if (tramoMatch) return `T${tramoMatch[1]}`;

  // Caso nombres largos con guiones → usar primera parte
  if (name.includes(" - ")) return name.split(" - ")[0];

  // Si es muy largo → recortar y agregar puntos suspensivos
  if (name.length > 12) return name.slice(0, 10) + "…";

  return name;
};

/* ──────────────────────────────────────────────── */
/*   COLORES CONSISTENTES POR SEGMENTO              */
/* ──────────────────────────────────────────────── */
const getSegmentColor = (segmentName: string): string => {
  const colors = [
    "#3b82f6", "#22c55e", "#f97316", "#a855f7", "#ef4444",
    "#eab308", "#14b8a6", "#6366f1", "#f472b6", "#84d6aa"
  ];
  const index = segmentName.split(" ").pop()
    ? (parseInt(segmentName.split(" ").pop() as string) - 1) % colors.length
    : 0;
  return colors[index];
};

/* ──────────────────────────────────────────────── */
/* WRAPPER DE CHART                                  */
/* ──────────────────────────────────────────────── */
const ChartWrapper: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div className="bg-white/10 p-4 rounded-lg shadow-md border border-white/20 h-80">
    <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
    {children}
  </div>
);

/* ──────────────────────────────────────────────── */
/*  COMPONENTE PRINCIPAL DE GRÁFICAS                */
/* ──────────────────────────────────────────────── */

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  data,
  selectedSegment,
  availableSegments,
}) => {

  /* ───── Crear líneas dinámicas según segment y métrica ───── */
  const getLines = (metricSuffix: string) => {
    const segmentsToRender =
      selectedSegment === "all"
        ? availableSegments
        : availableSegments.filter((s) => s.segmento_id.toString() === selectedSegment);

    return segmentsToRender.map((s) => {
      const shortLabel = shortenSegmentName(s.nombre);

      return (
        <Line
          key={`${s.nombre}${metricSuffix}`}
          type="monotone"
          dataKey={`${s.nombre}${metricSuffix}`}
          stroke={getSegmentColor(s.nombre)}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 6 }}
          name={shortLabel}
        />
      );
    });
  };

  /* ──────────────────────────────────────────────── */
  /*  RENDER DE TODAS LAS GRÁFICAS                   */
  /* ──────────────────────────────────────────────── */
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* ─── Volumen Vehicular ─── */}
      <ChartWrapper title="Volumen de Vehículos por Hora">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff30" />
            <XAxis dataKey="hour" stroke="#ffffff" />
            <YAxis stroke="#ffffff" />
            <Tooltip
              contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155" }}
              labelStyle={{ color: "#ffffff" }}
              itemStyle={{ color: "#ffffff" }}
            />
            {selectedSegment === "all" && <Legend />}
            {getLines("_volume")}
          </LineChart>
        </ResponsiveContainer>
      </ChartWrapper>

      {/* ─── Nivel de Congestión ─── */}
      <ChartWrapper title="Nivel de Congestión por Hora">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff30" />
            <XAxis dataKey="hour" stroke="#ffffff" />
            <YAxis
              stroke="#ffffff"
              domain={[0, 100]}
              label={{ value: "% Congestión", angle: -90, position: "insideLeft", fill: "#ffffff" }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155" }}
              itemStyle={{ color: "#ffffff" }}
              formatter={(value: number) => `${value}%`}
            />
            {selectedSegment === "all" && <Legend />}
            {getLines("_congestion")}
          </LineChart>
        </ResponsiveContainer>
      </ChartWrapper>

      {/* ─── Tiempo de Recorrido ─── */}
      <ChartWrapper title="Tiempo de Recorrido por Segmento (min)">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff30" />
            <XAxis dataKey="hour" stroke="#ffffff" />
            <YAxis
              stroke="#ffffff"
              label={{ value: "Minutos", angle: -90, position: "insideLeft", fill: "#ffffff" }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155" }}
              itemStyle={{ color: "#ffffff" }}
              formatter={(value: number) => `${value} min`}
            />
            {selectedSegment === "all" && <Legend />}
            {getLines("_travel_time")}
          </LineChart>
        </ResponsiveContainer>
      </ChartWrapper>

      {/* ─── Velocidad Promedio ─── */}
      <ChartWrapper title="Velocidad Promedio por Segmento (km/h)">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff30" />
            <XAxis dataKey="hour" stroke="#ffffff" />
            <YAxis
              stroke="#ffffff"
              label={{ value: "km/h", angle: -90, position: "insideLeft", fill: "#ffffff" }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155" }}
              itemStyle={{ color: "#ffffff" }}
              formatter={(value: number) => `${value} km/h`}
            />
            {selectedSegment === "all" && <Legend />}
            {getLines("_avg_speed")}
          </LineChart>
        </ResponsiveContainer>
      </ChartWrapper>

    </div>
  );
};
