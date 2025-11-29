"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, BrainCircuit } from "lucide-react"; // Importamos icono para predecir
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface ControlPanelProps {
  onDateChange: (date: string) => void;
  onPredict: () => void;
  isPredicting: boolean;
  selectedDate: string;
  hasSelectedSegment: boolean; // Para saber si habilitar el botón
}



export function ControlPanel({ 
  onDateChange, 
  onPredict, 
  isPredicting,
  selectedDate,
  hasSelectedSegment 
}: ControlPanelProps) {

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Encabezado */}
      <div>
        <h3 className="text-lg font-semibold tracking-tight">Panel de Predicción</h3>
        <p className="text-sm text-muted-foreground">
          Selecciona una fecha para ver el futuro
        </p>
      </div>

      <Separator className="bg-white/10" />

      {/* Sección de Configuración */}
      <div className="space-y-4">
        
        {/* Selector de Fecha */}
        <div className="space-y-2">
          <Label htmlFor="date-filter" className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Fecha de Predicción
          </Label>
          <input
            type="date"
            id="date-filter"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
        
        {!hasSelectedSegment && (
           <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-[10px] text-yellow-200">
             ⚠ Selecciona un tramo en el mapa para predecir.
           </div>
        )}
      </div>

      {/* Acciones */}
      <div className="mt-auto pt-4 flex flex-col gap-3">
        <Button
          className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          onClick={onPredict}
          disabled={isPredicting || !selectedDate || !hasSelectedSegment}
        >
          <BrainCircuit className={`w-4 h-4 ${isPredicting ? "animate-pulse" : ""}`} />
          {isPredicting ? "Calculando..." : "Predecir Tráfico Futuro"}
        </Button>
      </div>
    </div>
  );
}