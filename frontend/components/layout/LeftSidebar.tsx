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
  isConstructionMode: boolean;
  onConstructionModeChange: (isMode: boolean) => void;
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
  isConstructionMode,
  onConstructionModeChange,
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
          isConstructionMode={isConstructionMode}
          onConstructionModeChange={onConstructionModeChange}
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

      
    </div>
  );
}
