import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useUser } from '@/app/contexts/user-context';
import LoadingPage from '@/app/pages/loading-page';

import { useKeycloak } from '@react-keycloak/web';

/**
 * Entry point after Keycloak redirects the browser back with an auth code.
 *
 * Once the user is authenticated and their profile is loaded:
 *   - If sessionStorage has the `accountDeleted` flag → redirect to /account-deactivated
 *   - Otherwise → navigate to /my-portal/:id
 *
 * While waiting, render the loading screen.
 */
export default function LoginPage() {
  const { keycloak, initialized } = useKeycloak();
  const isLoggedIn = initialized && keycloak.authenticated === true;
  const { user, isLoading } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!initialized) return;

    if (!isLoggedIn) {
      sessionStorage.setItem('cgp_login_pending', '1');
      void keycloak.login({
        redirectUri: `${window.location.origin}/auth/login`,
      });
      return;
    }

    if (isLoading || !user) return;

    if (sessionStorage.getItem('accountDeleted')) {
      sessionStorage.removeItem('accountDeleted');
      void navigate('/account-deactivated', { replace: true });
      return;
    }

    void navigate(`/dashboard/ats`, { replace: true });
  }, [initialized, isLoggedIn, isLoading, user, navigate, keycloak]);

  return <LoadingPage />;
}
