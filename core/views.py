import re
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.renderers import TemplateHTMLRenderer
from rest_framework.response import Response
from rest_framework.pagination import CursorPagination
from rest_framework import filters
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
        return Property.objects.filter(**filters).order_by('-id')[:100]

class PropertyPagination(CursorPagination):
    ordering = '-id'

    def get_paginated_response(self, data):
        regex = r'^(http|https):\/\/([^\/]+)'
        next_link = self.get_next_link()
        prev_link = self.get_previous_link()
        return Response({
            'next': re.sub(regex, '', next_link) if next_link else None,
            'previous': re.sub(regex, '', prev_link) if prev_link else None,
            'results': data
        })

class PropertyListView(ListAPIView):
    serializer_class = PropertyListSerializer
    pagination_class = PropertyPagination

    def get_queryset(self):
        filters = build_filters(**self.kwargs)

        type = self.request.query_params.get('type', None)
        if type is not None:
            filters['type'] = type

        vacant = self.request.query_params.get('vacant', None) == '✓'
        if vacant:
            filters['is_occupied'] = False

        return Property.objects.filter(**filters).prefetch_related('city')

class PropertyDetailView(RetrieveAPIView):
    queryset = Property.objects.all()
    serializer_class = PropertyDetailSerializer
