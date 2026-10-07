import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api';
import { createQueryKeys } from '@/lib/query';
import type { Submission, SubmissionCreate } from '@/types';

export const submissionKeys = createQueryKeys('submissions');

export function useSubmissions(filters?: { contestId?: string; userId?: string }) {
  return useQuery({
    queryKey: filters ? submissionKeys.list(filters) : submissionKeys.lists(),
    queryFn: async () => {
      const res = await api.get<Submission[]>('/submissions', { params: filters });
      return res.data;
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
