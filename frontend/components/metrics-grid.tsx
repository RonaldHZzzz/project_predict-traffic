"use client";

import { Badge } from "@/components/ui/badge";
import type { TrafficMetrics } from "@/lib/traffic-data";
import { cn } from "@/lib/utils";

interface MetricsGridProps {
  metrics: TrafficMetrics;
  congestionLevel: number;
}

export function MetricsGrid({ metrics, congestionLevel }: MetricsGridProps) {
  const getCongestingStatus = (level: number) => {
    if (level < 30)
      return {
        label: "Fluido",
        className:
          "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30",
      };
    if (level < 50)
      return {
        label: "Moderado",
        className:
          "bg-yellow-500/20 text-yellow-300 border-yellow-500/30 hover:bg-yellow-500/30",
      };
    if (level < 75)
      return {
        label: "Denso",
        className:
          "bg-orange-500/20 text-orange-300 border-orange-500/30 hover:bg-orange-500/30",
      };
    return {
      label: "Colapsado",
      className:
        "bg-red-500/20 text-red-300 border-red-500/30 hover:bg-red-500/30",
    };
  };

  const status = getCongestingStatus(congestionLevel);

  // Componente interno para las "Mini Cards" de métricas
  const MetricItem = ({
    title,
    value,
    subtext,
    highlight = false,
  }: {
    title: string;
    value: React.ReactNode;
    subtext?: string;
    highlight?: boolean;
  }) => (
    <div
      className={cn(
        "flex flex-col p-3 rounded-xl border transition-colors",
        highlight
          ? "bg-primary/10 border-primary/20"
          : "bg-white/5 border-white/5 hover:bg-white/10"
      )}
    >
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
        {title}
      </span>
      <div className="mt-auto">
        <div className="text-xl md:text-2xl font-bold tracking-tight flex items-baseline gap-1">
          {value}
        </div>
        {subtext && (
          <p className="text-[10px] text-muted-foreground mt-1 leading-tight">
            {subtext}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-2 gap-3 w-full">
      {/* Estado General (Ocupa 2 columnas para destacar) */}
      <div className="col-span-2 bg-white/5 border border-white/5 rounded-xl p-4 flex items-center justify-between">
        <div>
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
            Estado General
          </span>
          <div className="text-3xl font-bold mt-1">{congestionLevel}%</div>
        </div>
        <Badge variant="outline" className={cn("px-3 py-1 text-xs", status.className)}>
          {status.label}
        </Badge>
      </div>

      {/* Tiempo Estimado */}
      <MetricItem
        title="Tiempo Est."
        value={
          <>
            {metrics.estimatedTime} <span className="text-xs font-normal text-muted-foreground">min</span>
          </>
        }
        highlight
      />

      {/* Velocidad */}
      <MetricItem
        title="Velocidad"
        value={
          <>
            {metrics.avgSpeed} <span className="text-xs font-normal text-muted-foreground">km/h</span>
          </>
        }
      />

      {/* Vehículos (Ocupa 2 columnas si quieres equilibrar, o déjalo en 1) */}
      <div className="col-span-2">
        <MetricItem
            title="Flujo Total"
            value={
            <>
                {Math.round(metrics.totalVehicles / 1000)}k <span className="text-xs font-normal text-muted-foreground">vehículos</span>
            </>
            }
            subtext="Total detectado en puntos monitoreados"
        />
      </div>
    </div>
  );
}