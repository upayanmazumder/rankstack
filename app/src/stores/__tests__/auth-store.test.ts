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
});
