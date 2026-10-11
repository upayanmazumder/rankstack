import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/stores/auth-store';
import type { User } from '@/types';

import { SessionRevalidator } from '../session-revalidator';

const participant: User = {
  id: 'user-1',
  name: 'Ada',
  email: 'ada@example.com',
  role: 'participant',
  totalScore: 0,
  teamIds: [],
  createdAt: '2026-10-01T00:00:00Z',
};

function renderRevalidator() {
  const queryClient = new QueryClient();
  render(
    <QueryClientProvider client={queryClient}>
      <SessionRevalidator />
    </QueryClientProvider>
  );
  return queryClient;
}

describe('SessionRevalidator', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
    useAuthStore.getState().setAuth(participant);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    useAuthStore.getState().clearAuth();
  });

  it('replaces a persisted role with the server profile on load', async () => {
    const current = { ...participant, role: 'admin' as const };
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ user: current }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    renderRevalidator();

    await waitFor(() => expect(useAuthStore.getState().user).toEqual(current));
    expect(fetchMock).toHaveBeenCalledWith('/api/session', { cache: 'no-store' });
  });

  it('clears stale profile and private queries when the cookie is invalid', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 401 })));
    const queryClient = renderRevalidator();
    queryClient.setQueryData(['private-submissions'], [{ id: 's1' }]);

    await waitFor(() => expect(useAuthStore.getState().user).toBeNull());
    expect(queryClient.getQueryData(['private-submissions'])).toBeUndefined();
  });

  it('keeps the profile during a temporary server failure', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 502 }));
    vi.stubGlobal('fetch', fetchMock);

    renderRevalidator();

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    expect(useAuthStore.getState().user).toEqual(participant);
  });
});
