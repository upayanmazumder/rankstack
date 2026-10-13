'use client';

import { use } from 'react';
import Link from 'next/link';

import { EmptyState } from '@/components/common/empty-state';
import { ContestStatusBadge } from '@/components/contests/contest-status-badge';
import { LeaderboardTable } from '@/components/leaderboard/leaderboard-table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useContest, useLeaderboard } from '@/hooks/api/use-contests';
import { LIVE_CONTEST_POLL_INTERVAL_MS } from '@/lib/contest-polling';
import { useAuthStore } from '@/stores';

import { useLeaderboardFinalization } from './use-leaderboard-finalization';

interface ContestLeaderboardRouteParams {
  id: string;
}

interface ContestLeaderboardPageProps {
  params: Promise<ContestLeaderboardRouteParams>;
}

export default function ContestLeaderboardPage({ params }: ContestLeaderboardPageProps) {
  const { id } = use(params);
  const contest = useContest(id);
  const status = contest.data?.status;
  const isLive = status === 'live';
  const leaderboard = useLeaderboard(id, isLive ? LIVE_CONTEST_POLL_INTERVAL_MS : false, 100);
  const user = useAuthStore(state => state.user);

  useLeaderboardFinalization(status, leaderboard.refetch);

  if (contest.isPending || leaderboard.isPending) {
    return (
      <section className="mx-auto w-full max-w-6xl flex-1 space-y-5 px-4 py-8">
        <Skeleton className="h-24" />
        <Skeleton className="h-80" />
      </section>
    );
  }
  if (contest.isError || !contest.data || leaderboard.isError) {
    return (
      <section className="mx-auto w-full max-w-6xl flex-1 px-4 py-12">
        <EmptyState
          title="Leaderboard unavailable"
          description="The contest rankings could not be loaded."
          action={
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href={`/contests/${id}`} />}
            >
              Back to contest
            </Button>
          }
        />
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-6xl flex-1 space-y-8 px-4 py-8 sm:px-6">
      <Link
        href={`/contests/${id}`}
        className="rounded-sm text-sm text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        Back to contest
      </Link>
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <ContestStatusBadge status={contest.data.status} />
          <h1 className="text-4xl leading-tight font-bold sm:text-5xl">{contest.data.title}</h1>
          <p className="text-muted-foreground">Leaderboard</p>
        </div>
        <p role="status" className="shrink-0 text-sm text-muted-foreground sm:text-right">
          {isLive
            ? `Refreshes every ${LIVE_CONTEST_POLL_INTERVAL_MS / 1_000} seconds`
            : contest.data.status === 'ended'
              ? 'Final standings'
              : 'Updates begin when the contest goes live'}
        </p>
      </header>
      <LeaderboardTable entries={leaderboard.data ?? []} currentUserId={user?.id} />
    </section>
  );
}
