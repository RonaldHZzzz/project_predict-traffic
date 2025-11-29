"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, BrainCircuit } from "lucide-react"; // Importamos icono para predecir
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import useCustomApi from "@/hooks/useCustomApi";

const api = useCustomApi();

interface ControlPanelProps {
  onDateChange: (date: string) => void;
  onPredict: (segmentoId: number) => void;
  isPredicting: boolean;
  selectedDate: string;
  hasSelectedSegment: boolean; // Para saber si habilitar el botón
  onPredictingChange?: (isPredicting: boolean) => void;
}

export function ControlPanel({
  onDateChange,
  onPredict,
  isPredicting,
  selectedDate,
  hasSelectedSegment,
  onPredictingChange,
}: ControlPanelProps) {
  const [dateInput, setDateInput] = useState(selectedDate);
  const [error, setError] = useState<string | null>(null);

  // Sincronizar dateInput cuando selectedDate cambia desde el padre
  useEffect(() => {
    setDateInput(selectedDate);
  }, [selectedDate]);

  const predict = async () => {
    if (!selectedDate) return;

    try {
      setError(null);

      // Notificar que estamos prediciendo
      onPredictingChange?.(true);

      const response = await api.post("api/recommend-route/", {
        fecha_hora: selectedDate,
      });
      console.log("Prediction result:", response.data);

      const segmentoRecommended = response.data.mejor_segmento;
      if (!segmentoRecommended) {
        setError("No se pudo obtener una recomendación de segmento.");
        return;
      }
      onPredict(segmentoRecommended); // Call the parent callback
      return;
    } catch (error) {
      console.error("Error during prediction:", error);
      setError("Error al realizar la predicción. Intenta de nuevo.");
    } finally {
      // Notificar que terminamos de predecir
      onPredictingChange?.(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Encabezado */}
      <div>
        <h3 className="text-lg font-semibold tracking-tight">
          Panel de Predicción
        </h3>
        <p className="text-sm text-muted-foreground">
          Selecciona una fecha para ver el futuro
        </p>
      </div>

      <Separator className="bg-white/10" />

      {/* Sección de Configuración */}
      <div className="space-y-4">
        {/* Selector de Fecha */}
        <div className="space-y-2">
          <Label
            htmlFor="date-filter"
            className="text-xs text-muted-foreground flex items-center gap-1"
          >
            <Calendar className="w-3 h-3" /> Fecha de Predicción
          </Label>
          <input
            type="date"
            id="date-filter"
            value={dateInput}
            onChange={(e) => {
              setDateInput(e.target.value);
              onDateChange(e.target.value);
            }}
            className="w-full bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
{/* 
        {!hasSelectedSegment && (
          <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-[10px] text-yellow-200">
            ⚠ Selecciona un tramo en el mapa para predecir.
          </div>
        )} */}

        {!selectedDate && (
          <div className="p-2 bg-red-500/10 border border-red-500/20 rounded text-[10px] text-red-200">
            ⚠ Selecciona una fecha para realizar la predicción.
          </div>
        )}

        {error && (
          <div className="p-2 bg-red-500/10 border border-red-500/20 rounded text-[10px] text-red-200">
            {error}
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className="mt-auto pt-4 flex flex-col gap-3">
        <Button
          className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={predict}
          disabled={isPredicting || !selectedDate}
        >
          <BrainCircuit
            className={`w-4 h-4 ${isPredicting ? "animate-pulse" : ""}`}
          />
          {isPredicting ? "Calculando..." : "Predecir Tráfico Futuro"}
        </Button>
      </div>
    </div>
  );
}
