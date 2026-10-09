import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api';
import { createQueryKeys } from '@/lib/query';
import type {
  Contest,
  ContestCreate,
  ContestStatus,
  ContestUpdate,
  LeaderboardEntry,
  ParticipantRefType,
} from '@/types';

export const contestKeys = createQueryKeys('contests');

export const leaderboardKeys = {
  all: () => ['leaderboard'] as const,
  detail: (contestId: string, top: number) => ['leaderboard', contestId, top] as const,
};

interface ContestFilters extends Record<string, unknown> {
  status?: ContestStatus;
}

interface AddParticipantInput {
  refType: ParticipantRefType;
  refId: string;
}

export function useContests(filters?: ContestFilters) {
  return useQuery({
    queryKey: contestKeys.list(filters),
    queryFn: async () => {
      const res = await api.get<Contest[]>('/contests', { params: filters });
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
    refetchInterval: query => (query.state.data?.status === 'ended' ? false : 5_000),
  });
}

export function useLeaderboard(
  contestId: string,
  refetchInterval: number | false = 5_000,
  top = 10
) {
  return useQuery({
    queryKey: leaderboardKeys.detail(contestId, top),
    queryFn: async () => {
      const res = await api.get<{ contestId: string; leaderboard: LeaderboardEntry[] }>(
        `/contests/${contestId}/leaderboard`,
        { params: { top } }
      );
      return res.data.leaderboard;
    },
    enabled: !!contestId,
    refetchInterval,
  });
}

export function useAddParticipant(contestId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (participant: AddParticipantInput) => {
      const res = await api.post<Contest>(`/contests/${contestId}/participants`, participant);
      return res.data;
    },
    onSuccess: contest => {
      queryClient.setQueryData(contestKeys.detail(contestId), contest);
      queryClient.invalidateQueries({ queryKey: contestKeys.lists() });
    },
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
