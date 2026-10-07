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

export function LeaderboardTable({ entries }: { entries: LeaderboardEntry[] }) {
  if (entries.length === 0) {
    return <p className="py-12 text-center text-sm text-muted-foreground">No participants yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">#</TableHead>
          <TableHead>Participant ID</TableHead>
          <TableHead className="text-right">Score</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map(entry => (
          <TableRow key={entry.memberId}>
            <TableCell className={RANK_STYLES[entry.rank] ?? 'text-muted-foreground'}>
              {entry.rank}
            </TableCell>
            <TableCell className="font-mono text-sm">{entry.memberId}</TableCell>
            <TableCell className="text-right font-semibold tabular-nums">
              {entry.score.toLocaleString()}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
