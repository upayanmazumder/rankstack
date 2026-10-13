'use client';

import Link from 'next/link';

import { ContestStatusBadge } from '@/components/contests/contest-status-badge';
import { RankNumeral } from '@/components/leaderboard/rank-numeral';
import { ScoreCounter } from '@/components/leaderboard/score-counter';
import { Skeleton } from '@/components/ui/skeleton';
import { useLeaderboard } from '@/hooks/api/use-contests';
import { LIVE_CONTEST_POLL_INTERVAL_MS } from '@/lib/contest-polling';
import type { Contest } from '@/types';

const STACK_SIZE = 5;

interface LiveStackProps {
  contest: Contest | undefined;
  isPending: boolean;
}

/** Top of the featured contest's leaderboard. */
export function LiveStack({ contest, isPending }: LiveStackProps) {
  const isLive = contest?.status === 'live';
  const leaderboard = useLeaderboard(
    contest?.id ?? '',
    isLive ? LIVE_CONTEST_POLL_INTERVAL_MS : false,
    STACK_SIZE
  );

  if (isPending || (contest && leaderboard.isPending)) {
    return (
      <div role="status" aria-label="Loading standings" className="space-y-3">
        <Skeleton className="h-6 w-2/3" />
        {Array.from({ length: STACK_SIZE }, (_, index) => (
          <Skeleton key={index} className="h-14" />
        ))}
      </div>
    );
  }

  const entries = leaderboard.data ?? [];
  if (!contest || leaderboard.isError || entries.length === 0) {
    return (
      <div className="flex h-full flex-col justify-center gap-3 py-10">
        <p className="text-xl font-semibold">No standings yet</p>
        <p className="max-w-sm text-muted-foreground">
          Standings appear here when a contest goes live.
        </p>
        <Link
          href="/contests"
          className="w-fit rounded-sm font-medium text-foreground underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          Browse contests
        </Link>
      </div>
    );
  }

  return (
    <figure aria-labelledby="live-stack-caption">
      <div className="flex items-start justify-between gap-4 pb-4">
        <div className="min-w-0">
          <p id="live-stack-caption" className="truncate font-semibold">
            {contest.title}
          </p>
          <p className="text-sm text-muted-foreground">
            {isLive ? 'Current standings' : 'Final standings'}
          </p>
        </div>
        <ContestStatusBadge status={contest.status} />
      </div>

      <ol className="border-t border-border">
        {entries.map(entry => (
          <li
            key={entry.memberId}
            className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-x-4 border-b border-border py-3"
          >
            <RankNumeral rank={entry.rank} className="text-3xl" />
            <p className="truncate font-medium">{entry.participantName ?? entry.memberId}</p>
            <p className="text-right text-lg font-semibold tabular-nums">
              <ScoreCounter score={entry.score} size={18} />
              <span className="sr-only"> points</span>
            </p>
          </li>
        ))}
      </ol>

      <figcaption className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>
          {isLive
            ? `Refreshes every ${LIVE_CONTEST_POLL_INTERVAL_MS / 1_000} seconds.`
            : 'This contest has ended.'}
        </span>
        <Link
          href={`/contests/${contest.id}/leaderboard`}
          className="rounded-sm font-medium text-foreground underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          Open the full leaderboard
        </Link>
      </figcaption>
    </figure>
  );
}
