import { TableCell, TableRow } from '@/components/ui/table';
import type { Submission } from '@/types';
import { formatDateTime } from '@/utils';

import { SubmissionStatusBadge } from './submission-status-badge';

interface SubmissionRowProps {
  submission: Submission;
  problemTitle?: string;
  onSelect?: (id: string) => void;
}

export function SubmissionRow({ submission, problemTitle, onSelect }: SubmissionRowProps) {
  return (
    <TableRow
      className={onSelect ? 'cursor-pointer' : undefined}
      onClick={onSelect ? () => onSelect(submission.id) : undefined}
    >
      <TableCell className="font-medium">{problemTitle ?? submission.problemId}</TableCell>
      <TableCell>
        <SubmissionStatusBadge status={submission.status} />
      </TableCell>
      <TableCell className="text-right">{submission.score}</TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {formatDateTime(submission.submittedAt)}
      </TableCell>
    </TableRow>
  );
}
