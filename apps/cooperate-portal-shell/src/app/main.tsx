import { createRoot } from 'react-dom/client';

import App from '@/app/app';
import { initI18n } from '@/app/utils/i18n';

import '@cgp/ui-kit/globals.css';

// Mark this as a shell-powered environment so remote modules skip their own bootstrap
window.__POWERED_BY_SHELL__ = true;

async function bootstrap() {
  await initI18n();
  createRoot(document.getElementById('root')!).render(<App />);
}

await bootstrap();
