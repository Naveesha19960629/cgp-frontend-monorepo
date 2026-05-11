import { createRoot } from 'react-dom/client';

import App from '@/app/app';
import { initI18n } from '@/app/utils/i18n';

import '@cgp/ui-kit/globals.css';

async function bootstrap() {
  await initI18n();
  createRoot(document.getElementById('root')!).render(<App />);
}

await bootstrap();
