import re
import os
import requests
import datetime
import pandas as pd
from urllib.parse import urljoin
from concurrent import futures
from itertools import chain
from bs4 import BeautifulSoup

BASE_URL = 'https://venda-imoveis.caixa.gov.br/sistema/'

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, 'data')
TEMP_DATASET_PATH = os.path.join(DATA_PATH, 'properties-partial.csv')
DATE = datetime.date.today().strftime('%Y-%m-%d')
CITY_DATASET_PATH = os.path.join(DATA_PATH, '{}-cities.csv'.format(DATE))
PROPERTY_DATASET_PATH = os.path.join(DATA_PATH, '{}-properties.csv'.format(DATE))

session = requests.Session()

def fetch_property_ids(city, state):
  regex = re.compile(r"id='hdnImov\d+' value='([\d|]+)'")
  data = {'hdn_cidade': city, 'hdn_estado': state}
  page = session.post(BASE_URL + 'carregaPesquisaImoveis.asp', data=data)
  for ids in regex.findall(page.text):
    yield from ids.split('||')

def load_temp_dataset():
  if os.path.exists(TEMP_DATASET_PATH):
    return pd.read_csv(TEMP_DATASET_PATH)
  else:
    return pd.DataFrame(columns=['id', 'city_id', 'fetched_at'])

def load_cities():
  if not os.path.exists(CITY_DATASET_PATH):
    raise TypeError('Could not find the cities dataset')
  return pd.read_csv(CITY_DATASET_PATH)

def remaining_cities(properties):
  cities = load_cities()
  is_not_fetched = ~cities['id'].isin(properties['city_id'].unique())
  remaining_cities = [city for idx, city in cities[is_not_fetched].iterrows()]
  return {city['id']: (city['name'], city['state']) for city in remaining_cities}

if __name__ == '__main__':
  page = session.get(BASE_URL + 'busca-imovel.asp', params={'sltTipoBusca': 'imoveis'})
  if page.status_code != 200:
    msg = 'Initial request failed with status code {}.'
    raise RuntimeError(msg.format(url, page.status_code))

  temp_dataset = load_temp_dataset()
  cities_to_fetch = remaining_cities(temp_dataset)
  print('{} cities to be fetched.'.format(len(cities_to_fetch)))

  while len(cities_to_fetch.items()) > 0:
    with futures.ThreadPoolExecutor(max_workers=4) as executor:
      future_to_fetch = dict((executor.submit(fetch_property_ids, city_id, state), city_id)
                            for city_id, (name, state) in cities_to_fetch.items())
      for future in futures.as_completed(future_to_fetch):
        city_id = future_to_fetch[future]
        name, state = cities_to_fetch[city_id]
        if future.exception() is not None:
          print('{} - {} raised an exception: {}'.format(name, state, future.exception()))
        elif future.result() is not None:
          ids = list(future.result())
          print('{} properties found in {} - {}'.format(len(ids), name, state))
          result = pd.DataFrame(data=[dict(id=id, city_id=city_id) for id in ids])
          temp_dataset = pd.concat([temp_dataset, result], sort=False)
          temp_dataset.to_csv(TEMP_DATASET_PATH, encoding='utf-8', index=False)
          cities_to_fetch = remaining_cities(temp_dataset)

  os.rename(TEMP_DATASET_PATH, PROPERTY_DATASET_PATH)
  print('Done.')
