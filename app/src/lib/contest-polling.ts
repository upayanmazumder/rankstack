import type { Contest } from '@/types';

export const LIVE_CONTEST_POLL_INTERVAL_MS = 30_000;
const MAX_TIMER_INTERVAL_MS = 2_147_483_647;

export function contestRefetchInterval(
  contest: Pick<Contest, 'status' | 'startTime'> | undefined,
  now = Date.now()
): number | false {
  if (!contest) return false;
  if (contest.status === 'live') return LIVE_CONTEST_POLL_INTERVAL_MS;
  if (contest.status === 'ended') return false;

  const untilStart = new Date(contest.startTime).getTime() - now;
  return Number.isFinite(untilStart) && untilStart > 0
    ? Math.min(untilStart, MAX_TIMER_INTERVAL_MS)
    : false;
}
