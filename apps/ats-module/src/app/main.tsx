import { createRoot } from 'react-dom/client';

import App from '@/app/app.jsx';

import '@cgp/ui-kit/globals.css';

const standalone = !window.__POWERED_BY_SHELL__;

if (standalone) {
  createRoot(document.getElementById('root')!).render(<App />);
}
