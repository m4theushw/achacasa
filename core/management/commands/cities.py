import csv
from django.core.management.base import BaseCommand, CommandError
from core.models import City

class Command(BaseCommand):
    help = 'Imports the cities dataset'

    def add_arguments(self, parser):
        parser.add_argument('dataset', help='Path to the .csv dataset')

    def handle(self, *args, **options):
        print('Deleting all existing records')
        City.objects.all().delete()

        cities = []
        path = options['dataset']
        with open(path, mode='r', encoding='utf-8') as file_handler:
            for row in csv.DictReader(file_handler):
                obj = City(**{k: self.serialize(v) for k, v in row.items()})
                cities.append(obj)

        City.objects.bulk_create(cities)
        print('{:,} objects created'.format(City.objects.count()))

    def serialize(self, value):
        return value if len(value) > 0 else None
