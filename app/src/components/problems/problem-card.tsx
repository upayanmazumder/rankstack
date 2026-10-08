import Link from 'next/link';
import { Code2, FileText, ListChecks } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { Problem } from '@/types';

import { DifficultyBadge } from './difficulty-badge';

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
  disabled?: boolean;
}

export function ProblemCard({ problem, disabled = false }: ProblemCardProps) {
  const Icon = TYPE_ICON[problem.type];
  const content = (
    <Card className="h-full transition-colors hover:border-ring/50">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 leading-tight font-semibold">{problem.title}</h3>
          <DifficultyBadge difficulty={problem.difficulty} />
        </div>
        {problem.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{problem.description}</p>
        )}
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="gap-1">
          <Icon className="size-3" />
          {TYPE_LABEL[problem.type]}
        </Badge>
        <Badge variant="secondary">{problem.points} pts</Badge>
        <span className="ml-auto text-xs text-muted-foreground">
          {problem.attemptCount} attempt{problem.attemptCount !== 1 ? 's' : ''}
        </span>
      </CardContent>
    </Card>
  );

  return disabled ? (
    <div aria-disabled="true" className="h-full opacity-65">
      {content}
    </div>
  ) : (
    <Link href={`/contests/${problem.contestId}/problems/${problem.id}`} className="block">
      {content}
    </Link>
  );
}
