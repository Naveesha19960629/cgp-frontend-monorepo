import Keycloak from 'keycloak-js';
import type { KeycloakInitOptions } from 'keycloak-js';

/**
 * Single Keycloak JS client instance shared across the entire application.
 * Configured from Vite env vars so each deployment can target its own realm.
 */
const KeycloakInstance = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL as string,
  realm: import.meta.env.VITE_KEYCLOAK_REALM as string,
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID as string,
});

/**
 * Init options passed to keycloak.init():
 * - check-sso: silently checks for an active SSO session before rendering
 * - checkLoginIframe: false — avoids CSP / iframe restrictions
 * - pkceMethod: S256 — PKCE with SHA-256 for public clients
 */
export const keycloakInitOptions: KeycloakInitOptions = {
  onLoad: 'check-sso',
  checkLoginIframe: false,
  pkceMethod: 'S256',
};

export default KeycloakInstance;
