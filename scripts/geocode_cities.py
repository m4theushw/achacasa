import os
import re
import pickle
import shutil
import datetime
import pandas as pd
from concurrent import futures
from geopy.geocoders import GoogleV3
from geopy.exc import GeocoderTimedOut

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, 'data')
TEMP_PATH = os.path.join(DATA_PATH, 'cities')
DATE = datetime.date.today().strftime('%Y-%m-%d')
DATASET_PATH = os.path.join(DATA_PATH, '{}-cities.csv'.format(DATE))

geolocator = GoogleV3('AIzaSyAUdbMavA1-HT-pfVi5l1B54gkIqNJZdtg')

def geocode_city(city):
  try:
    name = city['name']
    state = city['state']
    location = geolocator.geocode('{}, {}'.format(name, state))
  except GeocoderTimedOut as e:
    print('Timeout')
    return None
  return location

def write_geocoding_info(city_location, id):
  print('Writing {}'.format(id))
  with open('{}/{}.pkl'.format(TEMP_PATH, id), 'wb') as f:
    pickle.dump(city_location, f, pickle.HIGHEST_PROTOCOL)

def read_geocoding_info(city):
  filename = '{}/{}.pkl'.format(TEMP_PATH, city['id'])
  if os.path.isfile(filename):
    with open(filename, 'rb') as f:
      try:
          location = pickle.load(f)
      except (ValueError, EOFError) as e:
          return pd.Series()
    if location is None:
      return pd.Series()
    else:
      return pd.Series({'latitude': location.latitude,
                        'longitude': location.longitude})
  else:
    return pd.Series()

def geocode_cities(cities):
  with futures.ThreadPoolExecutor(max_workers=1) as executor:
    future_to_geocoding = dict((executor.submit(geocode_city, city), city)
                              for index, city in cities[:1].iterrows())
    for future in futures.as_completed(future_to_geocoding):
      city = future_to_geocoding[future]
      if future.exception() is None and future.result() is not None:
        write_geocoding_info(future.result(), city['id'])

if __name__ == '__main__':
  if not os.path.exists(TEMP_PATH):
    os.makedirs(TEMP_PATH)

  if not os.path.exists(DATASET_PATH):
    raise TypeError('Could not find the cities dataset')

  data = pd.read_csv(DATASET_PATH)
  geocode_cities(data)
  data = pd.concat([data, data.apply(read_geocoding_info, axis=1)], axis=1)
  data.to_csv(DATASET_PATH, encoding='utf-8', index=False)
  shutil.rmtree(TEMP_PATH)
