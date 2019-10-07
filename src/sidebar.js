import { fetchJSON } from './utils';
import { currency } from './masks';
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
    const { results } = this.page;

    render(
      this.element,
      <div class="sidebar-inner">
        <div class="sidebar-content">
          {results.length ? (
            <ul class="results">{results.map(this.renderResult)}</ul>
          ) : (
            <p class="empty-state">Nenhum imóvel encontrado nesta área.</p>
          )}
        </div>
      </div>
    );
  };

  renderResult = property => {
    const statusClass = property.is_occupied ? 'occupied' : 'unoccupied';
    const statusText = property.is_occupied ? 'OCUPADO' : 'DESOCUPADO';

    let value = property.sale_value;
    if (property.evaluation_value) value = property.evaluation_value;
    if (property.minimum_value) value = property.minimum_value;

    return (
      <li class="results-item">
        <span class={`results-item-status ${statusClass}`}>{statusText}</span>
        <div class="results-item-name">{property.name}</div>
        <div class="results-item-subline">{`${property.type} ∙ ${property.city}`}</div>
        <div class="results-item-value">{currency(value)}</div>
      </li>
    );
  };
}

export default Sidebar;
