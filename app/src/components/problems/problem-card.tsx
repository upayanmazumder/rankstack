import Link from 'next/link';
import { Code2, FileText, ListChecks } from 'lucide-react';

import { SpotlightSurface } from '@/components/common/card-surfaces';
import { Badge } from '@/components/ui/badge';
import type { Problem } from '@/types';

import { DifficultyBadge } from './difficulty-badge';
import { ProblemLabel } from './problem-label';

const TYPE_ICON = {
  mcq: ListChecks,
  coding: Code2,
  subjective: FileText,
} as const;

const TYPE_LABEL: Record<Problem['type'], string> = {
  mcq: 'MCQ',
  coding: 'Coding',
  subjective: 'Subjective',
};

interface ProblemCardProps {
  problem: Problem;
  /** Position in the contest's problem order; sets the problem letter. */
  index?: number;
  disabled?: boolean;
}

export function ProblemCard({ problem, index, disabled = false }: ProblemCardProps) {
  const Icon = TYPE_ICON[problem.type];
  const content = (
    <SpotlightSurface className="flex flex-col gap-4">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            {index !== undefined && index >= 0 && <ProblemLabel index={index} />}
            <h3 className="line-clamp-1 text-lg leading-tight font-semibold">{problem.title}</h3>
          </div>
          <DifficultyBadge difficulty={problem.difficulty} />
        </div>
        {problem.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{problem.description}</p>
        )}
      </div>
      <div className="mt-auto flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="gap-1">
          <Icon className="size-3" />
          {TYPE_LABEL[problem.type]}
        </Badge>
        <Badge variant="secondary" className="tabular-nums">
          {problem.points} points
        </Badge>
        <span className="ml-auto text-xs text-muted-foreground">
          {problem.attemptCount} attempt{problem.attemptCount !== 1 ? 's' : ''}
        </span>
      </div>
    </SpotlightSurface>
  );

  return disabled ? (
    <div aria-disabled="true" className="h-full opacity-65">
      {content}
    </div>
  ) : (
    <Link
      href={`/contests/${problem.contestId}/problems/${problem.id}`}
      className="block h-full rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
    >
      {content}
    </Link>
  );
}
