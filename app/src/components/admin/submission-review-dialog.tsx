'use client';

import { toast } from 'sonner';

import { isApiError } from '@/api';
import { SubmissionReviewForm } from '@/components/forms';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui';
import { useUpdateSubmissionStatus } from '@/hooks/api';
import type { Problem, Submission } from '@/types';

interface SubmissionReviewDialogProps {
  submission: Submission | null;
  problem?: Problem;
  onOpenChange: (open: boolean) => void;
}

export function SubmissionReviewDialog({
  submission,
  problem,
  onOpenChange,
}: SubmissionReviewDialogProps) {
  const updateStatus = useUpdateSubmissionStatus(submission?.id ?? '');
  if (!submission) return null;
  const maxPoints = problem?.points ?? Math.max(submission.score, 0);

  async function submit(values: { status: Submission['status']; score: number }) {
    try {
      await updateStatus.mutateAsync(values);
      toast.success('Submission grade published.');
      onOpenChange(false);
    } catch (error) {
      toast.error(isApiError(error) ? error.message : 'Submission could not be graded.');
    }
  }

  return (
    <Dialog open onOpenChange={next => !updateStatus.isPending && onOpenChange(next)}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Review submission</DialogTitle>
          <DialogDescription>
            Compare the submitted answer with the problem statement, then publish an evaluation.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="space-y-3 rounded-lg border bg-muted/30 p-4">
            <div>
              <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                Problem
              </p>
              <h2 className="mt-1 font-semibold">{problem?.title ?? 'Unknown problem'}</h2>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              {problem?.description || 'Problem statement unavailable.'}
            </p>
            <p className="font-mono text-xs">Maximum: {maxPoints} points</p>
          </section>
          <section className="space-y-2 rounded-lg border p-4">
            <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
              Submitted answer
            </p>
            <pre className="max-h-64 overflow-auto rounded-md bg-muted p-3 font-mono text-xs whitespace-pre-wrap">
              {formatAnswer(submission.answer)}
            </pre>
          </section>
        </div>
        <SubmissionReviewForm
          maxPoints={maxPoints}
          defaultValues={{ status: submission.status, score: submission.score }}
          isSubmitting={updateStatus.isPending}
          onCancel={() => onOpenChange(false)}
          onSubmit={submit}
        />
      </DialogContent>
    </Dialog>
  );
}

export function formatAnswer(answer: unknown): string {
  if (typeof answer === 'string') return answer;
  try {
    return JSON.stringify(answer, null, 2);
  } catch {
    return String(answer);
  }
}
