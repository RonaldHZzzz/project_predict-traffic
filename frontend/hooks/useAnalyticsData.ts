import { useState, useEffect } from "react";
import { useCustomApi } from "@/hooks/useCustomApi";
import { format } from "date-fns";

interface MetricData {
  hora_pico_manana: string;
  hora_pico_tarde: string;
  promedio_vehiculos: string;
  nivel_congestion_general: string;
}

interface ChartDataPoint {
  hour: string;
  [key: string]: any; // Allows for dynamic keys like "Tramo 1_volume", "Tramo 1_congestion", etc.
}

interface AnalyticsApiResponse {
  chart_data: ChartDataPoint[];
  metrics: MetricData;
}

interface UseAnalyticsDataHook {
  analyticsData: AnalyticsApiResponse | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useAnalyticsData = (
  selectedDate: Date | undefined,
  selectedSegment: string
): UseAnalyticsDataHook => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const api = useCustomApi();

  const fetchData = async () => {
    if (!selectedDate) {
      setAnalyticsData(null);
      setError("Fecha no seleccionada.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      const segmentParam = selectedSegment === "all" ? "" : `&segment_id=${selectedSegment}`;
      const response = await api.get<AnalyticsApiResponse>(
        `/api/analytics-data/?date=${formattedDate}${segmentParam}`
      );
      setAnalyticsData(response.data);
    } catch (err: any) {
      console.error("Error fetching analytics data:", err);
      setError(
        err.response?.data?.error || "Error al cargar los datos de análisis."
      );
      setAnalyticsData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate, selectedSegment]); // Re-fetch when date or segment changes

  return { analyticsData, isLoading, error, refetch: fetchData };
};
