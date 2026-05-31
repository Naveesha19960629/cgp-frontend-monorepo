import axios, { AxiosError } from 'axios';

export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const temporaryHttpClient = axios.create({
  baseURL: 'http://localhost:9999/api/',
  headers: {
    'Content-Type': 'application/json',
  },
});

export function isAxiosError<T = unknown>(
  error: unknown
): error is AxiosError<T> {
  return axios.isAxiosError(error);
}

/**
 * Called once by the shell after Keycloak is initialized.
 * The getter should refresh the token if needed and return it,
 * or return null when the user is not authenticated.
 */
let _tokenGetter: (() => Promise<string | null>) | null = null;

export function setTokenGetter(getter: () => Promise<string | null>): void {
  _tokenGetter = getter;
}

httpClient.interceptors.request.use(async config => {
  if (_tokenGetter) {
    const token = await _tokenGetter();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

httpClient.interceptors.response.use(
  response => response,
  error => Promise.reject(error)
);
