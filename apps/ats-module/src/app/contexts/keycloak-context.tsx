/**
 * Re-export @react-keycloak/web's useKeycloak for use in standalone mode.
 * In embedded mode @react-keycloak/web is a shared singleton, so useKeycloak
 * resolves to the same context the shell's ReactKeycloakProvider created.
 */

export { useKeycloak } from '@react-keycloak/web';
