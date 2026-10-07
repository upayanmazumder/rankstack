import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

import { api, toApiError } from '@/api';
import { useAuthStore } from '@/stores';
import type { LoginRequest, Session, User } from '@/types';

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: LoginRequest) => {
      try {
        const response = await axios.post<{ session: Session; user: User | null }>(
          '/api/session',
          payload
        );
        return response.data;
      } catch (error) {
        throw toApiError(error);
      }
    },
    onSuccess: ({ session, user }) => {
      queryClient.clear();
      useAuthStore.getState().setAuth(session.sessionId, user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await axios.delete('/api/session');
    },
    onSettled: () => {
      useAuthStore.getState().clearAuth();
      queryClient.clear();
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
