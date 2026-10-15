import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { adoptGymFromUrl } from './shared/api/signageClient';
import './index.css';

// Adopt a `?gym=` from the URL (e.g. a TV link) before anything connects.
adoptGymFromUrl();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
