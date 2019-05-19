import json

from django.test import TestCase
from django.urls import reverse

from core.models import City, Property

sample_city_data = dict(
    id=1,
    name='porto alegre',
    state='rs',
    latitude=-30.1,
    longitude=-51.1
)

sample_property_data = dict(
    id=1,
    name='foobar',
    latitude=-29.7,
    longitude=-51.1,
    is_occupied=False,
    description='lorem ipsum',
    slug='1-foobar'
)

class TestGet(TestCase):

    def setUp(self):
        obj = Property(**sample_property_data)
        obj.city = City.objects.create(**sample_city_data)
        obj.save()
        obj.attachments.create(url='foo.pdf')
        obj.photos.create(url='bar.png')
        url = reverse('core:property-detail', args=[1])
        self.response = self.client.get(url)

    def test_status_code(self):
        self.assertEqual(200, self.response.status_code)

    def test_content(self):
        self.assertContains(self.response, 'foobar')
        self.assertContains(self.response, 'lorem ipsum')
        self.assertContains(self.response, 'foo.pdf')
        self.assertContains(self.response, 'bar.png')
