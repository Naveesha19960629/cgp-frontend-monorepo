import Keycloak from 'keycloak-js';
import type { KeycloakInitOptions } from 'keycloak-js';

/**
 * Standalone-mode Keycloak instance for ats-module.
 * Used only when the module runs outside the shell (dev server on port 5173).
 * In embedded mode the shell's shared keycloak-js singleton is used instead.
 */
const atsKeycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL,
  realm: import.meta.env.VITE_KEYCLOAK_REALM,
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
});

export const atsKeycloakInitOptions: KeycloakInitOptions = {
  onLoad: 'check-sso',
  checkLoginIframe: false,
  pkceMethod: 'S256',
};

export default atsKeycloak;
