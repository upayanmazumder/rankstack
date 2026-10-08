'use client';

import { useState, type FormEvent } from 'react';
import { Send, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Problem } from '@/types';

import { CodingSolution } from './coding-solution';
import { McqSolution } from './mcq-solution';
import { countWords, type CodingLanguage, type SolutionAnswer } from './solution-types';
import { SubjectiveSolution } from './subjective-solution';

interface SolutionPanelProps {
  problem: Problem;
  isSubmitting: boolean;
  disabled?: boolean;
  onSubmit: (answer: SolutionAnswer) => Promise<void>;
}

export function SolutionPanel({
  problem,
  isSubmitting,
  disabled = false,
  onSubmit,
}: SolutionPanelProps) {
  const [mcqAnswer, setMcqAnswer] = useState('');
  const [language, setLanguage] = useState<CodingLanguage>('python');
  const [sourceCode, setSourceCode] = useState('');
  const [subjectiveAnswer, setSubjectiveAnswer] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const wordCount = countWords(subjectiveAnswer);
  const wordLimit = problem.wordLimit ?? 500;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    let answer: SolutionAnswer;

    if (problem.type === 'mcq') {
      if (!mcqAnswer) {
        setValidationError('Select an answer before submitting.');
        return;
      }
      answer = mcqAnswer;
    } else if (problem.type === 'coding') {
      if (!sourceCode.trim()) {
        setValidationError('Add your source code before submitting.');
        return;
      }
      answer = { language, sourceCode: sourceCode.trim() };
    } else {
      if (!subjectiveAnswer.trim()) {
        setValidationError('Write a response before submitting.');
        return;
      }
      if (wordCount > wordLimit) {
        setValidationError(`Keep your response within ${wordLimit} words.`);
        return;
      }
      answer = subjectiveAnswer.trim();
    }

    setValidationError(null);
    try {
      await onSubmit(answer);
    } catch {
      // The parent owns API error messaging; keep the current draft available.
    }
  }

  return (
    <Card className="overflow-hidden xl:sticky xl:top-20">
      <CardHeader className="border-b bg-muted/30">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Your solution
            </p>
            <CardTitle className="text-lg">Submit for evaluation</CardTitle>
          </div>
          <ShieldCheck className="size-5 text-muted-foreground" aria-hidden="true" />
        </div>
      </CardHeader>
      <CardContent className="p-5 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {problem.type === 'mcq' && (
            <McqSolution
              options={problem.options ?? []}
              value={mcqAnswer}
              onChange={value => {
                setMcqAnswer(value);
                setValidationError(null);
              }}
            />
          )}

          {problem.type === 'coding' && (
            <CodingSolution
              language={language}
              sourceCode={sourceCode}
              onLanguageChange={setLanguage}
              onSourceCodeChange={value => {
                setSourceCode(value);
                setValidationError(null);
              }}
            />
          )}

          {problem.type === 'subjective' && (
            <SubjectiveSolution
              value={subjectiveAnswer}
              wordCount={wordCount}
              wordLimit={wordLimit}
              onChange={value => {
                setSubjectiveAnswer(value);
                setValidationError(null);
              }}
            />
          )}

          {validationError && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {validationError}
            </p>
          )}

          <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Submissions are final records, but you can submit another attempt.
            </p>
            <Button type="submit" size="lg" disabled={disabled || isSubmitting}>
              <Send data-icon="inline-start" />
              {isSubmitting ? 'Submitting...' : 'Submit solution'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
