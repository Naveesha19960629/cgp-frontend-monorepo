interface Window {
  __POWERED_BY_SHELL__?: boolean;
}

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_CANDIDATE_SERVICE_URL: string;
  readonly VITE_WS_URL: string;
  readonly VITE_KEYCLOAK_URL: string;
  readonly VITE_KEYCLOAK_REALM: string;
  readonly VITE_KEYCLOAK_CLIENT_ID: string;
  readonly VITE_PORTAL_LOGO: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
