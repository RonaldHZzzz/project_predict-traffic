"use client";

import { GlassCard } from "../ui/GlassCard";
import { ControlPanel } from "../control-panel";
import { MetricsGrid } from "../metrics-grid";
import { Skeleton } from "../ui/skeleton";
import { cn } from "@/lib/utils";
import type { TrafficMetrics } from "@/lib/traffic-data";

interface LeftSidebarProps {
  isPredictionMode: boolean;
  onPredictionModeChange: (isMode: boolean) => void;
  predictionDate: Date | undefined;
  onPredictionDateChange: (date: Date | undefined) => void;
  predictionHour: number;
  onPredictionHourChange: (hour: number) => void;
  onRecommendRoute: () => void;
  metrics: TrafficMetrics | null;
  avgCongestion: number;
  matrixError: string | null;
  matrixData: any | null;
  tiempoRuta1: number | null;
  tiempoRuta2: number | null;
  scrollbarStyles: string;
  isRecommending: boolean;
}

export function LeftSidebar({
  isPredictionMode,
  onPredictionModeChange,
  predictionDate,
  onPredictionDateChange,
  predictionHour,
  onPredictionHourChange,
  onRecommendRoute,
  metrics,
  avgCongestion,
  matrixError,
  matrixData,
  tiempoRuta1,
  tiempoRuta2,
  scrollbarStyles,
  isRecommending,
}: LeftSidebarProps) {
  return (
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
          onPredictionModeChange={onPredictionModeChange}
          predictionDate={predictionDate}
          onPredictionDateChange={onPredictionDateChange}
          predictionHour={predictionHour}
          onPredictionHourChange={onPredictionHourChange}
          onRecommendRoute={onRecommendRoute}
          isRecommending={isRecommending}
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
                <span className="text-muted-foreground">Ruta 1 (Punto 2)</span>
                <span className="font-bold text-xl text-blue-400">
                  {tiempoRuta1 ?? "--"}{" "}
                  <span className="text-xs text-muted-foreground">min</span>
                </span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-white/5 border border-white/5">
                <span className="text-muted-foreground">Ruta 2 (Punto 3)</span>
                <span className="font-bold text-xl text-blue-400">
                  {tiempoRuta2 ?? "--"}{" "}
                  <span className="text-xs text-muted-foreground">min</span>
                </span>
              </div>
            </div>
          )}
        </GlassCard>
      )}
    </div>
  );
}
