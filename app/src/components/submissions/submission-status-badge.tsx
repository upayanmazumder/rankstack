import { Badge } from '@/components/ui/badge';
import type { SubmissionStatus } from '@/types';

const STATUS_MAP: Record<
  SubmissionStatus,
  { label: string; variant: 'success' | 'destructive' | 'warning' | 'secondary' }
> = {
  correct: { label: 'Accepted', variant: 'success' },
  incorrect: { label: 'Rejected', variant: 'destructive' },
  partial: { label: 'Partial', variant: 'warning' },
  pending: { label: 'Pending', variant: 'secondary' },
};

export function SubmissionStatusBadge({ status }: { status: SubmissionStatus }) {
  const { label, variant } = STATUS_MAP[status];
  return <Badge variant={variant}>{label}</Badge>;
}
