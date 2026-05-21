import { Outlet } from 'react-router-dom';

import { useKeycloak } from '@react-keycloak/web';

/**
 * Route guard for the standalone ATS dev server.
 * - Not yet initialized → render nothing (Keycloak is still bootstrapping)
 * - Initialized but not authenticated → redirect to Keycloak login
 * - Authenticated → render child routes via <Outlet>
 *
 * In embedded mode the shell's ProtectedRoute handles the guard;
 * this component is only used by createStandaloneRouter.
 */
export default function AtsProtectedRoute() {
  const { keycloak, initialized } = useKeycloak();

  if (!initialized) return null;

  if (!keycloak.authenticated) {
    void keycloak.login({
      redirectUri: `${window.location.origin}/dashboard/ats`,
    });
    return null;
  }

  return <Outlet />;
}
