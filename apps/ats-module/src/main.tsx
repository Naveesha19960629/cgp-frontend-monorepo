import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from '@/app.tsx';

import '@cgp/ui-kit/globals.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
