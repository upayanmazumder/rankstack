'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarDays, Clock3, Users } from 'lucide-react';
import { toast } from 'sonner';

import { isApiError } from '@/api';
import { EmptyState } from '@/components/common/empty-state';
import { ContestStatusBadge } from '@/components/contests/contest-status-badge';
import { ProblemCard } from '@/components/problems/problem-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAddParticipant, useContest, useLeaderboard } from '@/hooks/api/use-contests';
import { useProblems } from '@/hooks/api/use-problems';
import { useAuthStore } from '@/stores';
import { formatDateTime } from '@/utils';

interface ContestRouteParams {
  id: string;
}

interface ContestOverviewPageProps {
  params: Promise<ContestRouteParams>;
}

function formatCountdown(milliseconds: number) {
  const seconds = Math.max(0, Math.floor(milliseconds / 1_000));
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  const remainder = seconds % 60;
  return `${days}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(remainder).padStart(2, '0')}s`;
}

export default function ContestOverviewPage({ params }: ContestOverviewPageProps) {
  const { id } = use(params);
  const [now, setNow] = useState<number | null>(null);
  const user = useAuthStore(state => state.user);
  const contestQuery = useContest(id);
  const problemsQuery = useProblems(id);
  const leaderboardQuery = useLeaderboard(id, false);
  const join = useAddParticipant(id);
  const contestStatus = contestQuery.data?.status;
  const startTime = contestQuery.data ? new Date(contestQuery.data.startTime).getTime() : NaN;

  useEffect(() => {
    if (contestStatus !== 'upcoming' || !Number.isFinite(startTime)) {
      return;
    }

    const timer = window.setInterval(() => {
      const currentTime = Date.now();
      setNow(currentTime);
      if (currentTime >= startTime) window.clearInterval(timer);
    }, 1_000);

    return () => window.clearInterval(timer);
  }, [contestStatus, startTime]);

  if (contestQuery.isPending) {
    return (
      <section className="mx-auto w-full max-w-6xl flex-1 space-y-5 px-4 py-8">
        <Skeleton className="h-36" />
        <Skeleton className="h-10" />
        <Skeleton className="h-64" />
      </section>
    );
  }
  if (contestQuery.isError || !contestQuery.data) {
    return (
      <section className="mx-auto w-full max-w-6xl flex-1 px-4 py-12">
        <EmptyState
          title="Contest unavailable"
          description="This contest could not be found or loaded."
          action={<Button render={<Link href="/contests" />}>Browse contests</Button>}
        />
      </section>
    );
  }

  const contest = contestQuery.data;
  const isBeforeStart = now === null || now < startTime;
  const isUpcoming = contest.status === 'upcoming' && isBeforeStart;
  const joined =
    !!user &&
    contest.participants.some(
      participant => participant.refType === 'user' && participant.refId === user.id
    );
  const problemLinksDisabled = contest.status === 'upcoming';

  async function joinContest() {
    if (!user) {
      toast.error('Sign in to join this contest.');
      return;
    }
    try {
      await join.mutateAsync({ refType: 'user', refId: user.id });
      toast.success('You joined the contest.');
    } catch (error) {
      toast.error(isApiError(error) ? error.message : 'Could not join this contest.');
    }
  }

  return (
    <section className="mx-auto w-full max-w-6xl flex-1 space-y-7 px-4 py-8 sm:px-6">
      <Link href="/contests" className="text-sm text-muted-foreground hover:text-foreground">
        ← All contests
      </Link>
      <header className="space-y-5 border-b border-border pb-6">
        <div className="flex flex-wrap items-center gap-3">
          <ContestStatusBadge status={contest.status} />
          <span className="text-sm text-muted-foreground">
            {contest.participants.length} participants
          </span>
        </div>
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl space-y-3">
            <h1 className="text-3xl font-semibold">{contest.title}</h1>
            <p className="text-muted-foreground">
              {contest.description || 'A Rankstack competition.'}
            </p>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="size-4" />
                Starts {formatDateTime(contest.startTime)}
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock3 className="size-4" />
                Ends {formatDateTime(contest.endTime)}
              </span>
              <span className="inline-flex items-center gap-2">
                <Users className="size-4" />
                {contest.participants.length} joined
              </span>
            </div>
          </div>
          <Button
            onClick={joinContest}
            disabled={joined || join.isPending || contest.status === 'ended'}
          >
            {joined
              ? 'Joined'
              : join.isPending
                ? 'Joining…'
                : contest.status === 'ended'
                  ? 'Contest ended'
                  : 'Join contest'}
          </Button>
        </div>
      </header>

      {isUpcoming && (
        <div className="border-l-2 border-amber-500 bg-amber-500/5 px-4 py-3 text-sm">
          <span className="font-medium">Problems unlock when the contest goes live.</span> The
          schedule begins {formatDateTime(contest.startTime)}.
          {now !== null && (
            <p role="timer" className="mt-1 font-mono tabular-nums">
              Starts in {formatCountdown(startTime - now)}
            </p>
          )}
        </div>
      )}

      <Tabs defaultValue="overview">
        <TabsList className="max-w-full overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="problems">Problems</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-5 pt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardContent className="space-y-2 p-5">
                <h2 className="font-semibold">Contest guide</h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  Join before the start, solve the listed problems during the contest window, and
                  track your standing on the live leaderboard.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-2 p-5">
                <h2 className="font-semibold">Schedule</h2>
                <p className="text-sm text-muted-foreground">
                  Starts: {formatDateTime(contest.startTime)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Ends: {formatDateTime(contest.endTime)}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="problems" className="pt-4">
          {problemsQuery.isPending ? (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 3 }, (_, index) => (
                <Skeleton key={index} className="h-36" />
              ))}
            </div>
          ) : problemsQuery.isError ? (
            <p role="alert" className="py-8 text-center text-sm text-destructive">
              Problems could not be loaded.
            </p>
          ) : problemsQuery.data.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {problemsQuery.data.map(problem => (
                <ProblemCard key={problem.id} problem={problem} disabled={problemLinksDisabled} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No problems yet"
              description="Problem statements will appear here."
            />
          )}
        </TabsContent>
        <TabsContent value="leaderboard" className="pt-4">
          <Card>
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold">Leaderboard preview</h2>
                  <p className="text-sm text-muted-foreground">Top competitors in this contest</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  render={
                    <Link href={`/contests/${id}/leaderboard`}>
                      Full leaderboard <ArrowRight />
                    </Link>
                  }
                />
              </div>
              {leaderboardQuery.data?.slice(0, 10).length ? (
                <ol className="divide-y divide-border">
                  {leaderboardQuery.data.slice(0, 10).map(entry => (
                    <li
                      key={entry.memberId}
                      className="flex items-center justify-between py-3 text-sm"
                    >
                      <span>
                        <span className="mr-4 font-mono text-muted-foreground">
                          {String(entry.rank).padStart(2, '0')}
                        </span>
                        {entry.participantName ?? entry.memberId}
                      </span>
                      <span className="font-semibold tabular-nums">
                        {entry.score.toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">No rankings yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </section>
  );
}
