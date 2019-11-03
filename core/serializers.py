from rest_framework import serializers
from .models import City, Property

class CitySerializer(serializers.ModelSerializer):
    count = serializers.SerializerMethodField()
    label = serializers.SerializerMethodField()

    class Meta:
        model = City
        exclude = ('name', 'state',)

    def get_count(self, obj):
        return obj.property_set.count()

    def get_label(self, obj):
        return obj.name + ' - ' + obj.state

class MarkerListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Property
        fields = ('id', 'name', 'slug',  'latitude', 'longitude', 'type', 'is_occupied')

class PropertyListSerializer(serializers.ModelSerializer):
    city = serializers.StringRelatedField()

    class Meta:
        model = Property
        fields = ('id', 'name', 'slug',  'latitude', 'longitude', 'type', 'city',
                  'is_occupied', 'evaluation_value','minimum_value','sale_value')

class PropertyDetailSerializer(serializers.ModelSerializer):
    attachments = serializers.SlugRelatedField(
        many = True,
        read_only = True,
        slug_field = 'url'
    )

    photos = serializers.SlugRelatedField(
        many = True,
        read_only = True,
        slug_field = 'url'
    )

    city = serializers.StringRelatedField()

    class Meta:
        model = Property
        exclude = []
