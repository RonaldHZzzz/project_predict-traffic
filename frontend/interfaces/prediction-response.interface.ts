export interface PredictionResponse {
    fecha_hora:          Date;
    mejor_segmento:      number;
    tiempo_estimado_min: number;
    nivel_congestion:    number;
    origen:              string;
}
