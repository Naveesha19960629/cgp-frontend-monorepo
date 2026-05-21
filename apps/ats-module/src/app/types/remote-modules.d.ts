import type { ComponentType, ReactNode } from 'react';

declare module 'cooperate-portal-shell/KeycloakContext' {
  // Shell's keycloak-context.tsx re-exports useKeycloak from @react-keycloak/web.
  // Prefer importing useKeycloak directly from '@react-keycloak/web' in ATS code.
  export { useKeycloak } from '@react-keycloak/web';
}

declare module 'cooperate-portal-shell/UserContext' {
  export interface User {
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

declare module 'ats-module/AtsRoutes' {
  const AtsRoutes: ComponentType;
  export default AtsRoutes;
}
