import { RouterProvider } from 'react-router-dom';

import { UserProvider } from '@/app/contexts/user-context';
import { createStandaloneRouter } from '@/app/router';
import atsKeycloak, { atsKeycloakInitOptions } from '@/app/services/keycloak';

import { QueryClientProvider, queryClient } from '@cgp/data-access';
import { ReactKeycloakProvider } from '@react-keycloak/web';

/**
 * Standalone App — rendered only when ats-module runs outside the shell.
 * Wraps with its own ReactKeycloakProvider so auth works in the dev server.
 * In embedded mode the shell's ReactKeycloakProvider covers all routes.
 */
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ReactKeycloakProvider
        authClient={atsKeycloak}
        initOptions={atsKeycloakInitOptions}
      >
        <UserProvider>
          <RouterProvider router={createStandaloneRouter()} />
        </UserProvider>
      </ReactKeycloakProvider>
    </QueryClientProvider>
  );
}
