from django.urls import path
from .views import CityListView, MarkerListView, PropertyDetailView

app_name = 'core'

urlpatterns = [
    path('cities', CityListView.as_view()),
    path('properties/<pk>', PropertyDetailView.as_view(), name='property-detail'),
    path('markers/<lat_min>,<lon_min>/<lat_max>,<lon_max>', MarkerListView.as_view(), name='properties')
]
