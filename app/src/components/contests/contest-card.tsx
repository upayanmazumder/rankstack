import Link from 'next/link';

import { LiveSurface, SpotlightSurface } from '@/components/common/card-surfaces';
import type { Contest } from '@/types';
import { formatDate } from '@/utils';

import { ContestStatusBadge } from './contest-status-badge';

export function ContestCard({ contest }: { contest: Contest }) {
  const participants = contest.participants.length;
  const Surface = contest.status === 'live' ? LiveSurface : SpotlightSurface;
  return (
    <Link
      href={`/contests/${contest.id}`}
      className="block h-full rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
    >
      <Surface className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 text-lg leading-snug font-semibold">{contest.title}</h3>
          <ContestStatusBadge status={contest.status} />
        </div>
        {contest.description && (
          <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
            {contest.description}
          </p>
        )}
        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 border-t border-border pt-4">
          <div className="text-sm text-muted-foreground">
            <p>
              {formatDate(contest.startTime)} to {formatDate(contest.endTime)}
            </p>
            <p>
              {contest.problemIds.length} problem{contest.problemIds.length !== 1 ? 's' : ''},{' '}
              {participants} participant{participants !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </Surface>
    </Link>
  );
}
