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

  it('stores the authenticated user without persisting the session token', () => {
    useAuthStore.getState().setAuth(user);

    expect(useAuthStore.getState()).toMatchObject({ user });
    expect('token' in useAuthStore.getState()).toBe(false);
    expect(JSON.parse(localStorage.getItem('auth-store') ?? '{}').state.user).toEqual(user);
    expect(JSON.parse(localStorage.getItem('auth-store') ?? '{}').state).not.toHaveProperty(
      'token'
    );
  });

  it('clears authentication state and persists the cleared values', () => {
    useAuthStore.getState().setAuth(user);
    useAuthStore.getState().clearAuth();

    expect(useAuthStore.getState()).toMatchObject({ user: null });
    expect(JSON.parse(localStorage.getItem('auth-store') ?? '{}').state).toMatchObject({
      user: null,
    });
    expect(JSON.parse(localStorage.getItem('auth-store') ?? '{}').state).not.toHaveProperty(
      'token'
    );
  });

  it('migrates legacy persisted records by keeping user and discarding token', async () => {
    localStorage.setItem(
      'auth-store',
      JSON.stringify({
        state: { token: 'legacy-session-token', user },
        version: 0,
      })
    );

    await useAuthStore.persist.rehydrate();

    expect(useAuthStore.getState().user).toEqual(user);
    expect('token' in useAuthStore.getState()).toBe(false);
    const persisted = JSON.parse(localStorage.getItem('auth-store') ?? '{}');
    expect(persisted.version).toBe(1);
    expect(persisted.state).toEqual({ user });
    expect(persisted.state).not.toHaveProperty('token');
  });
});
