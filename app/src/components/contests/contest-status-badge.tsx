import { Badge } from '@/components/ui/badge';
import type { ContestStatus } from '@/types';

const STATUS_MAP: Record<
  ContestStatus,
  { label: string; variant: 'outline' | 'success' | 'muted' }
> = {
  upcoming: { label: 'Upcoming', variant: 'outline' },
  live: { label: 'Live', variant: 'success' },
  ended: { label: 'Ended', variant: 'muted' },
};

export function ContestStatusBadge({ status }: { status: ContestStatus }) {
  const { label, variant } = STATUS_MAP[status];
  return <Badge variant={variant}>{label}</Badge>;
}
