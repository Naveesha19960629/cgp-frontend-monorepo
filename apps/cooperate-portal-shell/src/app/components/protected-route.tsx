import { Outlet } from 'react-router-dom';

import ErrorPage from '@/app/pages/error-page';
import LoadingPage from '@/app/pages/loading-page';

import { useKeycloak } from '@react-keycloak/web';

/**
 * Route layout guard — wraps protected sections of the router.
 *
 * Behaviour:
 * - Keycloak not yet initialized → show loading spinner
 * - Keycloak initialized but user not authenticated →
 *     trigger PKCE login flow redirecting back to /auth/login
 * - Any error during initialization → show ErrorPage
 * - Authenticated → render child routes via <Outlet>
 */
export default function ProtectedRoute() {
  const { keycloak, initialized } = useKeycloak();
  const isAuthenticated = initialized && keycloak.authenticated === true;

  if (!initialized) {
    return <LoadingPage />;
  }

  if (!isAuthenticated) {
    void keycloak.login({
      redirectUri: `${window.location.origin}/auth/login`,
    });
    return <LoadingPage />;
  }

  if (keycloak.authServerUrl && !keycloak.realm) {
    return <ErrorPage />;
  }

  return <Outlet />;
}
