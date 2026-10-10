import type { Submission, SubmissionStatus } from '@/types';

export type SubmissionStatusFilter = 'all' | SubmissionStatus;

export interface SubmissionHistoryFilters {
  contestId: string;
  status: SubmissionStatusFilter;
}

interface TitledEntity {
  id: string;
  title: string;
}

export function filterAndSortSubmissions(
  submissions: Submission[],
  filters: SubmissionHistoryFilters
): Submission[] {
  return submissions
    .filter(submission => filters.contestId === 'all' || submission.contestId === filters.contestId)
    .filter(submission => filters.status === 'all' || submission.status === filters.status)
    .toSorted((left, right) => {
      const rightTime = Date.parse(right.submittedAt);
      const leftTime = Date.parse(left.submittedAt);
      return (Number.isNaN(rightTime) ? 0 : rightTime) - (Number.isNaN(leftTime) ? 0 : leftTime);
    });
}

export function createTitleLookup(entities: TitledEntity[]): Record<string, string> {
  return Object.fromEntries(entities.map(entity => [entity.id, entity.title]));
}

export function resolveEntityTitle(
  titles: Record<string, string>,
  id: string,
  fallbackLabel: string
): string {
  return titles[id] ?? `${fallbackLabel} ${id.slice(0, 8)}`;
}
