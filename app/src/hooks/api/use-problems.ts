import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api';
import { createQueryKeys } from '@/lib/query';
import type { Problem } from '@/types';

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

export function useDeleteProblem(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.delete(`/problems/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: problemKeys.all() }),
  });
}
