import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from '@/app/app';
import { ThemeProvider } from '@/components/theme-provider.tsx';

import { QueryClientProvider, queryClient } from '@cgp/data-access';
import { TooltipProvider } from '@cgp/ui-kit/components/ui/tooltip';
import '@cgp/ui-kit/globals.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <App />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>
);
