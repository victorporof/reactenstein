import React from 'react';
import ReactDOM from '../../../';

import DBMon from './app';

const rootEl = document.getElementById('dbmon');
const render = () => {
  ReactDOM.render(<DBMon />, rootEl);
};

render();
