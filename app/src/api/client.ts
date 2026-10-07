import axios from 'axios';

import { API_TIMEOUT_MS } from '@/constants';
import { env } from '@/env';
import { useAuthStore } from '@/stores/auth-store';

import { toApiError } from './errors';

export function createApiClient(baseURL: string) {
  const client = axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' },
    timeout: API_TIMEOUT_MS,
  });

  // Attach session token from live auth store.
  client.interceptors.request.use(config => {
    try {
      const token = useAuthStore.getState().token;
      if (token) config.headers.set('Authorization', `Bearer ${token}`);
    } catch {
      // In case store is accessed in an environment where Zustand isn't initialized yet
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
