import { Code2, Terminal } from 'lucide-react';

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import type { CodingLanguage } from './solution-types';

interface CodingSolutionProps {
  language: CodingLanguage;
  sourceCode: string;
  onLanguageChange: (language: CodingLanguage) => void;
  onSourceCodeChange: (sourceCode: string) => void;
}

const LANGUAGE_OPTIONS: Array<{ value: CodingLanguage; label: string }> = [
  { value: 'python', label: 'Python 3.12' },
  { value: 'javascript', label: 'JavaScript (Node 22)' },
  { value: 'cpp', label: 'C++20' },
];

export function CodingSolution({
  language,
  sourceCode,
  onLanguageChange,
  onSourceCodeChange,
}: CodingSolutionProps) {
  return (
    <div className="overflow-hidden rounded-xl border bg-background">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/40 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Terminal className="size-4 text-muted-foreground" />
          Solution editor
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="coding-language" className="sr-only">
            Programming language
          </Label>
          <select
            id="coding-language"
            value={language}
            onChange={event => onLanguageChange(event.target.value as CodingLanguage)}
            className="h-8 rounded-md border border-input bg-background px-2 text-xs font-medium outline-none focus:ring-2 focus:ring-ring"
          >
            {LANGUAGE_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="relative">
        <Code2 className="pointer-events-none absolute top-4 left-4 size-4 text-muted-foreground" />
        <Label htmlFor="source-code" className="sr-only">
          Source code
        </Label>
        <Textarea
          id="source-code"
          value={sourceCode}
          onChange={event => onSourceCodeChange(event.target.value)}
          placeholder="Write your solution here..."
          spellCheck={false}
          className="min-h-[360px] resize-y rounded-none border-0 py-4 pr-4 pl-11 font-mono text-[13px] leading-6 shadow-none focus-visible:ring-0"
        />
      </div>
      <div className="border-t bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
        Code is submitted for review. Automated execution is not enabled yet.
      </div>
    </div>
  );
}
