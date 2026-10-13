'use client';

import { m, useReducedMotion } from 'framer-motion';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DURATION, EASE } from '@/lib/motion';
import { cn } from '@/lib/utils';
import type { LeaderboardEntry } from '@/types';

import { LeaderBorder } from './leader-border';
import { RankNumeral } from './rank-numeral';
import { ScoreCounter } from './score-counter';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
}

export function LeaderboardTable({ entries, currentUserId }: LeaderboardTableProps) {
  const reduceMotion = useReducedMotion();

  if (entries.length === 0) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        No one has scored yet. The first judged submission starts the board.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-20">Rank</TableHead>
          <TableHead>Participant</TableHead>
          <TableHead className="text-right">Submissions</TableHead>
          <TableHead className="text-right">Score</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map(entry => {
          const isCurrentUser = entry.memberId === currentUserId;
          return (
            <m.tr
              key={entry.memberId}
              data-slot="table-row"
              aria-current={isCurrentUser ? 'true' : undefined}
              layout={reduceMotion ? false : 'position'}
              transition={{ layout: { duration: DURATION.base, ease: EASE.out } }}
              className={cn(
                'relative border-b transition-colors hover:bg-muted/50',
                isCurrentUser && 'shadow-[inset_3px_0_0_var(--primary)]'
              )}
            >
              <TableCell className="py-3">
                {entry.rank === 1 && <LeaderBorder />}
                <RankNumeral rank={entry.rank} className="text-3xl" />
              </TableCell>
              <TableCell className="max-w-64 truncate text-base font-medium">
                {entry.participantName ?? entry.memberId}
                {isCurrentUser && (
                  <span className="ml-2 rounded-sm border border-border px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                    You
                  </span>
                )}
              </TableCell>
              <TableCell className="text-right text-muted-foreground tabular-nums">
                {entry.submissionCount ?? '—'}
              </TableCell>
              <TableCell className="text-right text-lg font-semibold tabular-nums">
                <ScoreCounter score={entry.score} size={18} />
              </TableCell>
            </m.tr>
          );
        })}
      </TableBody>
    </Table>
  );
}
