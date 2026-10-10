import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api';
import { createQueryKeys } from '@/lib/query';
import type { Problem, ProblemCreate } from '@/types';

import { removeFromCachedLists, restoreCachedLists } from './optimistic-delete';

export const problemKeys = createQueryKeys('problems');

export function useProblems(contestId?: string) {
  return useQuery({
    queryKey: contestId ? problemKeys.list({ contestId }) : problemKeys.lists(),
    queryFn: async () => {
      const params = contestId ? { contestId } : undefined;
      const res = await api.get<Problem[]>('/problems', { params });
      return res.data;
    },
  });
}

export function useProblem(id: string) {
  return useQuery({
    queryKey: problemKeys.detail(id),
    queryFn: async () => {
      const res = await api.get<Problem>(`/problems/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateProblem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ProblemCreate) => {
      const res = await api.post<Problem>('/problems', payload);
      return res.data;
    },
    onSuccess: problem => {
      queryClient.invalidateQueries({ queryKey: problemKeys.all() });
      queryClient.invalidateQueries({ queryKey: ['contests', problem.contestId] });
      queryClient.invalidateQueries({ queryKey: ['contests', 'list'] });
    },
  });
}

export function useDeleteProblem(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.delete(`/problems/${id}`);
    },
    onMutate: () => removeFromCachedLists<Problem>(queryClient, problemKeys.lists(), id),
    onError: (_error, _variables, snapshots) => {
      if (snapshots) restoreCachedLists(queryClient, snapshots);
    },
    onSuccess: () => queryClient.removeQueries({ queryKey: problemKeys.detail(id) }),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: problemKeys.all() });
      void queryClient.invalidateQueries({ queryKey: ['contests'] });
      void queryClient.invalidateQueries({ queryKey: ['submissions'] });
      void queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });
}
