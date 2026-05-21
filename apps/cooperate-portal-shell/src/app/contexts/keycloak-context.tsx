/**
 * Re-export @react-keycloak/web's useKeycloak for consumption by remote modules
 * via module federation (cooperate-portal-shell/KeycloakContext).
 *
 * Because @react-keycloak/web is listed as a shared singleton in the federation
 * config, remote modules that import useKeycloak through this entry will
 * automatically use the same ReactKeycloakProvider instance created by the shell.
 */

export { useKeycloak } from '@react-keycloak/web';
