import { beforeEach, describe, expect, it } from 'vitest';

import { useAuthStore } from '../auth-store';

const user = {
  id: 'user-1',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  role: 'participant' as const,
  totalScore: 120,
  teamIds: [],
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
    localStorage.clear();
  });

  it('sets and persists the authenticated user and session token', () => {
    useAuthStore.getState().setAuth('session-token', user);

    expect(useAuthStore.getState()).toMatchObject({ token: 'session-token', user });
    expect(JSON.parse(localStorage.getItem('auth-store') ?? '{}').state).toMatchObject({
      token: 'session-token',
      user,
    });
  });

  it('clears authentication state and persists the cleared values', () => {
    useAuthStore.getState().setAuth('session-token', user);
    useAuthStore.getState().clearAuth();

    expect(useAuthStore.getState()).toMatchObject({ token: null, user: null });
    expect(JSON.parse(localStorage.getItem('auth-store') ?? '{}').state).toMatchObject({
      token: null,
      user: null,
    });
  });
});
