from django.urls import path

from .views import predict_traffic ,get_best_segment

urlpatterns = [
    path("predict-traffic/", predict_traffic, name="predict-traffic"),
    path("recommend-route/", get_best_segment, name="recommend-best-route"),

]
