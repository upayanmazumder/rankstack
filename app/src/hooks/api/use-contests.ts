import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api';
import { createQueryKeys } from '@/lib/query';
import type { Contest, ContestCreate, ContestUpdate, LeaderboardEntry } from '@/types';

export const contestKeys = createQueryKeys('contests');

export const leaderboardKeys = {
  all: () => ['leaderboard'] as const,
  detail: (contestId: string) => ['leaderboard', contestId] as const,
};

export function useContests() {
  return useQuery({
    queryKey: contestKeys.lists(),
    queryFn: async () => {
      const res = await api.get<Contest[]>('/contests');
      return res.data;
    },
  });
}

export function useContest(id: string) {
  return useQuery({
    queryKey: contestKeys.detail(id),
    queryFn: async () => {
      const res = await api.get<Contest>(`/contests/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useLeaderboard(contestId: string) {
  return useQuery({
    queryKey: leaderboardKeys.detail(contestId),
    queryFn: async () => {
      const res = await api.get<LeaderboardEntry[]>(`/contests/${contestId}/leaderboard`);
      return res.data;
    },
    enabled: !!contestId,
    refetchInterval: 5_000,
  });
}

export function useCreateContest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ContestCreate) => {
      const res = await api.post<Contest>('/contests', payload);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: contestKeys.lists() }),
  });
}

export function useUpdateContest(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ContestUpdate) => {
      const res = await api.patch<Contest>(`/contests/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contestKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: contestKeys.lists() });
    },
  });
}

export function useUpdateContestStatus(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (status: Contest['status']) => {
      const res = await api.patch<Contest>(`/contests/${id}/status`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contestKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: contestKeys.lists() });
    },
  });
}

export function useDeleteContest(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.delete(`/contests/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: contestKeys.all() }),
  });
}
