import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App'; // ✅ make sure this points to App.js
import { AuthProvider } from './auth/AuthProvider';
import reportWebVitals from './reportWebVitals';

console.log("[index.js] Starting app...");

const rootElement = document.getElementById('root');
console.log("[index.js] Root element:", rootElement);

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);

console.log("[index.js] App rendered");

reportWebVitals((metric) => {
  console.log("[index.js] Web Vital metric:", metric);
});
