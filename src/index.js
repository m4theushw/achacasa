import 'core-js/stable';
import 'regenerator-runtime/runtime';

import Map from './map';
import Sidebar from './sidebar';
import Store from './store';
import { jsxToDom } from './utils';
import reducer from './reducer';
import './styles.css';
import './fontawesome.css';

window.jsxToDom = jsxToDom;

window.store = new Store(reducer);

function initApp() {
  new Map();
  new Sidebar();
}

google.maps.event.addDomListener(window, 'load', initApp);
