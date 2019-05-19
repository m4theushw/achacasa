class App {
  constructor() {
    this.markers = {}
    this.properties = []
    this.filteredProperties = []
    this.availableIsSelected = false
    this.selectedType = null
    this.infowindow = new google.maps.InfoWindow()
    this.isDetailOpen = false

    this.initSidebar()
    this.initAutocomplete()
    this.initNavbar()
    this.initMap()
    this.showDetailIfNeeded()

    window.addEventListener('popstate', this.handleStateChange)
  }

  initNavbar = () => {
    const typeInput = document.getElementById('type')
    const unoccupiedCheckBox = document.getElementById('unoccupied')

    typeInput.addEventListener('change', event => {
      this.selectedType = event.target.value
      this.updateProperties()
    })

    unoccupiedCheckBox.addEventListener('click', () => {
      this.availableIsSelected = !this.availableIsSelected
      this.updateProperties()
    })
  }

  updateProperties = () => {
    this.removeAllMarkers()
    this.updateFilteredProperties()
    this.sidebar.showResults(this.filteredProperties)
    this.addMarkersToMap()
  }

  showDetailIfNeeded = () => {
    const currentURL = document.location.pathname
    const matches = currentURL.match(/^\/([^\/]+)$/)

    if (matches) {
      this.showDetails(matches[1])
    }
  }

  handleStateChange = () => {
    const currentURL = document.location.pathname
    const matches = currentURL.match(/^\/([^\/]+)$/)

    if (matches) {
      this.showDetails(matches[1])
    } else {
      this.navigateToResults()
    }
  }

  initAutocomplete = () => {
    new Autocomplete(document.getElementById('city'), {
      url: text => {
        const textNormalized = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        return '/api/cities?search=' + textNormalized
      },
      onSelect: city => {
        this.map.setCenter({ lat: city.latitude, lng: city.longitude })
        this.map.setZoom(12);
      }
    })
  }

  initSidebar = () => {
    const sidebarEl = document.getElementById('sidebar')

    this.sidebar = new Sidebar(sidebarEl)
    this.sidebar.onResultClick(this.showDetails)
    this.sidebar.onBackClick(this.handleBackClick)
    this.sidebar.onCaixaClick(this.openCaixaSite)

    const toggleEl = document.getElementById('toggle')
    toggleEl.addEventListener('click', () => {
      this.sidebar.open()
    })

    document.body.addEventListener('click', e => {
      const sidebarIsOpen = sidebarEl.classList.contains('sidebar-open')
      const sidebarInner = sidebarEl.querySelector('.sidebar-inner')
      if (e.clientX > sidebarInner.clientWidth && sidebarIsOpen && window.innerWidth < 400) {
        this.sidebar.close()
      }
    })
  }

  initMap = () => {
    this.map = new google.maps.Map(document.getElementById('map'), {
      center: { lat: -30.0346, lng: -51.2177 },
      zoom: 10
    })

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
        const { latitude, longitude } = position.coords
        this.map.setCenter({ lat: latitude, lng: longitude })
      })
    }

    this.map.addListener('bounds_changed', this.handleMapChange)
    this.map.addListener('zoom_changed', this.handleMapChange)
  }

  handleMapChange = () => {
    if (!this.oldCenter) {
      this.loadProperties()
      return
    }

    const distance = google.maps.geometry.spherical
      .computeDistanceBetween(this.oldCenter, this.map.getCenter())

    const distanceInKm = distance / 1000

    if (distanceInKm > 6 && this.map.getZoom() > 6) {
      this.loadProperties()
    }
  }

  updateFilteredProperties = () => {
    this.filteredProperties = this.properties.filter(property => {
      if (this.selectedType && property.type !== this.selectedType) return false
      if (this.availableIsSelected && property.is_occupied) return false
      return true
    })
  }

  loadProperties = () => {
    const bounds = this.map.getBounds()
    const ne = bounds.getNorthEast()
    const sw = bounds.getSouthWest()
    const url = '/api/properties/' + sw.toUrlValue() + '/' + ne.toUrlValue()

    fetchJSON(url).then(properties => {
      this.properties = properties
      this.updateFilteredProperties()
      this.addMarkersToMap()

      if (!this.isDetailOpen) {
        this.sidebar.showResults(this.filteredProperties)
      }
    })

    this.oldCenter = this.map.getCenter()
  }

  createMarker = property => {
    const marker = new google.maps.Marker({
      position: { lat: property.latitude, lng: property.longitude },
      map: this.map,
      title: property.name,
      icon: `/static/img/pin-${property.is_occupied ? 'red' : 'green'}.png`
    })

    marker.addListener('click', () => {
      this.showDetails(property.slug);
    });

    return marker
  }

  addMarkersToMap = () => {
    const propertiesNotAddedToMap = this.filteredProperties
      .filter(property => !this.markers.hasOwnProperty(property.id))

    propertiesNotAddedToMap.forEach(property => {
      this.markers[property.id] = this.createMarker(property)
    })
  }

  handleBackClick = () => {
    history.pushState(null, null, '/')
    this.navigateToResults()
  }

  navigateToResults = () => {
    this.infowindow.close()
    this.isDetailOpen = false
    this.sidebar.showResults(this.filteredProperties)
  }

  showDetails = slug => {
    const id = slug.match(/(\d+)/)[1]

    this.isDetailOpen = true
    this.sidebar.showLoader()

    const currentURL = document.location.pathname
    const matches = currentURL.match(/\/?([^\/]+)/)
    if (!matches || matches[1] !== slug) {
      history.pushState(null, null, slug)
    }

    fetchJSON('/api/properties/' + id).then(property => {
      if (!this.markers.hasOwnProperty(property.id)) {
        this.markers[property.id] = this.createMarker(property)
      }

      const infowindow = (
        <div class="infowindow">
          <div class="infowindow-name">{property.name}</div>
          <button class="infowindow-btn" onClick={this.sidebar.open}>Saiba mais</button>
        </div>
      )

      this.infowindow.setContent(infowindow)
      this.infowindow.open(this.map, this.markers[id])
      this.sidebar.showDetails(property)
    })
  }

  openCaixaSite = property => {
    this.sidebar.showLoader()

    const iframe = document.createElement('iframe')
    iframe.src = 'https://www1.caixa.gov.br/Simov/busca-imovel.asp?sltTipoBusca=imoveis'
    iframe.style.display = 'none'
    document.body.appendChild(iframe)

    const form = document.createElement('form')
    form.action = 'https://www1.caixa.gov.br/Simov/detalhe-imovel.asp'
    form.method = 'POST'
    form.target = '_blank'

    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = 'hdnimovel'
    input.value = property.id
    form.appendChild(input)

    setTimeout(this.sidebar.hideLoader, 1000)

    iframe.addEventListener('load', () => {
      document.body.appendChild(form)
      form.submit()
      document.body.removeChild(form)
      document.body.removeChild(iframe)
    })
  }

  removeAllMarkers = () => {
    for (let propertyId in this.markers) {
      this.markers[propertyId].setMap(null)
    }
    this.markers = {}
  }
}

google.maps.event.addDomListener(window, 'load', () => new App)
