from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.renderers import TemplateHTMLRenderer
from rest_framework.response import Response
from rest_framework import filters
from django.db.models import Count

from .models import City, Property
from .serializers import (
    CitySerializer,
    PropertyListSerializer,
    PropertyDetailSerializer
)

class CityListView(ListAPIView):
    serializer_class = CitySerializer

    def get_queryset(self):
        search = self.request.query_params.get('search', None)
        cities = None
        if search is None:
            cities = City.objects.annotate(Count('property')) \
                .filter(property__count__gte=10)
        else:
            cities = City.objects.filter(name__contains=search.upper())
        return cities.order_by('name')[:10]

class PropertyListView(ListAPIView):
    serializer_class = PropertyListSerializer

    def get_queryset(self):
        latMin = float(self.kwargs['lat_min'])
        lonMin = float(self.kwargs['lon_min'])
        latMax = float(self.kwargs['lat_max'])
        lonMax = float(self.kwargs['lon_max'])

        filters = {
            'latitude__gte': latMin if latMin < latMax else latMax,
            'latitude__lte': latMax if latMin < latMax else latMin,
            'longitude__gte': lonMin if lonMin < lonMax else lonMax,
            'longitude__lte': lonMax if lonMin < lonMax else lonMin
        }

        return Property.objects.filter(**filters).prefetch_related('photos', 'city')[:100]

class PropertyDetailView(RetrieveAPIView):
    queryset = Property.objects.all()
    serializer_class = PropertyDetailSerializer
