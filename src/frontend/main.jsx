import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import { loadFrontendVersion } from './integration/frontendVersion';
import { isPreviewIndexHash, previewInspectionRouteFromHash } from './preview/index/routeHash';
import './styles/index.css';
import './styles/atrium-motion.css';
import './styles/skip-link.css';

const appRoot = document.getElementById('app');
const previewGateRequested =
  isPreviewIndexHash(window.location.hash) || previewInspectionRouteFromHash(window.location.hash) !== null;

async function renderApp() {
  if (previewGateRequested) {
    appRoot.setAttribute('aria-busy', 'true');
    appRoot.setAttribute('aria-label', 'Validating Playground access');
    await loadFrontendVersion().catch(() => undefined);
    appRoot.removeAttribute('aria-busy');
    appRoot.removeAttribute('aria-label');
  }

  createRoot(appRoot).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

void renderApp();
