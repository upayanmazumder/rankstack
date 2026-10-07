import { useMutation } from '@tanstack/react-query';

import { api } from '@/api';
import type { LoginRequest, Session, User } from '@/types';

export function useLogin() {
  return useMutation({
    mutationFn: async (payload: LoginRequest) => {
      const res = await api.post<Session>('/sessions', payload);
      return res.data;
    },
  });
}

export function useLogout() {
  return useMutation({
    mutationFn: async (sessionId: string) => {
      await api.delete(`/sessions/${sessionId}`);
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
