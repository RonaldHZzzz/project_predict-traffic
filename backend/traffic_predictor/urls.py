from django.urls import path
from .views import predict_traffic

urlpatterns = [
    path("predict-traffic/", predict_traffic, name="predict-traffic"),
]
