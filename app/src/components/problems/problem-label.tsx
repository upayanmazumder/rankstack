import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';
import { problemLetter } from '@/utils';

interface ProblemLabelProps extends ComponentProps<'span'> {
  index: number;
}

/** Contest problem letter (A, B, C…) in scoreboard order. */
export function ProblemLabel({ index, className, ...props }: ProblemLabelProps) {
  return (
    <span
      {...props}
      className={cn(
        'inline-flex size-7 shrink-0 items-center justify-center rounded-sm border border-border text-sm leading-none font-semibold text-muted-foreground',
        className
      )}
    >
      <span className="sr-only">Problem </span>
      {problemLetter(index)}
    </span>
  );
}
