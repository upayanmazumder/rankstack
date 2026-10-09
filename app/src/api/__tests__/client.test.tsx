import { render } from '@testing-library/react';
import { AxiosError, type AxiosResponse } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SessionExpiredRedirect } from '@/components/providers/session-expired-redirect';
import { useAuthStore } from '@/stores/auth-store';

import { createApiClient } from '../client';

const toastError = vi.hoisted(() => vi.fn());
const replace = vi.hoisted(() => vi.fn());
vi.mock('sonner', () => ({ toast: { error: toastError } }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));

describe('API client session expiration', () => {
  afterEach(() => {
    useAuthStore.getState().clearAuth();
    toastError.mockReset();
    replace.mockReset();
  });

  it('clears the session and navigates to login after an unauthorized response', async () => {
    useAuthStore.getState().setAuth('session-token', null);
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

    expect(useAuthStore.getState()).toMatchObject({ token: null, user: null });
    expect(toastError).toHaveBeenCalledWith('Session expired. Please log in again.');
    expect(replace).toHaveBeenCalledWith('/login');
  });

  it('keeps a replacement session when an older request fails', async () => {
    useAuthStore.getState().setAuth('token-A', null);
    render(<SessionExpiredRedirect />);

    const gate = Promise.withResolvers<void>();
    let requestStarted = false;
    const client = createApiClient('https://api.example.test');
    client.defaults.adapter = async config => {
      requestStarted = true;
      await gate.promise;
      const response: AxiosResponse = {
        config,
        data: { detail: 'Session expired' },
        headers: {},
        status: 401,
        statusText: 'Unauthorized',
      };
      throw new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined, response);
    };

    const pending = client.get('/contests');
    await vi.waitFor(() => expect(requestStarted).toBe(true));
    useAuthStore.getState().setAuth('token-B', null);
    gate.resolve();
    await expect(pending).rejects.toMatchObject({ status: 401 });

    expect(useAuthStore.getState().token).toBe('token-B');
    expect(toastError).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });
});
