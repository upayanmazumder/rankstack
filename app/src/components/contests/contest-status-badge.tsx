import { Badge } from '@/components/ui/badge';
import type { ContestStatus } from '@/types';

const STATUS_MAP: Record<
  ContestStatus,
  { label: string; variant: 'warning' | 'success' | 'muted' }
> = {
  upcoming: { label: 'Upcoming', variant: 'warning' },
  live: { label: 'Live', variant: 'success' },
  ended: { label: 'Ended', variant: 'muted' },
};

export function ContestStatusBadge({ status }: { status: ContestStatus }) {
  const { label, variant } = STATUS_MAP[status];
  return (
    <Badge variant={variant} className="gap-1.5">
      {status === 'live' && (
        <span className="relative inline-flex size-1.5 rounded-full bg-green-500">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-75" />
        </span>
      )}
      {label}
    </Badge>
  );
}
