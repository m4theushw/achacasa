import { BOUNDS_CHANGE, VIEW_MORE_CLICK } from './actions';
import { debounce } from 'lodash';
import { fetchJSON } from './utils';
import { MARKER_CLICK, RESULT_CLICK, CITY_CLICK } from './actions';

class Map {
  constructor() {
    this.markers = {};
    this.infowindow = new google.maps.InfoWindow();
    this.initMap();
    this.centerMapOnUser();

    window.store.on(RESULT_CLICK, ({ payload }) => {
      this.openInfowindow(payload);
    });

    window.store.on(CITY_CLICK, ({ payload }) => {
      this.map.setCenter({ lat: payload.latitude, lng: payload.longitude });
      this.map.setZoom(12);
    });
  }

  initMap = () => {
    this.map = new google.maps.Map(document.getElementById('map'), {
      center: { lat: -30.0346, lng: -51.2177 },
      zoom: 10,
    });
    this.map.addListener('bounds_changed', this.handleBoundsChange);
  };

  centerMapOnUser = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
        const { latitude, longitude } = position.coords;
        this.map.setCenter({ lat: latitude, lng: longitude });
      });
    }
  };

  handleBoundsChange = debounce(() => {
    const bounds = this.map.getBounds();
    window.store.dispatch({ type: BOUNDS_CHANGE, payload: bounds });
    this.loadMarkers(bounds);
  }, 100);

  loadMarkers = async bounds => {
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    const url = '/api/markers/' + sw.toUrlValue() + '/' + ne.toUrlValue();
    const properties = await fetchJSON(url);
    const propertiesNotAddedToMap = properties.filter(
      ({ id }) => !(id in this.markers)
    );
    propertiesNotAddedToMap.forEach(property => {
      this.markers[property.id] = this.createMarker(property);
    });
  };

  createMarker = property => {
    const marker = new google.maps.Marker({
      position: { lat: property.latitude, lng: property.longitude },
      map: this.map,
      title: property.name,
      icon: `/static/img/pin-${property.is_occupied ? 'red' : 'green'}.png`,
    });

    marker.addListener('click', () => {
      this.openInfowindow(property);
      window.store.dispatch({ type: MARKER_CLICK, payload: property });
    });

    return marker;
  };

  openInfowindow = property => {
    const viewMore = () => {
      window.store.dispatch({ type: VIEW_MORE_CLICK, payload: property });
    };

    const content = (
      <div class="infowindow">
        <div class="infowindow-name">{property.name}</div>
        <button class="infowindow-btn" onClick={viewMore}>
          SAIBA MAIS
        </button>
      </div>
    );

    this.infowindow.setContent(content);
    this.infowindow.open(this.map, this.markers[property.id]);
  };
}

export default Map;
