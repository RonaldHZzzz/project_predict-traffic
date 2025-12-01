from django.urls import path

from .views import (
    predict_traffic,
    get_best_segment,
    recommend_route_v1,
    recommend_route_v2,
    get_analytics_data
)

urlpatterns = [
    path("predict-traffic/", predict_traffic, name="predict-traffic"),
    path("recommend-route/", get_best_segment, name="recommend-best-route"),
    path("recommend-route-v1/", recommend_route_v1, name="recommend-route-v1"),
    path("recommend-route-v2/", recommend_route_v2, name="recommend-route-v2"),
    path("analytics-data/", get_analytics_data, name="analytics-data"),
]
