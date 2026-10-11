'use client';

import type { StoreApi, UseBoundStore } from 'zustand';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { User } from '@/types';

import { createSelectors } from './create-selectors';

interface AuthState {
  user: User | null;
  setAuth: (userOrToken: User | string | null, legacyUser?: User | null) => void;
  clearAuth: () => void;
}

const useAuthStoreBase = create<AuthState>()(
  persist(
    set => ({
      user: null,
      setAuth: (userOrToken, legacyUser) => {
        const nextUser = typeof userOrToken === 'string' ? (legacyUser ?? null) : userOrToken;
        set({ user: nextUser });
      },
      clearAuth: () => set({ user: null }),
    }),
    {
      name: 'auth-store',
      partialize: state => ({ user: state.user }),
    }
  )
) as unknown as UseBoundStore<StoreApi<AuthState>>;

export const useAuthStore = createSelectors(useAuthStoreBase);
