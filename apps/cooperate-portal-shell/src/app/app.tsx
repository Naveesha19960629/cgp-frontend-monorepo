import { RouterProvider } from 'react-router-dom';

import { ThemeProvider } from '@/app/providers/theme-provider';
import router from '@/app/router';

import { QueryClientProvider, queryClient } from '@cgp/data-access';
import { LandscapeBlocker } from '@cgp/ui-kit/components/landscape-blocker';
import { Toaster } from '@cgp/ui-kit/components/ui/sonner';
import { TooltipProvider } from '@cgp/ui-kit/components/ui/tooltip';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="ui-theme">
        <LandscapeBlocker />
        <TooltipProvider>
          <RouterProvider router={router} />
        </TooltipProvider>
      </ThemeProvider>
      <Toaster position="bottom-right" />
    </QueryClientProvider>
  );
}

export default App;
