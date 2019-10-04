import csv
from django.core.management.base import BaseCommand, CommandError
from core.models import Property, City, Attachment

class Command(BaseCommand):
    help = 'Imports the properties dataset'

    def add_arguments(self, parser):
        parser.add_argument('dataset', help='Path to the .csv dataset')

    def handle(self, *args, **options):
        print('Deleting all existing records')
        Property.objects.all().delete()

        path = options['dataset']
        keys = [f.name for f in Property._meta.fields]
        cities = {str(city.id): city for city in City.objects.all()}

        with open(path, mode='r', encoding='utf-8') as file_handler:
            for row in csv.DictReader(file_handler):
                filtered = {k: v for k, v in row.items() if k in keys}
                obj = Property(**self.serialize(filtered))
                obj.id = int(row['id'])
                obj.city = cities[row['city_id']]
                obj.save()

                for attachment in self.extract_attachments(row):
                    obj.attachments.create(url=attachment)
                for photo in self.extract_photos(row):
                    obj.photos.create(url=photo)

        print('{:,} objects created'.format(Property.objects.count()))

    def extract_attachments(self, row):
        for num in range(0, 100):
            attachment = row.get('attachment_{}'.format(num))
            if attachment:
                yield attachment

    def extract_photos(self, row):
        for num in range(0, 100):
            photo = row.get('photo_{}'.format(num))
            if photo:
                yield photo

    def serialize(self, row):
        row['is_occupied'] = self.to_boolean(row['is_occupied'])
        row['bedrooms'] = self.to_number(row['bedrooms'], int)

        decimals = ('evaluation_value','minimum_value','sale_value',
                      'private_area','site_area','total_area', 'latitude', 'longitude')

        for key in decimals:
            row[key] = self.to_number(row[key])

        return row

    def to_boolean(self, value):
        if len(value) == 0:
            return None
        return value.lower() == 'true'

    def to_number(self, value, cast=None):
        if len(value.lower()) == 0:
            return None
        number = float(value)
        return cast(number) if cast else number
