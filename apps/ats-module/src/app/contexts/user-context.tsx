import {
  type ReactNode,
  createContext,
  startTransition,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { setTokenGetter } from '@cgp/data-access';
import { useKeycloak } from '@react-keycloak/web';

interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string;
  firstName: string;
  lastName: string;
  givenName: string;
  familyName: string;
  preferredUsername: string;
  salutation?: string;
  phoneNumber?: string;
  picture?: string;
}

interface UserContextValue {
  user: User | null;
}

const UserContext = createContext<UserContextValue | null>(null);

function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return ctx;
}

function UserProvider({ children }: Readonly<{ children: ReactNode }>) {
  const { keycloak, initialized } = useKeycloak();
  const isLoggedIn = initialized && keycloak.authenticated === true;
  const [user, setUser] = useState<User | null>(null);

  // Wire up the Axios request interceptor once Keycloak is ready.
  // Needed in standalone mode — in embedded mode the shell's UserProvider
  // also calls setTokenGetter, so the last writer wins (same token either way).
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

  // Derive user from token claims synchronously.
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

  const contextValue = useMemo<UserContextValue>(() => ({ user }), [user]);

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
}

export type { User, UserContextValue };
// eslint-disable-next-line react-refresh/only-export-components
export { UserContext, useUser, UserProvider };
