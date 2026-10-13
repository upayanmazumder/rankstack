import type { Contest } from '@/types';

/**
 * The contest whose standings the home page shows: the live contest that
 * started last, otherwise the contest that ended most recently.
 */
export function pickFeaturedContest(contests: readonly Contest[]): Contest | undefined {
  const latest = (status: Contest['status'], field: 'startTime' | 'endTime') =>
    contests
      .filter(contest => contest.status === status)
      .reduce<Contest | undefined>(
        (best, contest) =>
          !best || new Date(contest[field]).getTime() > new Date(best[field]).getTime()
            ? contest
            : best,
        undefined
      );
  return latest('live', 'startTime') ?? latest('ended', 'endTime');
}
