import axios, { AxiosError } from 'axios';

export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
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
 * Called once by the shell (or standalone App) after Keycloak is initialized.
 * The getter should refresh the token if needed and return it,
 * or return null when the user is not authenticated.
 *
 * Any in-flight requests that arrived before this was called are queued and
 * released here, so they always carry a valid token.
 */
let _tokenGetter: (() => Promise<string | null>) | null = null;
const _authReadyResolvers: Array<() => void> = [];

export function setTokenGetter(getter: () => Promise<string | null>): void {
  _tokenGetter = getter;
  const resolvers = _authReadyResolvers.splice(0);
  for (const resolve of resolvers) resolve();
}

function waitForTokenGetter(): Promise<void> {
  if (_tokenGetter !== null) return Promise.resolve();
  return new Promise(resolve => _authReadyResolvers.push(resolve));
}

httpClient.interceptors.request.use(async config => {
  await waitForTokenGetter();
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
