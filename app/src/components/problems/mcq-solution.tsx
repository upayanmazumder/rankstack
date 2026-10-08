import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';

interface McqSolutionProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}

export function McqSolution({ options, value, onChange }: McqSolutionProps) {
  return (
    <fieldset className="space-y-3">
      <legend className="mb-3 text-sm font-medium">Choose one answer</legend>
      {options.map((option, index) => {
        const selected = value === option;

        return (
          <label
            key={`${option}-${index}`}
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-lg border bg-background p-4 transition-colors hover:border-ring/60 hover:bg-muted/30',
              selected && 'border-ring bg-muted/50 ring-2 ring-ring/15'
            )}
          >
            <input
              type="radio"
              name="mcq-answer"
              value={option}
              checked={selected}
              onChange={() => onChange(option)}
              className="sr-only"
            />
            <span
              className={cn(
                'flex size-6 shrink-0 items-center justify-center rounded-md border text-xs font-semibold',
                selected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-muted text-muted-foreground'
              )}
              aria-hidden="true"
            >
              {selected ? <Check className="size-3.5" /> : String.fromCharCode(65 + index)}
            </span>
            <span className="pt-0.5 text-sm leading-5">{option}</span>
          </label>
        );
      })}
    </fieldset>
  );
}
