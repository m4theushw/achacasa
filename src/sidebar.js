import { fetchJSON } from './utils';
import { currency, area } from './masks';
import { render } from './utils';

class Sidebar {
  constructor() {
    this.element = document.getElementById('sidebar');

    window.store.subscribe(action => {
      if (action.type === 'BOUNDS_CHANGE') {
        this.fetchAndRenderItems();
      }
    });
  }

  fetchAndRenderItems = async () => {
    const { bounds } = window.store.state;
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();

    const url = '/api/properties/' + sw.toUrlValue() + '/' + ne.toUrlValue();
    this.page = await fetchJSON(url);
    this.renderResults();
  };

  renderResults = () => {
    const { results, next, previous } = this.page;

    render(
      this.element,
      results.length ? (
        <div>
          <ul class="results">{results.map(this.renderResult)}</ul>
          <div class="sidebar-footer">
            <button
              class="sidebar-footer-arrow"
              type="button"
              alt="Anterior"
              disabled={!previous}
              onClick={this.prevPage}
            >
              <i class="fas fa-chevron-left" />
            </button>
            <button
              class="sidebar-footer-arrow"
              type="button"
              alt="Próxima"
              disabled={!next}
              onClick={this.nextPage}
            >
              <i class="fas fa-chevron-right" />
            </button>
          </div>
        </div>
      ) : (
        <p class="empty-state">Nenhum imóvel encontrado nesta área.</p>
      )
    );
  };

  renderResult = property => {
    const statusClass = property.is_occupied ? 'occupied' : 'unoccupied';
    const statusText = property.is_occupied ? 'OCUPADO' : 'DESOCUPADO';

    let value = property.sale_value;
    if (property.evaluation_value) value = property.evaluation_value;
    if (property.minimum_value) value = property.minimum_value;

    return (
      <li class="results-item" onClick={() => this.showDetail(property.id)}>
        <span class={`results-item-status ${statusClass}`}>{statusText}</span>
        <div class="results-item-name">{property.name}</div>
        <div class="results-item-subline">{`${property.type} ∙ ${
          property.city
        }`}</div>
        <div class="results-item-value">{currency(value)}</div>
      </li>
    );
  };

  prevPage = async () => {
    this.page = await fetchJSON(this.page.previous);
    this.renderResults();
  };

  nextPage = async () => {
    this.page = await fetchJSON(this.page.next);
    this.renderResults();
  };

  back = () => {
    this.renderResults();
  };

  showDetail = async id => {
    const property = await fetchJSON(`/api/properties/${id}`);
    render(this.element, this.renderDetail(property));
  };

  renderDetail = property => {
    const statusText = property.is_occupied ? 'Ocupado' : 'Desocupado';

    const googleMapsUrl =
      'https://www.google.com/maps/search/?api=1&query=' +
      encodeURIComponent(property.address);

    return (
      <div>
        <div class="sidebar-header">
          <button type="button" onClick={this.back}>
            <i class="fas fa-chevron-left" /> Voltar
          </button>
        </div>
        <div class="detail">
          <div class="detail-header">
            <h1 class="detail-header-name">{property.name}</h1>
            <div class="detail-header-subline">{`${property.type} ∙ ${
              property.city
            } ∙ ${statusText}`}</div>
          </div>
          <div class="detail-body">
            <p>{property.description}</p>
            <ul class="detail-features">
              {this.renderFeature(
                'Valor de avaliação',
                property.evaluation_value,
                currency
              )}
              {this.renderFeature(
                'Valor mínimo de venda',
                property.minimum_value,
                currency
              )}
              {this.renderFeature(
                'Valor de venda',
                property.sale_value,
                currency
              )}
              {this.renderFeature(
                'Área privativa',
                property.private_area,
                area
              )}
              {this.renderFeature('Área do terreno', property.site_area, area)}
              {this.renderFeature('Quartos', property.bedrooms)}
            </ul>
            {this.renderPhotos(property.photos)}
            {this.renderAttachments(property.attachments)}
            <a href={googleMapsUrl} class="btn btn-primary" target="_blank">
              Abrir no Google Maps
            </a>
            <button
              type="button"
              class="btn btn-accent"
              id="btn-caixa"
              onClick={() => this.openCaixaWebsite(property.id)}
            >
              Abrir no site da CAIXA
            </button>
          </div>
        </div>
      </div>
    );
  };

  renderFeature = (label, value, mask) =>
    value ? (
      <li class="detail-feature">
        <span class="detail-feature-label">{label}</span>
        <span class="detail-feature-spacer" />
        <span class="detail-feature-value">
          {typeof mask === 'function' ? mask(value) : value}
        </span>
      </li>
    ) : null;

  renderPhotos = photos =>
    photos.length ? (
      <div class="detail-photos">
        <h2>Fotos</h2>
        <ul>
          {photos.map(photo => (
            <li class="detail-photo">
              <a
                href={photo}
                style={`background-image: url(${photo});`}
                target="_blank"
              />
            </li>
          ))}
        </ul>
      </div>
    ) : null;

  renderAttachments = attachments =>
    attachments.length ? (
      <div class="detail-attachments">
        {attachments.map(attachment => {
          const type =
            attachment.indexOf('matricula') > 0 ? 'matrícula' : 'edital';
          const text = `Baixar ${type} do imóvel`;
          return (
            <a class="btn" href={attachment}>
              {text}
            </a>
          );
        })}
      </div>
    ) : null;

  openCaixaWebsite = id => {
    const iframe = document.createElement('iframe');
    iframe.src =
      'https://www1.caixa.gov.br/Simov/busca-imovel.asp?sltTipoBusca=imoveis';
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    const form = document.createElement('form');
    form.action = 'https://www1.caixa.gov.br/Simov/detalhe-imovel.asp';
    form.method = 'POST';
    form.target = '_blank';

    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'hdnimovel';
    input.value = id;
    form.appendChild(input);

    document.body.appendChild(form);
    form.submit();

    document.body.removeChild(form);
    document.body.removeChild(iframe);
  };
}

export default Sidebar;
