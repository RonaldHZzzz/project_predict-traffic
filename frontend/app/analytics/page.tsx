"use client";

import { useState, useEffect } from "react"; // Added useEffect
import { Header } from "@/components/header";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

import { AnalyticsMetricCard } from "@/components/analytics-metric-card";
import { AnalyticsCharts } from "@/components/analytics-charts";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";
import { useCustomApi } from "@/hooks/useCustomApi"; // Import useCustomApi

interface Segment {
  segmento_id: number;
  nombre: string;
}

export default function AnalyticsPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedSegment, setSelectedSegment] = useState<string>("all");
  const [segmentsList, setSegmentsList] = useState<Segment[]>([]);
  const [isLoadingSegments, setIsLoadingSegments] = useState<boolean>(true);
  const [segmentsError, setSegmentsError] = useState<string | null>(null);

  const api = useCustomApi(); // Initialize API hook

  useEffect(() => {
    const fetchSegments = async () => {
      try {
        const response = await api.get<Segment[]>("/api/segmentos/");
        setSegmentsList(response.data);
      } catch (err: any) {
        console.error("Error fetching segments:", err);
        setSegmentsError("Error al cargar la lista de segmentos.");
      } finally {
        setIsLoadingSegments(false);
      }
    };
    fetchSegments();
  }, []); // Run once on component mount

  const { analyticsData, isLoading, error } = useAnalyticsData(
    selectedDate,
    selectedSegment
  );

  const handlePreviousDay = () => {
    if (selectedDate) {
      const newDate = new Date(selectedDate);
      newDate.setDate(newDate.getDate() - 1);
      setSelectedDate(newDate);
    }
  };

  const handleNextDay = () => {
    if (selectedDate) {
      const newDate = new Date(selectedDate);
      newDate.setDate(newDate.getDate() + 1);
      setSelectedDate(newDate);
    }
  };

  const segmentDisplayNames: { [key: string]: string } = {
    "all": "Todos los segmentos",
    ...segmentsList.reduce((acc, segment) => {
      acc[segment.segmento_id.toString()] = segment.nombre;
      return acc;
    }, {} as { [key: string]: string }),
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans p-4 md:p-6">
      <div className="mb-6">
        <div className="rounded-xl overflow-hidden shadow-lg backdrop-blur-md bg-background/40 border border-white/10">
          <Header />
        </div>
      </div>

      <h1 className="text-3xl font-bold mb-6">Análisis de Tráfico</h1>

      {/* Navigation and Filters */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 space-y-4 md:space-y-0">
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handlePreviousDay} className="text-white bg-white/10 border-white/20 hover:bg-white/20">
            &larr; Día Anterior
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[240px] justify-start text-left font-normal text-white bg-white/10 border-white/20 hover:bg-white/20",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button variant="outline" onClick={handleNextDay} className="text-white bg-white/10 border-white/20 hover:bg-white/20">
            Día Siguiente &rarr;
          </Button>
        </div>

        <div className="w-full md:w-auto">
          {isLoadingSegments ? (
            <Skeleton className="w-full md:w-[240px] h-10" />
          ) : segmentsError ? (
            <div className="text-red-500">{segmentsError}</div>
          ) : (
            <Select value={selectedSegment} onValueChange={setSelectedSegment}>
              <SelectTrigger className="w-full md:w-[240px] text-white bg-white/10 border-white/20 hover:bg-white/20">
                <SelectValue placeholder={segmentDisplayNames[selectedSegment]} />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 text-white border-gray-700">
                <SelectItem value="all">Todos los segmentos</SelectItem>
                {segmentsList.map((segment) => (
                  <SelectItem
                    key={segment.segmento_id}
                    value={segment.segmento_id.toString()}
                  >
                    {segment.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {(isLoading || isLoadingSegments) && (
        <div className="text-center text-white text-lg mb-8">Cargando datos de análisis...</div>
      )}

      {(error || segmentsError) && (
        <div className="text-center text-red-500 text-lg mb-8">Error: {error || segmentsError}</div>
      )}

      {!isLoading && !error && !isLoadingSegments && !segmentsError && analyticsData && (
        <>
          {/* Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <AnalyticsMetricCard
              title="Hora Pico Mañana"
              value={analyticsData.metrics.hora_pico_manana}
            />
            <AnalyticsMetricCard
              title="Hora Pico Tarde"
              value={analyticsData.metrics.hora_pico_tarde}
            />
            <AnalyticsMetricCard
              title="Promedio de Vehículos"
              value={analyticsData.metrics.promedio_vehiculos}
            />
            <AnalyticsMetricCard
              title="Nivel de Congestión General"
              value={analyticsData.metrics.nivel_congestion_general}
            />
          </div>

          {/* Charts */}
          <AnalyticsCharts
            data={analyticsData.chart_data}
            selectedSegment={selectedSegment}
            availableSegments={segmentsList}
          />
        </>
      )}

      {!isLoading && !error && !isLoadingSegments && !segmentsError && !analyticsData && (
        <div className="text-center text-gray-400 text-lg mb-8">
          Seleccione una fecha para ver los datos de análisis.
        </div>
      )}
    </div>
  );
}