import { Badge } from '@/components/ui/badge';
import type { Difficulty } from '@/types';

const DIFFICULTY_MAP: Record<Difficulty, { label: string; className: string }> = {
  easy: {
    label: 'Easy',
    className: 'text-muted-foreground',
  },
  medium: {
    label: 'Medium',
    className: 'text-muted-foreground',
  },
  hard: {
    label: 'Hard',
    className: 'text-muted-foreground',
  },
};

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const { label, className } = DIFFICULTY_MAP[difficulty];
  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
}
