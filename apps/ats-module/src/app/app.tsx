import { NuqsAdapter } from 'nuqs/adapters/react-router/v7';

import { RouterProvider } from 'react-router-dom';

import { UserProvider } from '@/app/contexts/user-context';
import { QueryProvider } from '@/app/providers/query-provider';
import { createStandaloneRouter } from '@/app/router';
import atsKeycloak, { atsKeycloakInitOptions } from '@/app/services/keycloak';

import { Toaster } from '@cgp/ui-kit/components/ui/sonner';
import { TooltipProvider } from '@cgp/ui-kit/components/ui/tooltip';
import { ReactKeycloakProvider } from '@react-keycloak/web';

/**
 * Standalone App — rendered only when ats-module runs outside the shell.
 * Wraps with its own ReactKeycloakProvider so auth works in the dev server.
 * In embedded mode the shell's ReactKeycloakProvider covers all routes.
 */
export default function App() {
  return (
    <QueryProvider>
      <ReactKeycloakProvider
        authClient={atsKeycloak}
        initOptions={atsKeycloakInitOptions}
      >
        <UserProvider>
          <TooltipProvider>
            <NuqsAdapter>
              <RouterProvider router={createStandaloneRouter()} />
            </NuqsAdapter>
          </TooltipProvider>
        </UserProvider>
      </ReactKeycloakProvider>
      <Toaster position="bottom-right" />
    </QueryProvider>
  );
}
