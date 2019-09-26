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
DATE = datetime.date.today().strftime('%Y-%m-%d')
IDS_DATASET_PATH = os.path.join(DATA_PATH, '{}-ids.csv'.format(DATE))
PROPERTIES_DATASET_PATH = os.path.join(DATA_PATH, '{}-properties.csv'.format(DATE))

session = requests.Session()

def parse_currency(value):
  return float(value.replace('.', '').replace(',', '.'))

def fetch_property_details(id, city_id):
  page = session.post(BASE_URL + 'detalhe-imovel.asp', data={'hdnimovel': id})
  soup = BeautifulSoup(page.text, 'html.parser')
  details = soup.select('#dadosImovel')[0]
  has_online_sale = details.select('#divContador') is not None
  name = details.find('h5').get_text(strip=True)

  def extract_features():
    result = {}
    features = filter(lambda span: span.a is None and span.br is None, details.find_all('span'))
    for feature in features:
      text = feature.get_text(strip=True).replace('=', ':')
      if ':' in text:
        name, value = [segment.strip() for segment in text.split(':')]
        result[name] = value.replace('m2', '').replace('.', '').replace(',', '.')
    return result

  def extract_values():
    regex = re.compile(r'R\$ (\d{1,3}(?:\.\d{3})*,\d{2})')
    if details.h4:
      return {'sale_value': parse_currency(regex.search(details.h4.get_text()).group(1))}
    values = regex.findall(details.find('p').get_text())
    evaluation_value, minimum_value = map(parse_currency, values)
    return {'evaluation_value': evaluation_value, 'minimum_value': minimum_value}

  def extract_attachments():
    regex = re.compile(r"javascript:ExibeDoc\('([^']*)'\)")
    for link in related_box.find_all('a'):
      yield urljoin(BASE_URL, regex.match(link['onclick']).group(1))

  def extract_photos():
    gallery = soup.select('#galeria-imagens')[0]
    for image in gallery.find_all('img'):
      yield urljoin(BASE_URL, image['src'])

  related_box = details.select('.related-box')[0]
  address = related_box.p.get_text().replace('Endereço:', '')

  description = related_box.find_all('p')[1].get_text(strip=True).replace('Descrição:', '')
  description = re.sub(r'\s+', ' ', description)
  description = re.sub(r'\s+,', ',', description)
  description = re.sub(r'^.', '', description)
  description = description.strip()

  result = dict(name=name, address=address, description=description, city_id=city_id)
  result.update(extract_features())
  result.update(extract_values())

  attachments = extract_attachments()
  photos = extract_photos()
  return dict(details=result, attachments=attachments, photos=photos)

def transform_and_translate_data(properties):
  ids = [id for id, row in properties.items()]
  df = pd.DataFrame(data=[property['details'] for id, property in properties.items()], index=ids)

  df = df.rename(columns={
    'Tipo de imóvel': 'type',
    'Quartos': 'bedrooms',
    'Área privativa': 'private_area',
    'Área do terreno': 'site_area',
    'Área total': 'total_area',
    'Edital': 'document',
    'Número do item': 'item_number',
    'Garagem': 'garage',
  })

  df['is_occupied'] = df['Situação'] == 'Ocupado'

  attachments = [property['attachments'] for id, property in properties.items()]
  attachments_df = pd.DataFrame(data=attachments, index=ids)
  attachments_df = attachments_df.rename(lambda idx: 'attachment_%i' % idx, axis=1)

  photos = [property['photos'] for id, property in properties.items()]
  photos_df = pd.DataFrame(data=photos, index=ids)
  photos_df = photos_df.rename(lambda idx: 'photo_%i' % idx, axis=1)

  datasets = [df.drop(['Situação'], axis=1), attachments_df, photos_df]
  return pd.concat(datasets, sort=False, axis=1)

def remaining_properties(ids, properties, properties_not_saved):
  for item in ids.drop(properties.index).itertuples():
    if item.Index not in properties_not_saved:
      yield item.Index, item.city_id

def load_properties():
  if os.path.exists(PROPERTIES_DATASET_PATH):
    return pd.read_csv(PROPERTIES_DATASET_PATH, index_col=('id',))
  else:
    return pd.DataFrame()

if __name__ == '__main__':
  page = session.get(BASE_URL + 'busca-imovel.asp', params={'sltTipoBusca': 'imoveis'})
  if page.status_code != 200:
    msg = 'Initial request failed with status code {}.'
    raise RuntimeError(msg.format(url, page.status_code))

  if not os.path.exists(IDS_DATASET_PATH):
    raise TypeError('Could not find the ids dataset.')

  ids = pd.read_csv(IDS_DATASET_PATH, index_col=('id',))
  properties = load_properties()
  properties_not_saved = dict()
  properties_to_fetch = list(remaining_properties(ids, properties, properties_not_saved))

  while len(properties_to_fetch) > 0:
    print('{} properties to fetch'.format(len(properties_to_fetch)))
    with futures.ThreadPoolExecutor(max_workers=4) as executor:
      future_to_fetch = dict((executor.submit(fetch_property_details, id, city_id), id)
                            for id, city_id in properties_to_fetch)
      for future in futures.as_completed(future_to_fetch):
        id = future_to_fetch[future]
        if future.exception() is not None:
          print('{} raised an exception: {}'.format(id, future.exception()))
        elif future.result() is not None:
          properties_not_saved[id] = future.result()
          if len(properties_not_saved) == 10:
            print('Saving information already fetched. {0} records'.format(len(properties_not_saved)))
            result_translated = transform_and_translate_data(properties_not_saved)
            properties = pd.concat([properties, result_translated], sort=False)
            properties.to_csv(PROPERTIES_DATASET_PATH, index_label='id')
            properties_not_saved = dict()
            properties_to_fetch = list(remaining_properties(ids, properties, properties_not_saved))
    
    if len(properties_not_saved) > 0:
      print('Saving remaining properties. {0} records'.format(len(properties_not_saved)))
      result_translated = transform_and_translate_data(properties_not_saved)
      properties = pd.concat([properties, result_translated], sort=False)
      properties.to_csv(PROPERTIES_DATASET_PATH, index_label='id')
      properties_not_saved = dict()
      properties_to_fetch = list(remaining_properties(ids, properties, properties_not_saved))
