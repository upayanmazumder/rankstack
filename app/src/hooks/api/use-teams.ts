import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api';
import { createQueryKeys } from '@/lib/query';
import type { Team, TeamCreate, TeamUpdate } from '@/types';

import { userKeys } from './use-users';

export const teamKeys = createQueryKeys('teams');

export function useTeams() {
  return useQuery({
    queryKey: teamKeys.lists(),
    queryFn: async () => {
      const res = await api.get<Team[]>('/teams');
      return res.data;
    },
  });
}

export function useTeam(id: string) {
  return useQuery({
    queryKey: teamKeys.detail(id),
    queryFn: async () => {
      const res = await api.get<Team>(`/teams/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TeamCreate) => {
      const res = await api.post<Team>('/teams', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.all() });
    },
  });
}

export function useUpdateTeam(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TeamUpdate) => {
      const res = await api.patch<Team>(`/teams/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
    },
  });
}

export function useAddTeamMember(teamId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await api.post<Team>(`/teams/${teamId}/members`, { userId });
      return res.data;
    },
    onSuccess: team => {
      queryClient.setQueryData(teamKeys.detail(teamId), team);
      queryClient.invalidateQueries({ queryKey: teamKeys.detail(teamId) });
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.all() });
    },
  });
}

export function useRemoveTeamMember(teamId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await api.delete<Team>(`/teams/${teamId}/members/${userId}`);
      return res.data;
    },
    onSuccess: team => {
      queryClient.setQueryData(teamKeys.detail(teamId), team);
      queryClient.invalidateQueries({ queryKey: teamKeys.detail(teamId) });
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.all() });
    },
  });
}

export function useDeleteTeam(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.delete(`/teams/${id}`);
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: teamKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: teamKeys.all() });
      queryClient.invalidateQueries({ queryKey: userKeys.all() });
    },
  });
}
