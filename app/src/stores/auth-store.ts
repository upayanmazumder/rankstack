'use client';

import type { StoreApi, UseBoundStore } from 'zustand';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { User } from '@/types';

import { createSelectors } from './create-selectors';

interface AuthState {
  user: User | null;
  sessionGeneration: number;
  setAuth: (userOrToken: User | string | null, legacyUser?: User | null) => void;
  clearAuth: () => void;
}

const useAuthStoreBase = create<AuthState>()(
  persist(
    set => ({
      user: null,
      sessionGeneration: 0,
      setAuth: (userOrToken, legacyUser) => {
        const nextUser = typeof userOrToken === 'string' ? (legacyUser ?? null) : userOrToken;
        set(state => ({
          user: nextUser,
          sessionGeneration: state.sessionGeneration + 1,
        }));
      },
      clearAuth: () =>
        set(state => ({
          user: null,
          sessionGeneration: state.sessionGeneration + 1,
        })),
    }),
    {
      name: 'auth-store',
      version: 1,
      partialize: state => ({ user: state.user }),
      migrate: persistedState => ({
        user: (persistedState as Partial<AuthState> | undefined)?.user ?? null,
      }),
    }
  )
) as unknown as UseBoundStore<StoreApi<AuthState>> & {
  persist: { rehydrate: () => Promise<void> | void };
};

export const useAuthStore = createSelectors(useAuthStoreBase);
