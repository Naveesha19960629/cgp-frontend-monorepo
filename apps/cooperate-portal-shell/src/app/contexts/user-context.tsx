import {
  type ReactNode,
  createContext,
  startTransition,
  useContext,
  useEffect,
  useState,
} from 'react';

import type { User, UserContextValue } from '@/app/types';

import { setTokenGetter } from '@cgp/data-access';
import { useKeycloak } from '@react-keycloak/web';

const UserContext = createContext<UserContextValue | null>(null);

function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return ctx;
}

function UserProvider({ children }: { children: ReactNode }) {
  const { keycloak, initialized } = useKeycloak();
  const isLoggedIn = initialized && keycloak.authenticated === true;
  const [user, setUser] = useState<User | null>(null);
  // isLoading kept for API compatibility; will become meaningful again when
  // the authService.getUser() call is re-enabled.
  const isLoading = false;

  // Wire up the Axios request interceptor once Keycloak is ready
  useEffect(() => {
    if (!initialized) return;
    setTokenGetter(async () => {
      try {
        await keycloak.updateToken(30);
      } catch {
        await keycloak.logout();
        return null;
      }
      return keycloak.token ?? null;
    });
  }, [initialized, keycloak]);

  // Derive user from token claims synchronously — no API call needed yet.
  // TODO: replace with authService.getUser() once the backend provides
  //       additional profile fields not present in the token.
  useEffect(() => {
    if (!initialized) return;

    if (!isLoggedIn) {
      startTransition(() => setUser(null));
      return;
    }

    const p = keycloak.tokenParsed as Record<string, unknown>;
    const str = (key: string, fallback = '') =>
      typeof p[key] === 'string' ? p[key] : fallback;
    const optStr = (key: string) =>
      typeof p[key] === 'string' ? p[key] : undefined;

    startTransition(() =>
      setUser({
        id: str('sub'),
        email: str('email'),
        emailVerified: p['email_verified'] === true,
        name: str('name'),
        firstName: str('first_name') || str('given_name'),
        lastName: str('last_name') || str('family_name'),
        givenName: str('given_name'),
        familyName: str('family_name'),
        preferredUsername: str('preferred_username'),
        salutation: optStr('salutation'),
        phoneNumber: optStr('phone_number'),
        picture: optStr('picture'),
      })
    );
  }, [initialized, isLoggedIn, keycloak]);

  return (
    <UserContext.Provider value={{ user, isLoading }}>
      {children}
    </UserContext.Provider>
  );
}

export { UserContext, useUser, UserProvider };
