import { Badge } from '@/components/ui/badge';
import type { Difficulty } from '@/types';

const DIFFICULTY_MAP: Record<Difficulty, { label: string; className: string }> = {
  easy: {
    label: 'Easy',
    className: 'border-transparent bg-green-500/15 text-green-700 dark:text-green-400',
  },
  medium: {
    label: 'Medium',
    className: 'border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-400',
  },
  hard: {
    label: 'Hard',
    className: 'border-transparent bg-red-500/15 text-red-700 dark:text-red-400',
  },
};

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const { label, className } = DIFFICULTY_MAP[difficulty];
  return <Badge className={className}>{label}</Badge>;
}
