# project_predict-traffic

This project provides a simple API to predict traffic congestion and recommend the best route.

## API Endpoints

### 1. Predict Traffic Congestion

This endpoint predicts the traffic congestion for a specific segment on a given date.

*   **URL:** `/api/predict-traffic/`
*   **Method:** `GET`
*   **Query Parameters:**
    *   `segmento_id` (integer, required): The ID of the segment (1-10).
    *   `fecha` (string, optional): The date for the prediction in `YYYY-MM-DD` format. If not provided, the current date is used.
*   **Example:**
    ```
    /api/predict-traffic/?segmento_id=1&fecha=2025-02-01
    ```
*   **Success Response:**
    *   **Code:** 200 OK
    *   **Content:** A JSON object with the 24-hour traffic prediction.

### 2. Recommend Best Route

This endpoint recommends the best route based on the traffic prediction for a given date and time.

*   **URL:** `/api/recommend-route/`
*   **Method:** `GET`
*   **Query Parameters:**
    *   `fecha_hora` (string, required): The date and time for the route recommendation in `YYYY-MM-DD HH:MM:SS` format.
*   **Example:**
    ```
    /api/recommend-route/?fecha_hora=2025-02-01%2008:00:00
    ```
*   **Success Response:**
    *   **Code:** 200 OK
    *   **Content:** A JSON object with the recommended route.
