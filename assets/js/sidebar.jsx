class Sidebar {
  constructor(element, windowMock) {
    this.element = element
    this.window = windowMock || window
    this.properties = []

    this.window.onresize = () => {
      if (this.window.innerWidth > 400) {
        this.open()
      }
    }

    if (this.window.innerWidth > 400) {
      this.element.classList.add('sidebar-open')
      this.element.style.display = 'block'
    } else {
      this.element.style.display = 'none'
    }
  }

  open = () => {
    this.element.style.display = 'block'

    setTimeout(() => {
      this.element.classList.add('sidebar-open')
    })
  }

  close = () => {
    this.element.classList.remove('sidebar-open')

    setTimeout(() => {
      this.element.style.display = 'none'
    }, 200)
  }

  onResultClick = fn => {
    this.handleResultClick = fn
  }

  onBackClick = fn => {
    this.handleBackClick = fn
  }

  onCaixaClick = fn => {
    this.handleCaixaClick = fn
  }

  setProperties = properties => {
    this.properties = properties
  }

  showResults() {
    const numberOfProperties = this.properties.length

    if (numberOfProperties > 0) {
      const text =
        numberOfProperties === 1
          ? '1 imóvel encontrado'
          : `${numberOfProperties} imóveis encontrados`

      render(
        this.element,
        <div class="sidebar-inner">
          <div class="sidebar-content">
            <div class="sidebar-header">{text}</div>
            <ul class="results">{this.properties.map(this.renderResult)}</ul>
          </div>
        </div>
      )
    } else {
      const text = 'Nenhum imóvel encontrado nesta área.'
      render(
        this.element,
        <div class="sidebar-inner">
          <div class="sidebar-content">
            <p class="empty-state">{text}</p>
          </div>
        </div>
      )
    }
  }

  renderResult = property => {
    const thumb = property.thumb
      ? `background-image: url(${property.thumb});`
      : ''

    const statusClass = property.is_occupied ? 'occupied' : 'unoccupied'
    const statusText = property.is_occupied ? 'OCUPADO' : 'DESOCUPADO'

    let value = property.sale_value
    if (property.evaluation_value) value = property.evaluation_value
    if (property.minimum_value) value = property.minimum_value

    return (
      <li
        class={`results-item results-item-${statusClass}`}
        onClick={() => this.handleResultClick(property.slug)}
      >
        <div class="results-item-thumb" style={thumb}>
          <div class="results-item-status">{statusText}</div>
        </div>
        <div class="results-item-body">
          <div class="results-item-name">{property.name}</div>
          <div class="results-item-subline">{`${property.type}  ∙ ${
            property.city
          }`}</div>
          <div class="results-item-value">{currencyMask(value)}</div>
        </div>
      </li>
    )
  }

  showDetail = property => {
    render(this.element, this.renderDetail(property))
  }

  renderFeature = (label, value, mask) =>
    value ? (
      <li class="detail-feature">
        <span class="detail-feature-label">{label}</span>
        <span class="detail-feature-spacer" />
        <span class="detail-feature-value">
          {typeof mask === 'function' ? mask(value) : value}
        </span>
      </li>
    ) : null

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
    ) : null

  renderAttachments = attachments =>
    attachments.length ? (
      <div class="detail-attachments">
        {attachments.map(attachment => {
          const type =
            attachment.indexOf('matricula') > 0 ? 'matrícula' : 'edital'
          const text = `Baixar ${type} do imóvel`
          return (
            <a class="btn" href={attachment}>
              {text}
            </a>
          )
        })}
      </div>
    ) : null

  renderDetail = property => {
    const statusText = property.is_occupied ? 'Ocupado' : 'Desocupado'

    const googleMapsUrl =
      'https://www.google.com/maps/search/?api=1&query=' +
      encodeURIComponent(property.address)

    return (
      <div class="sidebar-inner">
        <div class="sidebar-content">
          <div class="sidebar-header">
            <button
              type="button"
              onClick={this.handleBackClick}
              class="btn btn-primary"
            >
              Voltar aos resultados
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
                  currencyMask
                )}
                {this.renderFeature(
                  'Valor mínimo de venda',
                  property.minimum_value,
                  currencyMask
                )}
                {this.renderFeature(
                  'Valor de venda',
                  property.sale_value,
                  currencyMask
                )}
                {this.renderFeature(
                  'Área privativa',
                  property.private_area,
                  areaMask
                )}
                {this.renderFeature(
                  'Área do terreno',
                  property.site_area,
                  areaMask
                )}
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
                onClick={() => this.handleCaixaClick(property)}
              >
                Abrir no site da CAIXA
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  showLoader = () => {
    const overlay = this.element.querySelector('.overlay')
    const inner = this.element.querySelector('.sidebar-inner')

    if (!overlay) {
      inner.appendChild(
        <div class="overlay">
          <div class="loader">Carregando...</div>
        </div>
      )
    }
  }

  hideLoader = () => {
    const sidebarInner = this.element.querySelector('.sidebar-inner')
    const overlay = sidebarInner.querySelector('.overlay')

    if (overlay) {
      sidebarInner.removeChild(overlay)
    }
  }
}
