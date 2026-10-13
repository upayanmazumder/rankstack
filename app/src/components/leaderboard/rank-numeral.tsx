import { cn } from '@/lib/utils';

interface RankNumeralProps {
  rank: number;
  className?: string;
}

/** Scoreboard numeral. The podium reads in full ink, the rest in grey. */
export function RankNumeral({ rank, className }: RankNumeralProps) {
  return (
    <span
      className={cn(
        'font-heading leading-none font-bold tabular-nums',
        rank <= 3 ? 'text-foreground' : 'text-muted-foreground',
        className
      )}
    >
      {rank}
    </span>
  );
}
