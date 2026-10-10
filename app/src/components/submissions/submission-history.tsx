'use client';

import { useMemo, useState } from 'react';

import { Card } from '@/components/ui/card';
import { useContests, useProblems, useSubmissionHistory } from '@/hooks/api';
import { useMounted } from '@/hooks/use-mounted';
import { useAuthStore } from '@/stores';

import { SubmissionFilters } from './submission-filters';
import {
  createTitleLookup,
  filterAndSortSubmissions,
  resolveEntityTitle,
} from './submission-history-data';
import type { SubmissionStatusFilter } from './submission-history-data';
import {
  SubmissionHistoryEmpty,
  SubmissionHistoryError,
  SubmissionHistoryPageShell,
  SubmissionHistorySkeleton,
  SubmissionHistoryUnavailable,
  SubmissionTableSkeleton,
} from './submission-history-layout';
import { SubmissionHistoryTable } from './submission-history-table';

export function SubmissionHistory() {
  const mounted = useMounted();
  const user = useAuthStore(state => state.user);

  if (!mounted) {
    return <SubmissionHistorySkeleton />;
  }

  if (!user) {
    return <SubmissionHistoryUnavailable />;
  }

  return <UserSubmissionHistory userId={user.id} />;
}

interface UserSubmissionHistoryProps {
  userId: string;
}

function UserSubmissionHistory({ userId }: UserSubmissionHistoryProps) {
  const [contestId, setContestId] = useState('all');
  const [status, setStatus] = useState<SubmissionStatusFilter>('all');
  const submissionsQuery = useSubmissionHistory(userId);
  const contestsQuery = useContests();
  const problemsQuery = useProblems();

  const submissions = useMemo(
    () =>
      filterAndSortSubmissions(submissionsQuery.data ?? [], {
        contestId,
        status,
      }),
    [contestId, status, submissionsQuery.data]
  );
  const contestTitles = useMemo(
    () => createTitleLookup(contestsQuery.data ?? []),
    [contestsQuery.data]
  );
  const problemTitles = useMemo(
    () => createTitleLookup(problemsQuery.data ?? []),
    [problemsQuery.data]
  );
  const contestOptions = useMemo(() => {
    const contestIds = new Set(
      (submissionsQuery.data ?? []).map(submission => submission.contestId)
    );
    return [...contestIds]
      .map(id => ({ id, title: resolveEntityTitle(contestTitles, id, 'Contest') }))
      .toSorted((left, right) => left.title.localeCompare(right.title));
  }, [contestTitles, submissionsQuery.data]);

  const total = submissionsQuery.data?.length ?? 0;
  const isLoading = submissionsQuery.isLoading;
  const isError = submissionsQuery.isError;
  const hasFilters = contestId !== 'all' || status !== 'all';

  function resetFilters() {
    setContestId('all');
    setStatus('all');
  }

  function retry() {
    void submissionsQuery.refetch();
  }

  return (
    <SubmissionHistoryPageShell total={total}>
      <Card className="overflow-hidden">
        <SubmissionFilters
          contests={contestOptions}
          contestId={contestId}
          status={status}
          onContestChange={setContestId}
          onStatusChange={setStatus}
        />

        {isLoading ? (
          <SubmissionTableSkeleton />
        ) : isError ? (
          <SubmissionHistoryError onRetry={retry} />
        ) : submissions.length === 0 ? (
          <SubmissionHistoryEmpty hasFilters={hasFilters} onClear={resetFilters} />
        ) : (
          <>
            <SubmissionHistoryTable
              submissions={submissions}
              contestTitles={contestTitles}
              problemTitles={problemTitles}
            />
            <div className="border-t px-4 py-3 text-xs text-muted-foreground sm:px-5">
              Showing {submissions.length} of {total} submission{total === 1 ? '' : 's'}, newest
              first.
            </div>
          </>
        )}
      </Card>
    </SubmissionHistoryPageShell>
  );
}
