import { RouterProvider } from 'react-router-dom';

import { ThemeProvider } from '@/app/providers/theme-provider';
import router from '@/app/router';

import { QueryClientProvider, queryClient } from '@cgp/data-access';
import { LandscapeBlocker } from '@cgp/ui-kit/components/landscape-blocker';
import { Toaster } from '@cgp/ui-kit/components/ui/sonner';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="ui-theme">
        <LandscapeBlocker />
        <RouterProvider router={router} />
      </ThemeProvider>
      <Toaster position="bottom-right" />
    </QueryClientProvider>
  );
}

export default App;
