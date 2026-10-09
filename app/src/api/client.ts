import axios from 'axios';
import { toast } from 'sonner';

import { API_TIMEOUT_MS } from '@/constants';
import { SESSION_EXPIRED_EVENT } from '@/constants/session';
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
    error => {
      if (
        axios.isAxiosError(error) &&
        error.response?.status === 401 &&
        typeof window !== 'undefined'
      ) {
        const token = useAuthStore.getState().token;
        if (token && error.config?.headers.get('Authorization') === `Bearer ${token}`) {
          useAuthStore.getState().clearAuth();
          if (window.location.pathname !== '/login') {
            toast.error('Session expired. Please log in again.');
            window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
          }
        }
      }
      return Promise.reject(toApiError(error));
    }
  );

  return client;
}

export const api = createApiClient(env.NEXT_PUBLIC_API_URL);
