'use client';

import { use } from 'react';
import Link from 'next/link';
import { Radio } from 'lucide-react';

import { EmptyState } from '@/components/common/empty-state';
import { ContestStatusBadge } from '@/components/contests/contest-status-badge';
import { LeaderboardTable } from '@/components/leaderboard/leaderboard-table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useContest, useLeaderboard } from '@/hooks/api/use-contests';
import { useAuthStore } from '@/stores';

interface ContestLeaderboardRouteParams {
  id: string;
}

interface ContestLeaderboardPageProps {
  params: Promise<ContestLeaderboardRouteParams>;
}

export default function ContestLeaderboardPage({ params }: ContestLeaderboardPageProps) {
  const { id } = use(params);
  const contest = useContest(id);
  const leaderboard = useLeaderboard(id, 5_000, 100);
  const user = useAuthStore(state => state.user);

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
            <Button variant="outline" render={<Link href={`/contests/${id}`} />}>
              Back to contest
            </Button>
          }
        />
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-6xl flex-1 space-y-7 px-4 py-8 sm:px-6">
      <Link
        href={`/contests/${id}`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← {contest.data.title}
      </Link>
      <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <ContestStatusBadge status={contest.data.status} />
            {contest.data.status === 'live' && (
              <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest text-emerald-700 uppercase dark:text-emerald-400">
                <Radio className="size-3.5 animate-pulse" />
                Live updates
              </span>
            )}
          </div>
          <h1 className="text-3xl font-semibold">Leaderboard</h1>
          <p className="text-sm text-muted-foreground">{contest.data.title}</p>
        </div>
        <p role="status" className="text-sm text-muted-foreground">
          Refreshing every 5 seconds
        </p>
      </header>
      <LeaderboardTable entries={leaderboard.data ?? []} currentUserId={user?.id} />
    </section>
  );
}
