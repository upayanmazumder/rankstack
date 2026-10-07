import { useMutation } from '@tanstack/react-query';

import { api } from '@/api';
import { useAuthStore } from '@/stores';
import type { LoginRequest, Session, User } from '@/types';

export function useLogin() {
  const setAuth = useAuthStore.use.setAuth();
  return useMutation({
    mutationFn: async (payload: LoginRequest) => {
      const res = await api.post<Session>('/sessions', payload);
      let user: User | null = null;
      try {
        const sessionRes = await api.get<{ sessionId: string; user: User }>(
          `/sessions/${res.data.sessionId}`
        );
        user = sessionRes.data.user;
      } catch {
        // Profile request is enrichment; if it fails, session is still valid
      }
      return { session: res.data, user };
    },
    onSuccess: ({ session, user }) => {
      setAuth(session.sessionId, user);
    },
  });
}

export function useLogout() {
  const clearAuth = useAuthStore.use.clearAuth();
  const token = useAuthStore.use.token();
  return useMutation({
    mutationFn: async (sessionId?: string) => {
      const id = sessionId ?? token;
      if (id) {
        await api.delete(`/sessions/${id}`);
      }
    },
    onSuccess: () => {
      clearAuth();
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: async (payload: { name: string; email: string; password: string }) => {
      const res = await api.post<User>('/users', payload);
      return res.data;
    },
  });
}
