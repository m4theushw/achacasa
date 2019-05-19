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

class PropertyListSerializer(serializers.ModelSerializer):
    city = serializers.StringRelatedField()
    thumb = serializers.SerializerMethodField()

    class Meta:
        model = Property
        fields = ('id', 'name', 'city', 'thumb', 'slug',  'latitude', 'longitude',
                    'type', 'is_occupied', 'sale_value', 'minimum_value', 'evaluation_value')

    def get_thumb(self, obj):
        photos = obj.photos.all()
        return photos[0].url if len(photos) > 0 else None

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
        exclude = ('slug',)
