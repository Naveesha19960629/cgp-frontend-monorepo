import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';

import { createStandaloneRouter } from '@/router';

import '@cgp/ui-kit/globals.css';

const standalone = !window.__POWERED_BY_SHELL__;

if (standalone) {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <RouterProvider router={createStandaloneRouter()} />
    </StrictMode>
  );
}
