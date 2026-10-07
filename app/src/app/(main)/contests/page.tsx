'use client';

import { EmptyState } from '@/components/common/empty-state';
import { ContestStatusBadge } from '@/components/contests/contest-status-badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useContests } from '@/hooks/api/use-contests';
import { formatDate } from '@/utils';

export default function ContestsPage() {
  const { data: contests, isPending, isError } = useContests();

  return (
    <section className="mx-auto w-full max-w-5xl flex-1 space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold">Contests</h1>
        <p className="text-sm text-muted-foreground">Browse upcoming, live, and ended contests.</p>
      </div>
      {isPending ? (
        <p role="status">Loading contests…</p>
      ) : isError ? (
        <p role="alert">Contests could not be loaded. Please try again later.</p>
      ) : contests.length === 0 ? (
        <EmptyState
          title="No contests yet"
          description="Contests will appear here when available."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {contests.map(contest => (
            <Card key={contest.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-3">
                <h2 className="font-semibold">{contest.title}</h2>
                <ContestStatusBadge status={contest.status} />
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                {contest.description && <p>{contest.description}</p>}
                <p>
                  {formatDate(contest.startTime)} – {formatDate(contest.endTime)}
                </p>
                <p>
                  {contest.participants.length} participant
                  {contest.participants.length === 1 ? '' : 's'}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
