from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.renderers import TemplateHTMLRenderer
from rest_framework.response import Response
from rest_framework import filters, pagination
from django.db.models import Count

from .models import City, Property
from .serializers import (
    CitySerializer,
    MarkerListSerializer,
    PropertyDetailSerializer,
    PropertyListSerializer
)

def build_filters(**kwargs):
    latMin = float(kwargs['lat_min'])
    lonMin = float(kwargs['lon_min'])
    latMax = float(kwargs['lat_max'])
    lonMax = float(kwargs['lon_max'])

    filters = {
        'latitude__gte': latMin if latMin < latMax else latMax,
        'latitude__lte': latMax if latMin < latMax else latMin,
        'longitude__gte': lonMin if lonMin < lonMax else lonMax,
        'longitude__lte': lonMax if lonMin < lonMax else lonMin
    }

    return filters

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

class MarkerListView(ListAPIView):
    serializer_class = MarkerListSerializer

    def get_queryset(self):
        filters = build_filters(**self.kwargs)
        return Property.objects.filter(**filters)[:100]

class PropertyListView(ListAPIView):
    serializer_class = PropertyListSerializer
    pagination_class = pagination.CursorPagination

    def get_queryset(self):
        filters = build_filters(**self.kwargs)

        type = self.request.query_params.get('type', None)
        if type is not None:
            filters['type'] = type

        occupied = self.request.query_params.get('occupied', None) == '✔'
        if occupied:
            filters['is_occupied'] = True

        return Property.objects.filter(**filters).prefetch_related('city')

class PropertyDetailView(RetrieveAPIView):
    queryset = Property.objects.all()
    serializer_class = PropertyDetailSerializer
