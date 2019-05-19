from django.urls import path
from .views import CityListView, PropertyListView, PropertyDetailView

app_name = 'core'

urlpatterns = [
    path('cities', CityListView.as_view()),
    path('properties/<pk>', PropertyDetailView.as_view(), name='property-detail'),
    path('properties/<lat_min>,<lon_min>/<lat_max>,<lon_max>', PropertyListView.as_view(), name='properties')
]
