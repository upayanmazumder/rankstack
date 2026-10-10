import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api';
import { createQueryKeys } from '@/lib/query';
import type { Submission, SubmissionCreate } from '@/types';

import { leaderboardKeys } from './use-contests';
import { userKeys } from './use-users';

export const submissionKeys = createQueryKeys('submissions');

interface SubmissionFilters extends Record<string, unknown> {
  contestId?: string;
  userId?: string;
  status?: Submission['status'];
}

const SUBMISSION_HISTORY_PAGE_SIZE = 100;

export function useSubmissions(filters?: SubmissionFilters) {
  return useQuery({
    queryKey: filters ? submissionKeys.list(filters) : submissionKeys.lists(),
    queryFn: async () => {
      const res = await api.get<Submission[]>('/submissions', { params: filters });
      return res.data;
    },
  });
}

export function useSubmissionHistory(userId: string) {
  return useQuery({
    queryKey: submissionKeys.list({ scope: 'history', userId }),
    enabled: Boolean(userId),
    queryFn: async () => {
      const submissions: Submission[] = [];
      let offset = 0;

      for (;;) {
        const res = await api.get<Submission[]>('/submissions', {
          params: { userId, limit: SUBMISSION_HISTORY_PAGE_SIZE, offset },
        });
        submissions.push(...res.data);

        if (res.data.length < SUBMISSION_HISTORY_PAGE_SIZE) return submissions;
        offset += SUBMISSION_HISTORY_PAGE_SIZE;
      }
    },
  });
}

export function useSubmission(id: string) {
  return useQuery({
    queryKey: submissionKeys.detail(id),
    queryFn: async () => {
      const res = await api.get<Submission>(`/submissions/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateSubmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: SubmissionCreate) => {
      const res = await api.post<Submission>('/submissions', payload);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: submissionKeys.lists() }),
  });
}

export function useUpdateSubmissionStatus(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { status: Submission['status']; score: number }) => {
      const res = await api.patch<Submission>(`/submissions/${id}/status`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: submissionKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: submissionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leaderboardKeys.all() });
      queryClient.invalidateQueries({ queryKey: userKeys.all() });
    },
  });
}

export function useDeleteSubmission(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.delete(`/submissions/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: submissionKeys.all() }),
  });
}
