import { RouterProvider } from 'react-router-dom';

import { UserProvider } from '@/app/contexts/user-context';
import { ThemeProvider } from '@/app/providers/theme-provider';
import router from '@/app/router';
import KeycloakInstance, { keycloakInitOptions } from '@/app/services/keycloak';

import { QueryClientProvider, queryClient } from '@cgp/data-access';
import { LandscapeBlocker } from '@cgp/ui-kit/components/landscape-blocker';
import { Toaster } from '@cgp/ui-kit/components/ui/sonner';
import { TooltipProvider } from '@cgp/ui-kit/components/ui/tooltip';
import { ReactKeycloakProvider } from '@react-keycloak/web';

export default function App() {
  return (
    <ReactKeycloakProvider
      authClient={KeycloakInstance}
      initOptions={keycloakInitOptions}
    >
      <UserProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider defaultTheme="light" storageKey="ui-theme">
            <LandscapeBlocker />
            <TooltipProvider>
              <RouterProvider router={router} />
            </TooltipProvider>
          </ThemeProvider>
          <Toaster position="bottom-right" />
        </QueryClientProvider>
      </UserProvider>
    </ReactKeycloakProvider>
  );
}
