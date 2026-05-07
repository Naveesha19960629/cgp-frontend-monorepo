import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from '@/App.tsx';
import { ThemeProvider } from '@/components/theme-provider.tsx';

import { TooltipProvider } from '@cgp/ui-kit/components/ui/tooltip';
import '@cgp/ui-kit/globals.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <TooltipProvider>
        <App />
      </TooltipProvider>
    </ThemeProvider>
  </StrictMode>
);
