import 'core-js/stable';
import 'regenerator-runtime/runtime';

import Map from './map';
import Sidebar from './sidebar';
import Store from './store';
import { jsxToDom } from './utils';
import reducer from './reducer';
import { TOGGLE_SIDEBAR } from './actions';
import './styles.css';
import './fontawesome.css';

window.jsxToDom = jsxToDom;

window.store = new Store(reducer);

function initApp() {
  const toggle = document.getElementById('toggle');
  toggle.addEventListener('click', () => {
    window.store.dispatch({ type: TOGGLE_SIDEBAR });
  });

  new Map();
  new Sidebar();
}

google.maps.event.addDomListener(window, 'load', initApp);
