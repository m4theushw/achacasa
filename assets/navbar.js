import { CITY_CLICK, FILTER_CHANGE } from './actions';
import Autocomplete from './autocomplete';

class Navbar {
  constructor() {
    this.element = document.getElementById('navbar');
    this.vacantIsChecked = false;

    this.initEvents();
    this.initAutocomplete();
  }

  initEvents = () => {
    const typeInput = document.getElementById('type');
    const vacantCheckBox = document.getElementById('vacant');

    typeInput.addEventListener('change', event => {
      this.type = event.target.value;
      this.notifyFormChange();
    });

    vacantCheckBox.addEventListener('click', () => {
      this.vacantIsChecked = !this.vacantIsChecked;
      this.notifyFormChange();
    });
  };

  notifyFormChange = () => {
    window.store.dispatch({
      type: FILTER_CHANGE,
      payload: { type: this.type, vacant: this.vacantIsChecked },
    });
  };

  url = text => {
    const textNormalized = text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    return '/api/cities?search=' + textNormalized;
  };

  initAutocomplete = () => {
    new Autocomplete(document.getElementById('city'), {
      url: this.url,
      onSelect: city => {
        window.store.dispatch({ type: CITY_CLICK, payload: city });
      },
    });
  };
}

export default Navbar;
