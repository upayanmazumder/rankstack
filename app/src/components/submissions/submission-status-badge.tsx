'use client';

import StatusMark from '@/components/react-bits/status-mark';
import { Badge } from '@/components/ui/badge';
import { usePalette } from '@/hooks/use-palette';
import type { SubmissionStatus } from '@/types';

const STATUS_MAP: Record<
  Exclude<SubmissionStatus, 'pending'>,
  { label: string; variant: 'success' | 'destructive' | 'warning' }
> = {
  correct: { label: 'Accepted', variant: 'success' },
  incorrect: { label: 'Rejected', variant: 'destructive' },
  partial: { label: 'Partial', variant: 'warning' },
};

export function SubmissionStatusBadge({ status }: { status: SubmissionStatus }) {
  const palette = usePalette();

  if (status === 'pending') {
    // A spinning arc shows that the judge has not marked this submission yet.
    return (
      <Badge variant="outline">
        <StatusMark
          status="running"
          label={<span className="ml-1 text-foreground">Pending</span>}
          size={11}
          strokeWidth={3}
          fontSize={12}
          strike={false}
          color={palette.accent}
        />
      </Badge>
    );
  }

  const { label, variant } = STATUS_MAP[status];
  return <Badge variant={variant}>{label}</Badge>;
}
