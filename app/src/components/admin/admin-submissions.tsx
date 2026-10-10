'use client';

import { useMemo, useState } from 'react';

import { AdminPageShell } from '@/components/admin/admin-page-shell';
import {
  Card,
  CardContent,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';
import { useContests, useProblems, useSubmissions, useTeams, useUsers } from '@/hooks/api';
import type { Submission, SubmissionStatus } from '@/types';

import { SubmissionAdminRow } from './submission-admin-row';
import { SubmissionReviewDialog } from './submission-review-dialog';

type StatusFilter = SubmissionStatus | 'all';

export function AdminSubmissions() {
  const [contestId, setContestId] = useState('all');
  const [status, setStatus] = useState<StatusFilter>('pending');
  const [selected, setSelected] = useState<Submission | null>(null);
  const submissions = useSubmissions();
  const contests = useContests();
  const problems = useProblems();
  const users = useUsers();
  const teams = useTeams();
  const lookups = useMemo(
    () => ({
      contests: new Map((contests.data ?? []).map(item => [item.id, item.title])),
      problems: new Map((problems.data ?? []).map(item => [item.id, item.title])),
      submitters: new Map([
        ...(users.data ?? []).map(item => [item.id, item.name] as const),
        ...(teams.data ?? []).map(item => [item.id, item.name] as const),
      ]),
    }),
    [contests.data, problems.data, teams.data, users.data]
  );
  const visible = (submissions.data ?? [])
    .filter(
      item =>
        (contestId === 'all' || item.contestId === contestId) &&
        (status === 'all' || item.status === status)
    )
    .sort((a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt));
  const selectedProblem = problems.data?.find(problem => problem.id === selected?.problemId);

  return (
    <AdminPageShell
      eyebrow="Evaluation queue"
      title="Submission adjudication"
      description="Inspect participant answers, assign evaluation states, and publish scores to the live leaderboard."
    >
      <Card>
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
            <Filter
              label="Contest"
              value={contestId}
              onChange={setContestId}
              options={[
                { value: 'all', label: 'All contests' },
                ...(contests.data ?? []).map(item => ({ value: item.id, label: item.title })),
              ]}
            />
            <Filter
              label="Evaluation status"
              value={status}
              onChange={value => setStatus(value as StatusFilter)}
              options={[
                { value: 'all', label: 'All statuses' },
                { value: 'pending', label: 'Pending' },
                { value: 'correct', label: 'Accepted' },
                { value: 'partial', label: 'Partial' },
                { value: 'incorrect', label: 'Rejected' },
              ]}
            />
          </div>
          {submissions.isPending ? (
            <p role="status" className="py-8 text-center text-sm text-muted-foreground">
              Loading submissions…
            </p>
          ) : submissions.isError ? (
            <p role="alert" className="py-8 text-center text-sm text-destructive">
              Submissions could not be loaded.
            </p>
          ) : visible.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No submissions match these filters.
            </p>
          ) : (
            <Table aria-label="Submission review queue" className="min-w-[900px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Submitter</TableHead>
                  <TableHead>Problem</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map(item => (
                  <SubmissionAdminRow
                    key={item.id}
                    submission={item}
                    submitterName={
                      lookups.submitters.get(item.submittedBy.refId) ??
                      item.submittedBy.refId.slice(0, 8)
                    }
                    contestTitle={lookups.contests.get(item.contestId) ?? 'Unknown contest'}
                    problemTitle={lookups.problems.get(item.problemId) ?? 'Unknown problem'}
                    onReview={setSelected}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <SubmissionReviewDialog
        submission={selected}
        problem={selectedProblem}
        onOpenChange={open => !open && setSelected(null)}
      />
    </AdminPageShell>
  );
}

function Filter({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={next => next && onChange(next)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}
