import re
import os
import datetime
import requests
import pandas as pd
import numpy as np
from itertools import chain

BASE_URL = 'http://www1.caixa.gov.br/Simov/'

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, 'data')

DATE = datetime.date.today().strftime('%Y-%m-%d')
FILE_BASE_NAME = '{}-cities.csv'.format(DATE)

session = requests.Session()

STATES = ['AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO',
          'MA', 'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR',
          'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO']

def fetch_cities():
  cities = []
  regex = re.compile(r"<option value='(\d+)'>([^<]+)")
  for state in STATES:
    print('Fetching cities from {}...'.format(state))
    page = session.post(BASE_URL + 'carregaListaCidades.asp', data={'cmb_estado': state})
    results = [(id, name, state) for id, name in regex.findall(page.text)]
    cities.extend(results)
  return cities

def save_to_csv(cities):
  print('Writing file...')
  df = pd.DataFrame(data=cities, columns=['id', 'name', 'state'])
  filepath = os.path.join(DATA_PATH, FILE_BASE_NAME)
  df.to_csv(filepath, index=False)
  print('Done.')

if __name__ == '__main__':
  page = session.get(BASE_URL + 'busca-imovel.asp', params={'sltTipoBusca': 'imoveis'})
  if page.status_code != 200:
    msg = 'Initial request failed with status code {}.'
    raise RuntimeError(msg.format(page.status_code))

  cities = fetch_cities()
  save_to_csv(cities)
