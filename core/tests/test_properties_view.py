import json

from django.test import TestCase
from django.urls import reverse

from core.models import City, Property

sample_city_data = dict(
    id=1,
    name='PORTO ALEGRE',
    state='RS',
    latitude=-30.1,
    longitude=-51.1
)

sample_property_data = dict(
    id=1,
    name='foo',
    latitude=-29.7,
    longitude=-51.1,
    is_occupied=False
)

class TestGet(TestCase):

    def setUp(self):
        obj = Property(**sample_property_data)
        obj.city = City.objects.create(**sample_city_data)
        obj.save()

        url = reverse('core:properties', args=[-28.0, -50.0, -31.0, -52.0])
        self.response = self.client.get(url)

    def test_status_code(self):
        self.assertEqual(200, self.response.status_code)

    def test_content(self):
        response = json.loads(self.response.content.decode('utf-8'))[0]
        self.assertEqual(1, response['id'])
        self.assertEqual(False, response['is_occupied'])
        self.assertEqual(-29.7, response['latitude'])
        self.assertEqual(-51.1, response['longitude'])
