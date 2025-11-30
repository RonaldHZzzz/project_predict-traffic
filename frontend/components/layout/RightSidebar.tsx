"use client";

import { cn } from "@/lib/utils";
import { GlassCard } from "../ui/GlassCard";
import {
  getTrafficStatus,
  getStatusLabel,
} from "@/lib/traffic-data";
import { CarFront, Gauge, Navigation } from "lucide-react";

interface RightSidebarProps {
  pointsToDisplay: any[];
  selectedPointId: string | null;
  handleSegmentSelect: (id: number | null, pointId?: string | null) => void;
  isPredictionMode: boolean;
  isPredictingData: boolean;
  scrollbarStyles: string;
}

export function RightSidebar({
  pointsToDisplay,
  selectedPointId,
  handleSegmentSelect,
  isPredictionMode,
  isPredictingData,
  scrollbarStyles,
}: RightSidebarProps) {
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

  return (
     <div className="w-full md:w-1/3 lg:w-1/4 flex flex-col justify-end pointer-events-none gap-2">
      {/* Título de la sección flotante */}
      <div className="bg-background/40 backdrop-blur-md border border-white/10 rounded-lg p-2 px-4 flex items-center justify-between pointer-events-auto gap-3">
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
  );
}
