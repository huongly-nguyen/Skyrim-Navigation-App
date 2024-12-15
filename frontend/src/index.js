import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { initKeycloak } from './components/Authentification/keycloak';

initKeycloak().then(() => {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
