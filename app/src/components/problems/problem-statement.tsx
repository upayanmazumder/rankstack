import { Braces, FileQuestion, Hash, ListChecks, Target } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Problem } from '@/types';

import { DifficultyBadge } from './difficulty-badge';

const TYPE_LABEL: Record<Problem['type'], string> = {
  mcq: 'Multiple choice',
  coding: 'Coding challenge',
  subjective: 'Written response',
};

const TYPE_ICON = {
  mcq: ListChecks,
  coding: Braces,
  subjective: FileQuestion,
} as const;

export function ProblemStatement({ problem }: { problem: Problem }) {
  const TypeIcon = TYPE_ICON[problem.type];

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <DifficultyBadge difficulty={problem.difficulty} />
            <Badge variant="outline" className="gap-1.5">
              <TypeIcon className="size-3.5" />
              {TYPE_LABEL[problem.type]}
            </Badge>
            <Badge variant="secondary" className="gap-1.5">
              <Target className="size-3.5" />
              {problem.points} points
            </Badge>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Problem statement
            </p>
            <CardTitle className="text-2xl leading-tight sm:text-3xl">{problem.title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-[15px] leading-7 whitespace-pre-wrap text-foreground/85">
            {problem.description || 'No additional problem description was provided.'}
          </div>
        </CardContent>
      </Card>

      {problem.type === 'coding' && <CodingDetails problem={problem} />}

      {problem.type === 'subjective' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Evaluation guidance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6">
            <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-muted-foreground">
              <Hash className="size-4" />
              Maximum response: {problem.wordLimit ?? 500} words
            </div>
            <p className="whitespace-pre-wrap text-foreground/80">
              {problem.evaluationRubric ||
                'Responses are reviewed for correctness, clarity, and supporting reasoning.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CodingDetails({ problem }: { problem: Problem }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Input format</CardTitle>
          </CardHeader>
          <CardContent className="font-mono text-sm leading-6 whitespace-pre-wrap text-foreground/80">
            {problem.inputFormat || 'Read input from standard input.'}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Constraints</CardTitle>
          </CardHeader>
          <CardContent className="font-mono text-sm leading-6 whitespace-pre-wrap text-foreground/80">
            {problem.constraints || 'No additional constraints were provided.'}
          </CardContent>
        </Card>
      </div>

      {!!problem.testCases?.length && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sample test cases</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {problem.testCases.map((testCase, index) => (
              <div key={`${testCase.input}-${index}`} className="rounded-lg border bg-muted/20 p-4">
                <p className="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  Example {index + 1}
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <CodeBlock label="Input" value={testCase.input} />
                  <CodeBlock label="Expected output" value={testCase.output} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CodeBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</p>
      <pre className="overflow-x-auto rounded-md bg-background p-3 font-mono text-xs leading-5">
        {value}
      </pre>
    </div>
  );
}
