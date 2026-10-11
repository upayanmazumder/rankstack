import { render } from '@testing-library/react';
import { AxiosError, type AxiosResponse } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SessionExpiredRedirect } from '@/components/providers/session-expired-redirect';
import { env } from '@/env';
import { useAuthStore } from '@/stores/auth-store';
import type { User } from '@/types';

import { API_PROXY_BASE_URL, createApiClient } from '../client';

const toastError = vi.hoisted(() => vi.fn());
const replace = vi.hoisted(() => vi.fn());
vi.mock('sonner', () => ({ toast: { error: toastError } }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));

const user: User = {
  id: 'user-1',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  role: 'participant',
  totalScore: 100,
  teamIds: [],
  createdAt: '2026-01-01T00:00:00.000Z',
};
describe('API client session expiration', () => {
  afterEach(() => {
    useAuthStore.getState().clearAuth();
    toastError.mockReset();
    replace.mockReset();
  });

  it('clears the session and navigates to login after an unauthorized response', async () => {
    useAuthStore.getState().setAuth(null);
    render(<SessionExpiredRedirect />);

    const client = createApiClient('https://api.example.test');
    client.defaults.adapter = async config => {
      const response: AxiosResponse = {
        config,
        data: { detail: 'Session expired' },
        headers: {},
        status: 401,
        statusText: 'Unauthorized',
      };
      throw new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined, response);
    };

    await expect(client.get('/contests')).rejects.toMatchObject({ status: 401 });

    expect(useAuthStore.getState()).toMatchObject({ user: null });
    expect('token' in useAuthStore.getState()).toBe(false);
    expect(toastError).toHaveBeenCalledWith('Session expired. Please log in again.');
    expect(replace).toHaveBeenCalledWith('/login');
  });

  it('keeps a replacement session when an older request fails with 401', async () => {
    useAuthStore.getState().setAuth(user);
    render(<SessionExpiredRedirect />);

    const gate = Promise.withResolvers<void>();
    let requestStarted = false;
    const client = createApiClient('https://api.example.test');
    client.defaults.adapter = async config => {
      expect(config.headers?.get?.('Authorization')).toBeUndefined();
      return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
    };

    const pending = client.get('/contests');
    await vi.waitFor(() => expect(requestStarted).toBe(true));

    const nextUser: User = { ...user, id: 'user-2', email: 'grace@example.com' };
    useAuthStore.getState().setAuth(nextUser);
    gate.resolve();
    await expect(pending).rejects.toMatchObject({ status: 401 });

    expect(useAuthStore.getState().user).toEqual(nextUser);
    expect(toastError).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });

  it('routes browser requests through the same-origin proxy without a browser bearer header', async () => {
    const client = createApiClient(env.NEXT_PUBLIC_API_URL);
    client.defaults.adapter = async config => {
      expect(config.baseURL).toBe(API_PROXY_BASE_URL);
      expect(config.withCredentials).toBe(true);
      expect(config.headers?.get?.('Authorization')).toBeUndefined();
      return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
    };

    await expect(client.get('/contests')).resolves.toMatchObject({ status: 200 });
  });
});
