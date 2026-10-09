import { FileText } from 'lucide-react';

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface SubjectiveSolutionProps {
  value: string;
  wordCount: number;
  wordLimit: number;
  onChange: (value: string) => void;
}

export function SubjectiveSolution({
  value,
  wordCount,
  wordLimit,
  onChange,
}: SubjectiveSolutionProps) {
  const overLimit = wordCount > wordLimit;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor="subjective-answer" className="flex items-center gap-2">
          <FileText className="size-4 text-muted-foreground" />
          Written response
        </Label>
        <span
          className={cn(
            'font-mono text-xs text-muted-foreground tabular-nums',
            overLimit && 'font-semibold text-destructive'
          )}
          aria-live="polite"
        >
          {wordCount} / {wordLimit} words
        </span>
      </div>
      <Textarea
        id="subjective-answer"
        value={value}
        onChange={event => onChange(event.target.value)}
        aria-invalid={overLimit}
        placeholder="Develop your answer with clear reasoning and relevant examples..."
        className="min-h-[320px] resize-y leading-6"
      />
      <p className={cn('text-xs text-muted-foreground', overLimit && 'text-destructive')}>
        {overLimit
          ? `Shorten your response by ${wordCount - wordLimit} word${wordCount - wordLimit === 1 ? '' : 's'}.`
          : 'Your response will be saved exactly as written and reviewed by an evaluator.'}
      </p>
    </div>
  );
}
