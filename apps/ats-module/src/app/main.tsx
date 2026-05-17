import { createRoot } from 'react-dom/client';

import App from '@/app/app.jsx';
import { initAtsI18n } from '@/app/utils/i18n';

import '@cgp/ui-kit/globals.css';

const standalone = !window.__POWERED_BY_SHELL__;

if (standalone) {
  await initAtsI18n();
  createRoot(document.getElementById('root')!).render(<App />);
}
