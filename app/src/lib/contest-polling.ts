import type { Contest } from '@/types';

export const LIVE_CONTEST_POLL_INTERVAL_MS = 30_000;
const MAX_TIMER_INTERVAL_MS = 2_147_483_647;
// Fallback poll once a stale `upcoming` status's start time has passed — the
// backend flips status only on request, so a slow admin or client clock skew
// must not silence polling forever.
export const UPCOMING_GRACE_POLL_INTERVAL_MS = 5_000;

export function contestRefetchInterval(
  contest: Pick<Contest, 'status' | 'startTime'> | undefined,
  now = Date.now()
): number | false {
  if (!contest) return false;
  if (contest.status === 'live') return LIVE_CONTEST_POLL_INTERVAL_MS;
  if (contest.status === 'ended') return false;

  const untilStart = new Date(contest.startTime).getTime() - now;
  if (!Number.isFinite(untilStart)) return false;
  return untilStart > 0
    ? Math.min(untilStart, MAX_TIMER_INTERVAL_MS)
    : UPCOMING_GRACE_POLL_INTERVAL_MS;
}
