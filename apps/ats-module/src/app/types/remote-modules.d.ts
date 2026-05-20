import type { ComponentType, ReactNode } from 'react';

import type Keycloak from 'keycloak-js';
import type { KeycloakInitOptions } from 'keycloak-js';

declare module 'cooperate-portal-shell/KeycloakContext' {
  export interface KeycloakContextValue {
    keycloak: Keycloak;
    initialized: boolean;
    isLoggedIn: boolean;
  }

  export function useKeycloak(): KeycloakContextValue;

  export function KeycloakProvider(props: {
    keycloak: Keycloak;
    initOptions: KeycloakInitOptions;
    children: ReactNode;
  }): JSX.Element;
}

declare module 'cooperate-portal-shell/UserContext' {
  export interface User {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  }

  export interface UserContextValue {
    user: User | null;
    isLoading: boolean;
  }

  export function useUser(): UserContextValue;

  export function UserProvider(props: { children: ReactNode }): JSX.Element;
}

declare module 'cooperate-portal-shell/keycloak' {
  import type Keycloak from 'keycloak-js';
  const KeycloakInstance: Keycloak;
  export default KeycloakInstance;
}

declare module 'cooperate-portal-shell/i18n' {
  import type { i18n } from 'i18next';
  const i18nInstance: i18n;
  export default i18nInstance;
}

// Existing ATS module declarations re-exported for completeness
declare module 'ats-module/AtsRoutes' {
  const AtsRoutes: ComponentType;
  export default AtsRoutes;
}
