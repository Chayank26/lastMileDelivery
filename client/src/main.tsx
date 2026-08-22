/**
 * React Application Entrypoint
 * ----------------------------
 * Mounts the root React component into the HTML DOM container.
 * Configures React StrictMode for development quality checks.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
