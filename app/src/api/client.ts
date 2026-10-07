import axios from 'axios';

import { API_TIMEOUT_MS } from '@/constants';
import { env } from '@/env';

import { toApiError } from './errors';

export function createApiClient(baseURL: string) {
  const client = axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' },
    timeout: API_TIMEOUT_MS,
  });

  // Attach session token from persisted auth-store.
  // Read localStorage directly to avoid circular imports and to work outside React.
  client.interceptors.request.use(config => {
    try {
      const raw = localStorage.getItem('auth-store');
      const parsed = raw ? (JSON.parse(raw) as { state?: { token?: string | null } }) : null;
      const token = parsed?.state?.token;
      if (token) config.headers.set('Authorization', `Bearer ${token}`);
    } catch {
      // localStorage unavailable (SSR / edge runtime) — skip silently.
    }
    return config;
  });

  client.interceptors.response.use(
    response => response,
    error => Promise.reject(toApiError(error))
  );

  return client;
}

export const api = createApiClient(env.NEXT_PUBLIC_API_URL);
