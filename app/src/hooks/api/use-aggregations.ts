import { useQuery } from '@tanstack/react-query';

import { api } from '@/api';
import { createQueryKeys } from '@/lib/query';
import type { Difficulty, SubmissionStatus } from '@/types';

export interface AverageScoreByDifficulty {
  difficulty: Difficulty;
  avgScorePerProblem: number;
  problemCount: number;
}

export interface SubmissionStatusCount {
  status: SubmissionStatus;
  count: number;
}

export interface SubmissionStatusByContest {
  contestId: string;
  title: string;
  statusCounts: SubmissionStatusCount[];
}

export const aggregationKeys = createQueryKeys('aggregations');

export function useAverageScoreByDifficulty() {
  return useQuery({
    queryKey: aggregationKeys.detail('average-score-by-difficulty'),
    queryFn: async () => {
      const response = await api.get<AverageScoreByDifficulty[]>(
        '/aggregations/avg-score-by-difficulty'
      );
      return response.data;
    },
  });
}

export function useSubmissionStatusByContest() {
  return useQuery({
    queryKey: aggregationKeys.detail('submission-status-by-contest'),
    queryFn: async () => {
      const response = await api.get<SubmissionStatusByContest[]>(
        '/aggregations/submission-status-by-contest'
      );
      return response.data;
    },
  });
}
