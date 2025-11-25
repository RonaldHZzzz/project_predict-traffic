from django.shortcuts import render

# Create your views here.
from rest_framework.decorators import api_view
from rest_framework.response import Response

@api_view(['GET'])
def traffic_points(request):
    # Datos simulados para probar
    data = [
        {
            "id": "segmento-1",
            "name": "Los Chorros – Tramo 1",
            "lat": 13.70,
            "lng": -89.30,
            "status": "moderado",
            "congestion": 65,
            "avgSpeed": 45,
            "vehiclesPerHour": 1200
        },
        {
            "id": "segmento-2",
            "name": "Los Chorros – Tramo 2",
            "lat": 13.7050,
            "lng": -89.2950,
            "status": "congestionado",
            "congestion": 85,
            "avgSpeed": 28,
            "vehiclesPerHour": 1800
        }
    ]
    return Response(data)
