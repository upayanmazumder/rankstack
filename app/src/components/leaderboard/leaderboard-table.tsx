import { Check } from 'lucide-react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { LeaderboardEntry } from '@/types';

const RANK_STYLES: Record<number, string> = {
  1: 'text-amber-500 font-bold',
  2: 'text-zinc-400 font-bold',
  3: 'text-amber-700 font-bold',
};

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
}

export function LeaderboardTable({ entries, currentUserId }: LeaderboardTableProps) {
  if (entries.length === 0) {
    return <p className="py-12 text-center text-sm text-muted-foreground">No participants yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">Rank</TableHead>
          <TableHead>Participant</TableHead>
          <TableHead className="text-right">Score</TableHead>
          <TableHead className="text-right">Submissions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map(entry => (
          <TableRow
            key={entry.memberId}
            className={entry.memberId === currentUserId ? 'bg-primary/10' : undefined}
          >
            <TableCell className={RANK_STYLES[entry.rank] ?? 'text-muted-foreground'}>
              {entry.rank}
            </TableCell>
            <TableCell className="max-w-64 truncate font-medium">
              {entry.participantName ?? entry.memberId}
              {entry.memberId === currentUserId && (
                <span className="ml-2 inline-flex items-center gap-1 text-xs text-primary">
                  <Check className="size-3" />
                  You
                </span>
              )}
            </TableCell>
            <TableCell className="text-right font-semibold tabular-nums">
              {entry.score.toLocaleString()}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {entry.submissionCount ?? '—'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
