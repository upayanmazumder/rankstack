import axios, { type AxiosInstance } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/stores/auth-store';

import { createApiClient } from '../client';

const toastError = vi.hoisted(() => vi.fn());
vi.mock('sonner', () => ({ toast: { error: toastError } }));

describe('API client session expiration', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    useAuthStore.getState().clearAuth();
  });

  it('clears authentication, reports expiration, and redirects on HTTP 401', async () => {
    let rejectResponse: ((error: unknown) => Promise<never>) | undefined;
    let resolveResponse: ((response: unknown) => unknown) | undefined;
    const client = {
      interceptors: {
        request: { use: vi.fn() },
        response: {
          use: vi.fn(
            (
              resolve: (response: unknown) => unknown,
              reject: (error: unknown) => Promise<never>
            ) => {
              resolveResponse = resolve;
              rejectResponse = reject;
            }
          ),
        },
      },
    } as unknown as AxiosInstance;
    vi.spyOn(axios, 'create').mockReturnValue(client);

    const browser = {
      location: { pathname: '/contests' },
      dispatchEvent: vi.fn(),
    };
    vi.stubGlobal('window', browser);
    useAuthStore.getState().setAuth('session-token', null);

    createApiClient('https://api.example.test');
    resolveResponse?.({ data: null });
    const unauthorized = Object.assign(new Error('Unauthorized'), {
      isAxiosError: true,
      response: { status: 401, data: { message: 'Session expired' } },
    });

    await expect(rejectResponse?.(unauthorized)).rejects.toMatchObject({ status: 401 });

    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
    expect(toastError).toHaveBeenCalledWith('Session expired. Please log in again.');
    expect(browser.dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'rankstack:session-expired' })
    );
  });
});
