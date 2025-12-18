
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log("[Nature Nani] Initializing application...");

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("[Nature Nani] Failed to find root element.");
} else {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log("[Nature Nani] App mounted.");
}
