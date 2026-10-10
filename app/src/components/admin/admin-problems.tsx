'use client';

import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';

import { AdminPageShell } from '@/components/admin/admin-page-shell';
import {
  Button,
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
import { useContests, useProblems } from '@/hooks/api';

import { ProblemAdminRow } from './problem-admin-row';
import { ProblemDialog } from './problem-dialog';

export function AdminProblems() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [contestId, setContestId] = useState('all');
  const contests = useContests();
  const problems = useProblems();
  const contestNames = useMemo(
    () => new Map((contests.data ?? []).map(contest => [contest.id, contest.title])),
    [contests.data]
  );
  const visibleProblems = (problems.data ?? []).filter(
    problem => contestId === 'all' || problem.contestId === contestId
  );

  return (
    <AdminPageShell
      eyebrow="Question bank"
      title="Problem management"
      description="Author validated challenge variants and manage the problems attached to each contest."
      action={
        <Button onClick={() => setDialogOpen(true)} disabled={!contests.data?.length}>
          <Plus /> Create problem
        </Button>
      }
    >
      <Card>
        <CardContent className="space-y-4 p-4 sm:p-6">
          <label className="block max-w-xs space-y-2">
            <Label>Filter by contest</Label>
            <Select value={contestId} onValueChange={value => value && setContestId(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All contests</SelectItem>
                {(contests.data ?? []).map(contest => (
                  <SelectItem key={contest.id} value={contest.id}>
                    {contest.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          {problems.isPending ? (
            <p role="status" className="py-8 text-center text-sm text-muted-foreground">
              Loading problems…
            </p>
          ) : problems.isError ? (
            <p role="alert" className="py-8 text-center text-sm text-destructive">
              Problems could not be loaded.
            </p>
          ) : visibleProblems.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No problems match this contest.
            </p>
          ) : (
            <Table aria-label="Problem management" className="min-w-[700px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Problem</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleProblems.map(problem => (
                  <ProblemAdminRow
                    key={problem.id}
                    problem={problem}
                    contestTitle={contestNames.get(problem.contestId) ?? 'Unknown contest'}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <ProblemDialog
        open={dialogOpen}
        contests={contests.data ?? []}
        onOpenChange={setDialogOpen}
      />
    </AdminPageShell>
  );
}
