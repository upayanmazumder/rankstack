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
    <TableRow>
      <TableCell className="font-medium">
        {onSelect ? (
          <button
            type="button"
            className="cursor-pointer rounded-sm text-left hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
            aria-label={`View submission for ${problemTitle ?? submission.problemId}`}
            onClick={() => onSelect(submission.id)}
          >
            {problemTitle ?? submission.problemId}
          </button>
        ) : (
          (problemTitle ?? submission.problemId)
        )}
      </TableCell>
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
