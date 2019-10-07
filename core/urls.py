from django.urls import path
from .views import CityListView, MarkerListView, PropertyListView, PropertyDetailView

app_name = 'core'

urlpatterns = [
    path('cities', CityListView.as_view()),
    path('properties/<pk>', PropertyDetailView.as_view()),
    path('markers/<lat_min>,<lon_min>/<lat_max>,<lon_max>', MarkerListView.as_view()),
    path('properties/<lat_min>,<lon_min>/<lat_max>,<lon_max>', PropertyListView.as_view())
]
