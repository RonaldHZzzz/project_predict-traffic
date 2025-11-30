"use client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  BrainCircuit,
  Calendar as CalendarIcon,
  Clock,
  Waypoints,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface ControlPanelProps {
  isPredictionMode: boolean;
  onPredictionModeChange: (isMode: boolean) => void;
  predictionDate: Date | undefined;
  onPredictionDateChange: (date: Date | undefined) => void;
  predictionHour: number;
  onPredictionHourChange: (hour: number) => void;
  onRecommendRoute: () => void;
  isRecommending: boolean;
}

export function ControlPanel({
  isPredictionMode,
  onPredictionModeChange,
  predictionDate,
  onPredictionDateChange,
  predictionHour,
  onPredictionHourChange,
  onRecommendRoute,
  isRecommending,
}: ControlPanelProps) {
  return (
    <div className="h-full flex flex-col gap-4">
      <div>
        <h3 className="text-lg font-semibold tracking-tight">
          Panel de Control
        </h3>
        <p className="text-sm text-muted-foreground">
          {isPredictionMode
            ? "Configure la fecha y hora de la predicción."
            : "Visualización de datos en tiempo real."}
        </p>
      </div>

      <Separator className="bg-white/10" />

      {/* Botón principal para cambiar de modo */}
      <Button
        onClick={() => onPredictionModeChange(!isPredictionMode)}
        variant="outline"
        className="w-full"
      >
        {isPredictionMode
          ? "Ver Tráfico en Tiempo Real"
          : "Ver Predicción de Tráfico"}
      </Button>

      {/* Controles de Predicción */}
      {isPredictionMode && (
        <div className="space-y-6 animate-in fade-in-50">
          {/* Selector de Fecha */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <CalendarIcon className="w-3 h-3" /> Fecha de Predicción
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !predictionDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {predictionDate ? (
                    format(predictionDate, "PPP")
                  ) : (
                    <span>Seleccione una fecha</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={predictionDate}
                  onSelect={onPredictionDateChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Selector de Hora */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" /> Hora
            </Label>
            <Select
              value={String(predictionHour)}
              onValueChange={(value) => onPredictionHourChange(Number(value))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccione una hora" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 24 }, (_, i) => (
                  <SelectItem key={i} value={String(i)}>
                    {String(i).padStart(2, "0")}:00
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator className="bg-white/10" />

          {/* Acción de Recomendar Ruta */}
          <Button
            disabled={!predictionDate || isRecommending}
            className="w-full gap-2 transition-colors hover:bg-blue-700"
            onClick={onRecommendRoute}
          >
            {isRecommending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                <span>Calculando...</span>
              </>
            ) : (
              <>
                <Waypoints className="w-4 h-4" />
                <span>Recomendar Mejor Ruta</span>
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}