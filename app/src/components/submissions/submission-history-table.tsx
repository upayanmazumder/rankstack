import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Submission } from '@/types';

import { resolveEntityTitle } from './submission-history-data';
import { SubmissionRow } from './submission-row';

interface SubmissionHistoryTableProps {
  submissions: Submission[];
  contestTitles: Record<string, string>;
  problemTitles: Record<string, string>;
}

export function SubmissionHistoryTable({
  submissions,
  contestTitles,
  problemTitles,
}: SubmissionHistoryTableProps) {
  return (
    <Table aria-label="Submission history" className="min-w-[760px]">
      <TableHeader>
        <TableRow>
          <TableHead>Problem Name</TableHead>
          <TableHead>Contest Name</TableHead>
          <TableHead>Submission Status</TableHead>
          <TableHead className="text-right">Score</TableHead>
          <TableHead>Submission Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {submissions.map(submission => (
          <SubmissionRow
            key={submission.id}
            submission={submission}
            problemTitle={resolveEntityTitle(problemTitles, submission.problemId, 'Problem')}
            contestTitle={resolveEntityTitle(contestTitles, submission.contestId, 'Contest')}
          />
        ))}
      </TableBody>
    </Table>
  );
}
