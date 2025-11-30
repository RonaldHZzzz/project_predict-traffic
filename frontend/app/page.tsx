"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Header } from "@/components/header";
import {
  getTrafficPoints,
  getCurrentMetrics,
  getSegmentos,
  getBusStopsBySegment,
  getPredictionsForDate,
  getTrafficStatus,
  getStatusLabel,
  type TrafficPoint,
  type TrafficMetrics,
  type Segmento,
  type BusStop,
  type PredictionResult,
} from "@/lib/traffic-data";
import { getMatrixData } from "@/lib/matrix";
import { useCustomApi } from "@/hooks/useCustomApi";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { MapDisplayProps } from "@/components/map-display";
import { FlowStyles } from "@/components/layout/FlowStyles";
import { VehicleTypeSelector } from "@/components/VehicleTypeSelector";
import { LeftSidebar } from "@/components/layout/LeftSidebar";
import { RightSidebar } from "@/components/layout/RightSidebar";

const MapDisplay = dynamic<MapDisplayProps>(
  () => import("@/components/map-display").then((mod) => mod.MapDisplay),
  {
    ssr: false,
    loading: () => <Skeleton className="w-full h-full bg-slate-900/50" />,
  }
);

export default function DashboardPage() {
  const [vehicleType, setVehicleType] = useState("auto");
  const [trafficPoints, setTrafficPoints] = useState<TrafficPoint[]>([]);
  const [segmentos, setSegmentos] = useState<Segmento[]>([]);
  const [metrics, setMetrics] = useState<TrafficMetrics | null>(null);
  const [avgCongestion, setAvgCongestion] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [busStops, setBusStops] = useState<BusStop[]>([]);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [selectedSegmentId, setSelectedSegmentId] = useState<number | null>(
    null
  );
  const [matrixData, setMatrixData] = useState<any | null>(null);
  const [matrixError, setMatrixError] = useState<string | null>(null);
  const [isPredictionMode, setIsPredictionMode] = useState(false);
  const [predictionDate, setPredictionDate] = useState<Date | undefined>();
  const [predictionHour, setPredictionHour] = useState(8); // Default to 8 AM
  const [predictionPoints, setPredictionPoints] = useState<TrafficPoint[]>([]);
  const [fullDayPredictions, setFullDayPredictions] = useState<
    PredictionResult[]
  >([]);
  const [isPredictingData, setIsPredictingData] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setMatrixError(null);

      const [points, segs] = await Promise.all([
        getTrafficPoints(),
        getSegmentos(),
      ]);

      setTrafficPoints(points);
      setSegmentos(segs);

      const currentMetrics = getCurrentMetrics(points);
      setMetrics(currentMetrics);

      const avgCong =
        points.reduce((acc: number, p: any) => acc + p.congestion, 0) /
        (points.length || 1);
      setAvgCongestion(avgCong);

      if (points.length >= 2) {
        const coordinates = points.map((p: any) => ({
          lat: p.lat,
          lng: p.lng,
        }));

        const matrix = await getMatrixData(coordinates.slice(0, 10));
        setMatrixData(matrix);
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
      setMatrixError(
        "No se pudo cargar la información de tráfico o la matriz de tiempos."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const clearDataInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const setDataInterval = () => {
    clearDataInterval();
    intervalRef.current = setInterval(() => {
      loadData();
    }, 30000);
  };

  useEffect(() => {
    loadData();
    setDataInterval();

    return () => clearDataInterval();
  }, []);

  useEffect(() => {
    if (isPredictionMode && predictionDate) {
      const fetchAndFilterPredictions = async () => {
        setIsPredictingData(true);
        try {
          // 1. Fetch all predictions for the selected day
          const data = await getPredictionsForDate(predictionDate);
          setFullDayPredictions(data);

          // 2. Filter predictions for the selected hour
          const hourString = String(predictionHour).padStart(2, "0") + ":00";
          const hourlyPredictions = data.filter(
            (p: PredictionResult) => p.hora === hourString
          );

          // 3. Map to TrafficPoint
          const segmentMap = new Map(segmentos.map((s) => [s.segmento_id, s]));
          const newPredictionPoints: TrafficPoint[] = hourlyPredictions.map(
            (pred) => {
              const segment = segmentMap.get(pred.segmento_id);
              const congestion = calculateAdvancedCongestion(pred);

              return {
                id: String(pred.segmento_id),
                name: segment?.nombre ?? "Segmento desconocido",
                lat: segment?.geometry?.[0]?.[1] ?? 0,
                lng: segment?.geometry?.[0]?.[0] ?? 0,
                congestion: congestion,
                avgSpeed: pred.velocidad_kmh,
                vehiclesPerHour: pred.carga_vehicular,
                status: getTrafficStatus(congestion),
              };
            }
          );
          setPredictionPoints(newPredictionPoints);

        } catch (error) {
          console.error("Failed to fetch predictions:", error);
          setFullDayPredictions([]);
          setPredictionPoints([]);
        } finally {
          setIsPredictingData(false);
        }
      };

      fetchAndFilterPredictions();
    } else {
      setFullDayPredictions([]);
      setPredictionPoints([]);
    }
  }, [isPredictionMode, predictionDate, predictionHour, segmentos]);

  const calculateAdvancedCongestion = (pred: PredictionResult): number => {
    if (!pred) return 30;
    const baseCongestion = pred.nivel_congestion * 8;
    const maxSpeed = 60;
    const speedRatio = Math.max(0, Math.min(pred.velocidad_kmh / maxSpeed, 1));
    const speedFactor = (1 - speedRatio) * 25;
    const estimatedCapacity = pred.longitud_km * 1400;
    const loadRatio = Math.min(
      pred.carga_vehicular / (estimatedCapacity || 1),
      1
    );
    const loadFactor = loadRatio * 15;
    const constructionPenalty = pred.construccion_vial > 0 ? 15 : 0;
    const stopsPenalty = Math.min(pred.paradas_cercanas * 1, 5);
    const totalCongestion =
      baseCongestion +
      speedFactor +
      loadFactor +
      constructionPenalty +
      stopsPenalty;
    return Math.max(5, Math.min(100, Math.round(totalCongestion)));
  };


  const [recommendedRoute, setRecommendedRoute] = useState<any | null>(null);
  const api = useCustomApi();

  const handleRecommendRoute = async () => {
    if (!predictionDate) {
      alert("Por favor, seleccione una fecha para la predicción.");
      return;
    }

    const dateTime = new Date(predictionDate);
    dateTime.setHours(predictionHour, 0, 0, 0);

    const formattedDateTime = `${dateTime.getFullYear()}-${String(
      dateTime.getMonth() + 1
    ).padStart(2, "0")}-${String(dateTime.getDate()).padStart(
      2,
      "0"
    )} ${String(dateTime.getHours()).padStart(2, "0")}:00:00`;

    try {
      const response = await api.post("/api/recommend-route/", {
        fecha_hora: formattedDateTime,
      });
      setRecommendedRoute(response.data);
      alert("Ruta recomendada cargada.");
    } catch (error) {
      console.error("Error al obtener la ruta recomendada:", error);
      alert("No se pudo obtener la ruta recomendada.");
    }
  };

  const handleSegmentSelect = (
    id: number | null,
    pointId: string | null = null
  ) => {
    setSelectedSegmentId(id);
    setSelectedPointId(pointId);

    if (id) {
      clearDataInterval();
      loadData();
      setBusStops([]);
      getBusStopsBySegment(id)
        .then((stops) => {
          setBusStops(stops);
        })
        .catch((err) => {
          console.error("Error cargando paradas del segmento:", err);
          setBusStops([]);
        });
    } else {
      setBusStops([]);
      loadData();
      setDataInterval();
    }
  };

  let tiempoRuta1: number | null = null;
  let tiempoRuta2: number | null = null;

  if (matrixData?.durations && matrixData.durations.length > 0) {
    const row0 = matrixData.durations[0];
    if (row0[1] != null) tiempoRuta1 = Math.round(row0[1] / 60);
    if (row0[2] != null) tiempoRuta2 = Math.round(row0[2] / 60);
  }

  const scrollbarStyles =
    "overflow-y-auto pr-2 " +
    "[&::-webkit-scrollbar]:w-1.5 " +
    "[&::-webkit-scrollbar-track]:bg-transparent " +
    "[&::-webkit-scrollbar-thumb]:bg-white/10 " +
    "[&::-webkit-scrollbar-thumb]:rounded-full " +
    "hover:[&::-webkit-scrollbar-thumb]:bg-white/30 " +
    "[scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.1)_transparent]";

  const pointsToDisplay = isPredictionMode ? predictionPoints : trafficPoints;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-950 font-sans text-foreground">
      <FlowStyles />

      <div className="absolute inset-0 z-0">
        {!isLoading && pointsToDisplay.length > 0 ? (
          <MapDisplay
            points={pointsToDisplay}
            segmentos={segmentos}
            selectedSegmentId={selectedSegmentId}
            onSelectSegment={handleSegmentSelect}
            busStops={busStops}
            recommendedRoute={recommendedRoute}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
              <span className="text-white animate-pulse">Cargando Mapa...</span>
            </div>
          </div>
        )}
      </div>

      <div className="absolute inset-0 z-0 bg-linear-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />

      <div className="relative z-10 w-full h-full flex flex-col pointer-events-none p-4 md:p-6 overflow-y-auto md:overflow-hidden">
        <div className="mb-6 pointer-events-auto">
          <div className="rounded-xl overflow-hidden shadow-lg backdrop-blur-md bg-background/40 border border-white/10">
            <Header />
          </div>
        </div>

        <VehicleTypeSelector
          vehicleType={vehicleType}
          onVehicleTypeChange={setVehicleType}
        />

        <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">
          <LeftSidebar
            isPredictionMode={isPredictionMode}
            onPredictionModeChange={setIsPredictionMode}
            predictionDate={predictionDate}
            onPredictionDateChange={setPredictionDate}
            predictionHour={predictionHour}
            onPredictionHourChange={setPredictionHour}
            onRecommendRoute={handleRecommendRoute}
            metrics={metrics}
            avgCongestion={avgCongestion}
            matrixError={matrixError}
            matrixData={matrixData}
            tiempoRuta1={tiempoRuta1}
            tiempoRuta2={tiempoRuta2}
            scrollbarStyles={scrollbarStyles}
          />

          <div className="hidden md:block md:flex-1" />

          <RightSidebar
            pointsToDisplay={pointsToDisplay}
            selectedPointId={selectedPointId}
            handleSegmentSelect={handleSegmentSelect}
            isPredictionMode={isPredictionMode}
            isPredictingData={isPredictingData}
            scrollbarStyles={scrollbarStyles}
          />
        </div>
      </div>
    </div>
  );
}
