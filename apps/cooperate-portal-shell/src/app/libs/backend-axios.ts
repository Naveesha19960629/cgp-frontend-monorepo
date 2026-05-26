import axiosBase from 'axios';

import KeycloakInstance from '../services/keycloak';

const BACKEND_URL =
  (import.meta.env.VITE_BACKEND_API_URL as string) ?? 'http://localhost:4000';
const API_VERSION =
  (import.meta.env.VITE_BACKEND_API_VERSION as string) ?? 'v1';

const backendAxios = axiosBase.create({
  baseURL: `${BACKEND_URL}/api/${API_VERSION}`,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true,
});

// Add token to every request
backendAxios.interceptors.request.use(
  async config => {
    if (KeycloakInstance.authenticated && KeycloakInstance.token) {
      // Refresh token if needed
      await KeycloakInstance.updateToken(30);
      config.headers.Authorization = `Bearer ${KeycloakInstance.token}`;
    }
    return config;
  },
  error =>
    Promise.reject(error instanceof Error ? error : new Error(String(error)))
);

export default backendAxios;
