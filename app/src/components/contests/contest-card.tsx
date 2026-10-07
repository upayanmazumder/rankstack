import Link from 'next/link';
import { CalendarDays, Users } from 'lucide-react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { Contest } from '@/types';
import { formatDate } from '@/utils';

import { ContestStatusBadge } from './contest-status-badge';

export function ContestCard({ contest }: { contest: Contest }) {
  return (
    <Link href={`/contests/${contest.id}`} className="block">
      <Card className="transition-colors hover:border-ring/50">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-1 leading-tight font-semibold">{contest.title}</h3>
            <ContestStatusBadge status={contest.status} />
          </div>
          {contest.description && (
            <p className="line-clamp-2 text-sm text-muted-foreground">{contest.description}</p>
          )}
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <CalendarDays className="size-3.5" />
            {formatDate(contest.startTime)} – {formatDate(contest.endTime)}
          </span>
          <span className="flex items-center gap-1">
            <Users className="size-3.5" />
            {contest.participants.length} participant{contest.participants.length !== 1 ? 's' : ''}
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
