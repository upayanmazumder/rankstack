import { SubmissionStatusBadge } from '@/components/submissions';
import { Button, TableCell, TableRow } from '@/components/ui';
import type { Submission } from '@/types';
import { formatDateTime } from '@/utils';

interface SubmissionAdminRowProps {
  submission: Submission;
  submitterName: string;
  contestTitle: string;
  problemTitle: string;
  onReview: (submission: Submission) => void;
}

export function SubmissionAdminRow({
  submission,
  submitterName,
  contestTitle,
  problemTitle,
  onReview,
}: SubmissionAdminRowProps) {
  return (
    <TableRow>
      <TableCell>
        <p className="font-medium">{submitterName}</p>
        <p className="text-xs text-muted-foreground capitalize">{submission.submittedBy.refType}</p>
      </TableCell>
      <TableCell>
        <p>{problemTitle}</p>
        <p className="text-xs text-muted-foreground">{contestTitle}</p>
      </TableCell>
      <TableCell>
        <SubmissionStatusBadge status={submission.status} />
      </TableCell>
      <TableCell className="font-mono">{submission.score}</TableCell>
      <TableCell className="whitespace-nowrap">{formatDateTime(submission.submittedAt)}</TableCell>
      <TableCell className="text-right">
        <Button size="sm" variant="outline" onClick={() => onReview(submission)}>
          Review
        </Button>
      </TableCell>
    </TableRow>
  );
}
