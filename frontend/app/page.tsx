"use client";

import { Button } from "@/components/ui/button";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Header } from "@/components/header";
import { MetricsGrid } from "@/components/metrics-grid";
import { ControlPanel } from "@/components/control-panel";
import { getTrafficPoints, getCurrentMetrics, getSegmentos, getBusStopsBySegment, getPredictionsForDate, getTrafficStatus, getStatusLabel, getStatusColor as getCongestionColorStyle } from "@/lib/traffic-data";
import { getMatrixData } from "@/lib/matrix";
import type { TrafficPoint, TrafficMetrics, Segmento, BusStop, PredictionResult } from "@/lib/traffic-data";
import { CarFront, Gauge, Navigation, Car, Bike, Bus } from "lucide-react";
import { useCustomApi } from "@/hooks/useCustomApi";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Importamos los tipos del mapa
import type { MapDisplayProps } from "@/components/map-display";

const MapDisplay = dynamic<MapDisplayProps>(
  () => import("@/components/map-display").then((mod) => mod.MapDisplay),
  {
    ssr: false,
    loading: () => <Skeleton className="w-full h-full bg-slate-900/50" />,
  }
);

// Componente reutilizable para el efecto "Liquid Glass"
const GlassCard = ({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) => (
  <div
    onClick={onClick}
    className={cn(
      "bg-background/60 dark:bg-black/40 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-6 pointer-events-auto transition-all duration-300",
      className
    )}
  >
    {children}
  </div>
);

// Inyección de estilos para la animación de flujo (Flow Animation)
const FlowStyles = () => (
  <style jsx global>{`
    @keyframes flow-stripe {
      0% {
        background-position: 0 0;
      }
      100% {
        background-position: 30px 0;
      }
    }
    .animate-flow {
      background-size: 30px 30px;
      background-image: linear-gradient(
        45deg,
        rgba(255, 255, 255, 0.15) 25%,
        transparent 25%,
        transparent 50%,
        rgba(255, 255, 255, 0.15) 50%,
        rgba(255, 255, 255, 0.15) 75%,
        transparent 75%,
        transparent
      );
      animation: flow-stripe 1s linear infinite;
    }
  `}</style>
);

export default function DashboardPage() {
  const [vehicleType, setVehicleType] = useState("auto");
  const [trafficPoints, setTrafficPoints] = useState<TrafficPoint[]>([]);
  const [segmentos, setSegmentos] = useState<Segmento[]>([]);
  const [metrics, setMetrics] = useState<TrafficMetrics | null>(null);
  const [avgCongestion, setAvgCongestion] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Paradas de bus visibles (del segmento seleccionado)
  const [busStops, setBusStops] = useState<BusStop[]>([]);

  // Estado para la selección interactiva de Puntos
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);

  // Estado para la selección interactiva de Segmentos (Tramos)
  const [selectedSegmentId, setSelectedSegmentId] = useState<number | null>(
    null
  );

  const [matrixData, setMatrixData] = useState<any | null>(null);
  const [matrixError, setMatrixError] = useState<string | null>(null);

  // Estados para el modo de predicción
  const [isPredictionMode, setIsPredictionMode] = useState(false);
  const [predictionDate, setPredictionDate] = useState<Date | undefined>();
  const [predictionHour, setPredictionHour] = useState(8); // Default to 8 AM
  const [predictionPoints, setPredictionPoints] = useState<TrafficPoint[]>([]);
  const [fullDayPredictions, setFullDayPredictions] = useState<
    PredictionResult[]
  >([]);
  const [isPredictingData, setIsPredictingData] = useState(false);

  // Ref para manejar el intervalo
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Carga de datos generales (segmentos, puntos, métricas, matrix)
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

  // Función para limpiar el intervalo
  const clearDataInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Función para establecer el intervalo
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

  // --- EFECTOS PARA EL MODO DE PREDICCIÓN ---

  // 1. Cargar todas las predicciones para un día cuando la fecha cambia
  useEffect(() => {
    if (isPredictionMode && predictionDate) {
      const fetchPredictions = async () => {
        setIsPredictingData(true);
        try {
          const data = await getPredictionsForDate(predictionDate);
          setFullDayPredictions(data);
        } catch (error) {
          console.error("Failed to fetch predictions:", error);
          setFullDayPredictions([]); // Limpiar en caso de error
        } finally {
          setIsPredictingData(false);
        }
      };

      fetchPredictions();
    } else {
      setFullDayPredictions([]); // Limpiar si salimos del modo predicción
    }
  }, [isPredictionMode, predictionDate]);

  // 2. Filtrar y mapear las predicciones cuando la hora o los datos cambian
  useEffect(() => {
    if (!isPredictionMode) {
      setPredictionPoints([]);
      return;
    }

    const calculateAdvancedCongestion = (pred: PredictionResult): number => {
      // Si no hay datos de predicción, devolvemos un valor neutral
      if (!pred) return 30;

      // Factores ponderados para un total de 80 puntos base
      // 1. Nivel de congestión del modelo (1-5): Aporta hasta 40 puntos.
      const baseCongestion = pred.nivel_congestion * 8;

      // 2. Factor de velocidad (vs 60 km/h ideal): Aporta hasta 25 puntos.
      const maxSpeed = 60;
      const speedRatio = Math.max(0, Math.min(pred.velocidad_kmh / maxSpeed, 1));
      const speedFactor = (1 - speedRatio) * 25;

      // 3. Factor de carga vehicular (vs capacidad estimada): Aporta hasta 15 puntos.
      const estimatedCapacity = pred.longitud_km * 1400; // Asumiendo 2 carriles
      const loadRatio = Math.min(
        pred.carga_vehicular / (estimatedCapacity || 1),
        1
      );
      const loadFactor = loadRatio * 15;

      // Penalizaciones adicionales que se suman
      const constructionPenalty = pred.construccion_vial > 0 ? 15 : 0;
      const stopsPenalty = Math.min(pred.paradas_cercanas * 1, 5); // Max 5 puntos

      const totalCongestion =
        baseCongestion +
        speedFactor +
        loadFactor +
        constructionPenalty +
        stopsPenalty;

      // Clamp final entre 5% y 100%
      return Math.max(5, Math.min(100, Math.round(totalCongestion)));
    };

    const hourString = String(predictionHour).padStart(2, "0") + ":00";
    const hourlyPredictions = fullDayPredictions.filter(
      (p) => p.hora === hourString
    );

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
  }, [isPredictionMode, predictionHour, fullDayPredictions, segmentos]);

  const [recommendedRoute, setRecommendedRoute] = useState<any | null>(null);
  const api = useCustomApi();

  // --- FUNCIÓN PARA RECOMENDAR RUTA ---
  const handleRecommendRoute = async () => {
    if (!predictionDate) {
      alert("Por favor, seleccione una fecha para la predicción.");
      return;
    }

    const dateTime = new Date(predictionDate);
    dateTime.setHours(predictionHour, 0, 0, 0);

    // Formato YYYY-MM-DD HH:MM:SS
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

  // Manejador para la selección de segmentos (desde la tarjeta o el mapa)
  const handleSegmentSelect = (
    id: number | null,
    pointId: string | null = null
  ) => {
    setSelectedSegmentId(id);
    setSelectedPointId(pointId);

    if (id) {
      // Al seleccionar un segmento:
      clearDataInterval(); // Pausar actualización automática
      loadData(); // Recargar métricas/puntos

      // Cargar SOLO las paradas cercanas a ese segmento
      setBusStops([]); // limpiamos mientras carga
      getBusStopsBySegment(id)
        .then((stops) => {
          setBusStops(stops);
        })
        .catch((err) => {
          console.error("Error cargando paradas del segmento:", err);
          setBusStops([]);
        });
    } else {
      // Al deseleccionar segmento:
      setBusStops([]);
      loadData();
      setDataInterval();
    }
  };

  // Calculamos tiempos de ruta
  let tiempoRuta1: number | null = null;
  let tiempoRuta2: number | null = null;

  if (matrixData?.durations && matrixData.durations.length > 0) {
    const row0 = matrixData.durations[0];
    if (row0[1] != null) tiempoRuta1 = Math.round(row0[1] / 60);
    if (row0[2] != null) tiempoRuta2 = Math.round(row0[2] / 60);
  }

  
  // HELPERS DE COLOR Y ESTILO
  const getCongestionColor = (value: number) => {
    const status = getTrafficStatus(value);
    // mapea el status a la clase de color de tailwind
    switch (status) {
      case "fluido":
        return "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]";
      case "moderado":
        return "bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]";
      case "congestionado":
        return "bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]";
      case "colapsado":
        return "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]";
      default:
        return "bg-gray-500 shadow-[0_0_10px_rgba(107,114,128,0.5)]";
    }
  };

  const getCongestionTextColor = (value: number) => {
    const status = getTrafficStatus(value);
    switch (status) {
      case "fluido":
        return "text-emerald-400";
      case "moderado":
        return "text-yellow-400";
      case "congestionado":
        return "text-orange-400";
      case "colapsado":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const getGradientColor = (value: number) => {
    const status = getTrafficStatus(value);
    switch (status) {
      case "fluido":
        return "from-emerald-500 to-emerald-300";
      case "moderado":
        return "from-yellow-500 to-yellow-300";
      case "congestionado":
        return "from-orange-500 to-orange-300";
      case "colapsado":
        return "from-red-500 to-red-300";
      default:
        return "from-gray-500 to-gray-300";
    }
  };

  const getStatusBorder = (value: number) => {
    const status = getTrafficStatus(value);
    switch (status) {
      case "fluido":
        return "border-emerald-500/50 shadow-emerald-500/20";
      case "moderado":
        return "border-yellow-500/50 shadow-yellow-500/20";
      case "congestionado":
        return "border-orange-500/50 shadow-orange-500/20";
      case "colapsado":
        return "border-red-500/50 shadow-red-500/20";
      default:
        return "border-gray-500/50 shadow-gray-500/20";
    }
  };
  
  // ESTILOS DE SCROLL
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

      {/* CAPA 1: EL MAPA DE FONDO */}
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

      {/* CAPA 2: CONTENIDO FLOTANTE (HUD) */}
      <div className="relative z-10 w-full h-full flex flex-col pointer-events-none p-4 md:p-6 overflow-y-auto md:overflow-hidden">
        {/* HEADER FLOTANTE */}
        <div className="mb-6 pointer-events-auto">
          <div className="rounded-xl overflow-hidden shadow-lg backdrop-blur-md bg-background/40 border border-white/10">
            <Header />
          </div>
        </div>

        {/* Vehicle Type Buttons */}
        <div className="mb-4 pointer-events-auto flex justify-end items-center gap-2">
          <Button
            variant={vehicleType === "auto" ? "default" : "outline"}
            onClick={() => setVehicleType("auto")}
            className="rounded-full backdrop-blur-sm"
          >
            <Car className="mr-2 h-4 w-4" />
            Automóvil
          </Button>
          <Button
            variant={vehicleType === "moto" ? "default" : "outline"}
            onClick={() => setVehicleType("moto")}
            className="rounded-full backdrop-blur-sm"
          >
            <Bike className="mr-2 h-4 w-4" />
            Moto
          </Button>
          <Button
            variant={vehicleType === "bus" ? "default" : "outline"}
            onClick={() => setVehicleType("bus")}
            className="rounded-full backdrop-blur-sm"
          >
            <Bus className="mr-2 h-4 w-4" />
            Bus
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">
          {/* COLUMNA IZQUIERDA */}
          <div
            className={cn(
              "w-full md:w-1/3 lg:w-1/4 flex flex-col gap-4",
              scrollbarStyles
            )}
          >
            {/* PANEL DE CONTROL ARRIBA */}
            <GlassCard>
              <ControlPanel
                isPredictionMode={isPredictionMode}
                onPredictionModeChange={setIsPredictionMode}
                predictionDate={predictionDate}
                onPredictionDateChange={setPredictionDate}
                predictionHour={predictionHour}
                onPredictionHourChange={setPredictionHour}
                onRecommendRoute={handleRecommendRoute}
              />
            </GlassCard>

            {/* Panel de Métricas Principales */}
            {metrics && (
              <GlassCard>
                <h2 className="text-sm uppercase tracking-wider text-muted-foreground font-bold mb-4">
                  Métricas en vivo
                </h2>
                <MetricsGrid
                  metrics={metrics}
                  congestionLevel={Math.round(avgCongestion)}
                />
              </GlassCard>
            )}

            {/* Panel de Tiempos Matrix (se oculta en modo predicción) */}
            {!isPredictionMode && (
              <GlassCard>
                <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  Tiempos de Ruta (Matrix API)
                </h2>

                {matrixError ? (
                  <p className="text-xs text-red-400">{matrixError}</p>
                ) : !matrixData ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-3/4 bg-white/10" />
                    <Skeleton className="h-4 w-1/2 bg-white/10" />
                  </div>
                ) : (
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center p-2 rounded-lg bg-white/5 border border-white/5">
                      <span className="text-muted-foreground">
                        Ruta 1 (Punto 2)
                      </span>
                      <span className="font-bold text-xl text-blue-400">
                        {tiempoRuta1 ?? "--"}{" "}
                        <span className="text-xs text-muted-foreground">
                          min
                        </span>
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-white/5 border border-white/5">
                      <span className="text-muted-foreground">
                        Ruta 2 (Punto 3)
                      </span>
                      <span className="font-bold text-xl text-blue-400">
                        {tiempoRuta2 ?? "--"}{" "}
                        <span className="text-xs text-muted-foreground">
                          min
                        </span>
                      </span>
                    </div>
                  </div>
                )}
              </GlassCard>
            )}
          </div>

          {/* Espaciador central para el mapa en pantallas grandes */}
          <div className="hidden md:block md:flex-1" />

          {/* COLUMNA DERECHA: PUNTOS DE MONITOREO */}
          <div className="w-full md:w-1/3 lg:w-1/4 flex flex-col justify-end pointer-events-none gap-2">
            {/* Título de la sección flotante */}
            <div className="bg-background/40 backdrop-blur-md border border-white/10 rounded-lg p-2 px-3 flex items-center justify-between pointer-events-auto gap-3">
              <h3 className="text-sm font-bold text-foreground/90">
                {isPredictionMode
                  ? "Puntos de Predicción"
                  : "Puntos de Monitoreo"}
              </h3>
            </div>

            {isPredictingData ? (
              <div className="flex-1 flex justify-center items-center pointer-events-auto">
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/50"></div>
                  <span className="text-xs text-white/70 animate-pulse">
                    Cargando predicciones...
                  </span>
                </div>
              </div>
            ) : (
              <div
                className={cn(
                  "pointer-events-auto max-h-[40vh] md:max-h-[60vh] space-y-3 pb-2",
                  scrollbarStyles
                )}
              >
                {pointsToDisplay.map((point: any) => {
                  const isSelected = selectedPointId === point.id;
                  const borderStyle = getStatusBorder(point.congestion);
                  const gradientColor = getGradientColor(point.congestion);

                  return (
                    <GlassCard
                      key={point.id}
                      onClick={() => {
                        if (isSelected) {
                          // Si ya estaba seleccionado, lo deseleccionamos todo
                          handleSegmentSelect(null);
                        } else {
                          // Al seleccionar un punto, seleccionamos también su tramo en el mapa
                          const segId = Number(point.id); // id de TrafficPoint = segmento_id
                          handleSegmentSelect(segId, point.id);
                        }
                      }}
                      className={cn(
                        "p-4 rounded-xl cursor-pointer hover:bg-white/5 group relative overflow-hidden",
                        isSelected
                          ? cn("border-opacity-100 scale-[1.02]", borderStyle)
                          : "border-white/10 hover:border-white/20"
                      )}
                    >
                      {/* Fondo brillante al seleccionar */}
                      {isSelected && (
                        <div
                          className={cn(
                            "absolute inset-0 opacity-10 bg-gradient-to-br transition-opacity duration-500",
                            gradientColor
                          )}
                        />
                      )}

                      {/* Encabezado de la Tarjeta */}
                      <div className="relative z-10 flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          {/* Indicador de estado (punto brillante) */}
                          <span className="relative flex h-2.5 w-2.5">
                            <span
                              className={cn(
                                "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                                getCongestionTextColor(
                                  point.congestion
                                ).replace("text", "bg")
                              )}
                            ></span>
                            <span
                              className={cn(
                                "relative inline-flex rounded-full h-2.5 w-2.5",
                                getCongestionColor(point.congestion)
                              )}
                            ></span>
                          </span>
                          <h3
                            className={cn(
                              "font-bold text-sm transition-colors line-clamp-1",
                              isSelected
                                ? "text-foreground"
                                : "text-foreground/80"
                            )}
                          >
                            {point.name}
                          </h3>
                        </div>
                        <button
                          className={cn(
                            "transition-colors",
                            isSelected
                              ? "text-white"
                              : "text-muted-foreground hover:text-white"
                          )}
                        >
                          <Navigation className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Grid de Datos */}
                      <div className="relative z-10 grid grid-cols-2 gap-3 mb-3">
                        <div className="bg-black/20 rounded-lg p-2 flex items-center gap-2">
                          <Gauge className="w-4 h-4 text-blue-400" />
                          <div>
                            <span className="block text-[10px] text-muted-foreground font-medium uppercase">
                              Velocidad
                            </span>
                            <span className="text-sm font-bold font-mono">
                              {Math.round(point.avgSpeed)}{" "}
                              <span className="text-[10px] font-normal opacity-70">
                                km/h
                              </span>
                            </span>
                          </div>
                        </div>
                        <div className="bg-black/20 rounded-lg p-2 flex items-center gap-2">
                          <CarFront className="w-4 h-4 text-purple-400" />
                          <div>
                            <span className="block text-[10px] text-muted-foreground font-medium uppercase">
                              Flujo
                            </span>
                            <span className="text-sm font-bold font-mono">
                              {Math.round(point.vehiclesPerHour)}{" "}
                              <span className="text-[10px] font-normal opacity-70">
                                v/h
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Barra de Congestión Visual ANIMADA */}
                      <div className="relative z-10 space-y-1">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-muted-foreground">
                            Nivel de congestión
                          </span>
                          <span
                            className={cn(
                              "font-bold",
                              getCongestionTextColor(point.congestion)
                            )}
                          >
                            {Math.round(point.congestion)}%
                          </span>
                        </div>
                        {/* Estado textual */}
                        <div className="text-xs font-semibold mt-1">
                          Estado:{" "}
                          {getStatusLabel(getTrafficStatus(point.congestion))}
                        </div>

                        <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-500 bg-gradient-to-r animate-flow",
                              gradientColor
                            )}
                            style={{
                              width: `${Math.round(point.congestion)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
