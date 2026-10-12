import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api';
import { createQueryKeys, fetchAllPages } from '@/lib/query';
import type { User, UserUpdate } from '@/types';

import { removeFromCachedLists, restoreCachedLists } from './optimistic-delete';

export const userKeys = createQueryKeys('users');

export function useUsers() {
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: async () =>
      fetchAllPages<User>(async ({ limit, offset }) => {
        const res = await api.get<User[]>('/users', { params: { limit, offset } });
        return res.data;
      }),
  });
}

export function useUpdateUser(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UserUpdate) => {
      const res = await api.patch<User>(`/users/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

export function useDeleteUser(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.delete(`/users/${id}`);
    },
    onMutate: () => removeFromCachedLists<User>(queryClient, userKeys.lists(), id),
    onError: (_error, _variables, snapshots) => {
      if (snapshots) restoreCachedLists(queryClient, snapshots, id);
    },
    onSuccess: () => queryClient.removeQueries({ queryKey: userKeys.detail(id) }),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: userKeys.all() }),
  });
}
