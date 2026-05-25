import { RouterProvider } from 'react-router-dom';

import { UserProvider } from '@/app/contexts/user-context';
import { QueryProvider } from '@/app/providers/query-provider';
import { createStandaloneRouter } from '@/app/router';
import atsKeycloak, { atsKeycloakInitOptions } from '@/app/services/keycloak';

import { ReactKeycloakProvider } from '@react-keycloak/web';

/**
 * Standalone App — rendered only when ats-module runs outside the shell.
 * Wraps with its own ReactKeycloakProvider so auth works in the dev server.
 * In embedded mode the shell's ReactKeycloakProvider covers all routes.
 */
export default function App() {
  return (
    <ReactKeycloakProvider
      authClient={atsKeycloak}
      initOptions={atsKeycloakInitOptions}
    >
      <UserProvider>
        <QueryProvider>
          <RouterProvider router={createStandaloneRouter()} />
        </QueryProvider>
      </UserProvider>
    </ReactKeycloakProvider>
  );
}
