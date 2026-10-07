'use client';

import type { StoreApi, UseBoundStore } from 'zustand';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { User } from '@/types';

import { createSelectors } from './create-selectors';

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
}

const useAuthStoreBase = create<AuthState>()(
  persist(
    set => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      clearAuth: () => set({ token: null, user: null }),
    }),
    { name: 'auth-store' }
  )
) as unknown as UseBoundStore<StoreApi<AuthState>>;

export const useAuthStore = createSelectors(useAuthStoreBase);
