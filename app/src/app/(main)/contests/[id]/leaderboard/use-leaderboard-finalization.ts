import { useEffect, useRef } from 'react';

import type { ContestStatus } from '@/types';

// The contest and leaderboard queries resolve independently, so the contest
// can report `ended` before the last live poll captured the final scores.
// Fetch once more on that transition instead of trusting the last poll.
export function useLeaderboardFinalization(
  status: ContestStatus | undefined,
  refetch: () => unknown
) {
  const previousStatusRef = useRef<ContestStatus | undefined>(undefined);

  useEffect(() => {
    const previousStatus = previousStatusRef.current;
    previousStatusRef.current = status;
    if (previousStatus && previousStatus !== 'ended' && status === 'ended') {
      void refetch();
    }
  }, [status, refetch]);
}
