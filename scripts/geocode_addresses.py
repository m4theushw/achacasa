import os
import re
import pickle
import datetime
import pandas as pd
from concurrent import futures
from geopy.geocoders import GoogleV3
from geopy.exc import GeocoderTimedOut
from decouple import config

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, 'data')
TEMP_PATH = os.path.join(DATA_PATH, 'properties')
DATE = datetime.date.today().strftime('%Y-%m-%d')
PROPERTY_DATASET_PATH = os.path.join(DATA_PATH, '{}-properties.csv'.format(DATE))
CITY_DATASET_PATH = os.path.join(DATA_PATH, '{}-cities.csv'.format(DATE))
STATES = ['RS']

geolocator = GoogleV3(config('GEOCODE_API_KEY'))

def geocode_property(property):
  try:
    location = geolocator.geocode(property['address'])
  except GeocoderTimedOut as e:
    print('Timeout')
    return None
  return location

def write_geocoding_info(property_location, id):
  print('Writing {}'.format(id))
  with open('{}/{}.pkl'.format(TEMP_PATH, id), 'wb') as f:
    pickle.dump(property_location, f, pickle.HIGHEST_PROTOCOL)

def read_geocoding_info(property):
  filename = '{}/{}.pkl'.format(TEMP_PATH, property['id'])
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

def geocode_properties(properties):
  with futures.ThreadPoolExecutor(max_workers=1) as executor:
    print('{} properties to geocode'.format(len(properties)))
    future_to_geocoding = dict((executor.submit(geocode_property, property), property)
                              for index, property in properties.iterrows())
    for future in futures.as_completed(future_to_geocoding):
      property = future_to_geocoding[future]
      if future.exception() is not None:
        print('{} raised an exception: {}'.format(property['id'], future.exception()))
      elif future.result() is not None:
        write_geocoding_info(future.result(), property['id'])

def remaining_properties(properties):
  properties_geocoded = [file[:-4] for file in os.listdir(TEMP_PATH)]
  is_not_geocoded = ~properties['id'].isin(properties_geocoded)
  return properties[is_not_geocoded]

if __name__ == '__main__':
  if not os.path.exists(TEMP_PATH):
    os.makedirs(TEMP_PATH)

  if not os.path.exists(PROPERTY_DATASET_PATH):
    raise TypeError('Could not find the properties dataset')

  if not os.path.exists(CITY_DATASET_PATH):
    raise TypeError('Could not find the cities dataset')

  cities = pd.read_csv(CITY_DATASET_PATH, index_col='id')
  properties = pd.read_csv(PROPERTY_DATASET_PATH)
  properties = properties.drop(['latitude', 'longitude'], axis=1, errors='ignore')
  properties['state'] = cities.loc[properties['city_id']]['state'].values

  properties_filtered = properties[properties['state'].isin(STATES)]
  properties_to_geocode = remaining_properties(properties_filtered)
  geocode_properties(properties_to_geocode)

  properties = pd.concat([properties, properties.apply(read_geocoding_info, axis=1)], axis=1)
  properties = properties.drop(['state'], axis=1)
  properties.to_csv(PROPERTY_DATASET_PATH, encoding='utf-8', index=False)
