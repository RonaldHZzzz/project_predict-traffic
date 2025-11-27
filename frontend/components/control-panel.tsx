"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  Filter,
  Calendar,
  Clock,
  Layers,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export function ControlPanel() {
  const [showAlternateRoutes, setShowAlternateRoutes] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [congestionFilter, setCongestionFilter] = useState("all");

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simular recarga
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Encabezado del Panel */}
      <div>
        <h3 className="text-lg font-semibold tracking-tight">Panel de Control</h3>
        <p className="text-sm text-muted-foreground">
          Configuración y filtros de tráfico
        </p>
      </div>

      <Separator className="bg-white/10" />

      {/* Sección de Filtros */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-primary/80">
          <Filter className="w-4 h-4" />
          <span>Filtros de Visualización</span>
        </div>

        {/* Filtro de Congestión */}
        <div className="space-y-2">
          <Label htmlFor="congestion-level" className="text-xs text-muted-foreground">
            Nivel de Congestión
          </Label>
          <Select
            value={congestionFilter}
            onValueChange={setCongestionFilter}
          >
            <SelectTrigger
              id="congestion-level"
              className="bg-white/5 border-white/10 text-sm focus:ring-0 focus:ring-offset-0"
            >
              <SelectValue placeholder="Todos los niveles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los niveles</SelectItem>
              {/* CORRECCIÓN: Usar &lt; en lugar de < para evitar error de sintaxis TS1003 */}
              <SelectItem value="low">Fluido (&lt; 30%)</SelectItem>
              <SelectItem value="moderate">Moderado (30% - 50%)</SelectItem>
              <SelectItem value="high">Congestionado (50% - 75%)</SelectItem>
              <SelectItem value="severe">Colapsado (&gt; 75%)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filtro de Fecha y Hora */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="date-filter" className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Fecha
            </Label>
            <input
              type="date"
              id="date-filter"
              className="w-full bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="time-filter" className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" /> Hora
            </Label>
            <input
              type="time"
              id="time-filter"
              className="w-full bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
        </div>
      </div>

      <Separator className="bg-white/10" />

      {/* Capas y Rutas */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-primary/80">
          <Layers className="w-4 h-4" />
          <span>Capas del Mapa</span>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
          <div className="space-y-0.5">
            <Label className="text-sm cursor-pointer" htmlFor="alt-routes">
              Rutas Alternas
            </Label>
            <p className="text-[10px] text-muted-foreground">
              Mostrar vías de escape sugeridas
            </p>
          </div>
          <Switch
            id="alt-routes"
            checked={showAlternateRoutes}
            onCheckedChange={setShowAlternateRoutes}
          />
        </div>
      </div>

      {/* Acciones Finales */}
      <div className="mt-auto pt-4 flex flex-col gap-3">
        <Button
          variant="secondary"
          className="w-full gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Actualizando..." : "Actualizar Datos"}
        </Button>
        
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground/60">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Sistema Operativo • {new Date().toLocaleTimeString("es-ES", { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}