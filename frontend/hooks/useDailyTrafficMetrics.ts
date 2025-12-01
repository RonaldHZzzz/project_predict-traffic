import { useState, useEffect } from 'react';

interface HourlyMetric {
  hora: string;
  nivel_congestion_promedio: number;
  velocidad_promedio: number;
  carga_vehicular_promedio: number;
  tiempo_estimado_total: number;
  is_peak_hour: boolean;
}

interface PeakHour {
  hora: string;
  nivel_congestion: number;
}

export interface DailyMetricsResponse {
  hourly_metrics: HourlyMetric[];
  principal_peak_hour: PeakHour | null;
  secondary_peak_hour: PeakHour | null;
  most_congested_hours: PeakHour[];
}

export const useDailyTrafficMetrics = (date: string | undefined, segmentId?: number) => {
  const [data, setData] = useState<DailyMetricsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!date) {
            setData(null);
            setLoading(false);
            return;
        }

        const params = new URLSearchParams({ fecha: date });
        if (segmentId) {
          params.append('segmento_id', segmentId.toString());
        }
        
        // This assumes your frontend is configured to proxy /api requests to your backend
        // If not, replace with the full backend URL (e.g., http://localhost:8000)
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/trafico/metrics/daily/?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result: DailyMetricsResponse = await response.json();
        setData(result);
      } catch (e) {
        console.error("Error fetching daily traffic metrics:", e);
        setError(e);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [date, segmentId]);

  return { data, loading, error };
};
