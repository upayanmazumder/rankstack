'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock3, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

import { isApiError } from '@/api';
import { SubmissionStatusBadge } from '@/components/submissions/submission-status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCreateSubmission, useProblem } from '@/hooks/api';
import { useMounted } from '@/hooks/use-mounted';
import { useAuthStore } from '@/stores';

import { ProblemStatement } from './problem-statement';
import { SolutionPanel } from './solution-panel';
import type { SolutionAnswer } from './solution-types';

interface ProblemWorkspaceProps {
  contestId: string;
  problemId: string;
}

export function ProblemWorkspace({ contestId, problemId }: ProblemWorkspaceProps) {
  const mounted = useMounted();
  const user = useAuthStore(state => state.user);
  const problemQuery = useProblem(problemId);
  const createSubmission = useCreateSubmission();

  async function submitSolution(answer: SolutionAnswer) {
    if (!user) {
      toast.error('Your session profile is unavailable. Sign in again to submit.');
      throw new Error('Missing session profile');
    }

    try {
      await createSubmission.mutateAsync({
        contestId: problemQuery.data?.contestId ?? contestId,
        problemId,
        submittedBy: { refType: 'user', refId: user.id },
        answer,
      });
      toast.success('Solution submitted for evaluation.');
    } catch (error) {
      const message = isApiError(error)
        ? error.status === 429
          ? 'Submission limit reached. Wait a moment and try again.'
          : error.message
        : 'The solution could not be submitted. Please try again.';
      toast.error(message);
      throw error;
    }
  }

  if (problemQuery.isLoading) {
    return <ProblemWorkspaceSkeleton />;
  }

  if (problemQuery.isError || !problemQuery.data) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 items-center px-4 py-16">
        <Card className="w-full">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <AlertTriangle className="size-10 text-destructive" />
            <div>
              <h1 className="text-lg font-semibold">Problem unavailable</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                The problem could not be loaded. It may have been removed or the API is offline.
              </p>
            </div>
            <Button variant="outline" onClick={() => problemQuery.refetch()}>
              <RotateCcw data-icon="inline-start" />
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const problem = problemQuery.data;
  const latestSubmission = createSubmission.data;

  return (
    <div className="flex-1 bg-muted/20">
      <div className="border-b bg-background">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <Link
            href={`/contests/${contestId}`}
            className="flex w-fit items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to contest
          </Link>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-xs text-muted-foreground">Problem {problem.id}</p>
              <h1 className="mt-1 text-lg font-semibold sm:text-xl">{problem.title}</h1>
            </div>
            <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              <Clock3 className="size-4" />
              {problem.attemptCount} recorded attempt{problem.attemptCount === 1 ? '' : 's'}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        {latestSubmission && (
          <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm">
            <CheckCircle2 className="size-5 text-green-600 dark:text-green-400" />
            <span className="font-medium">Latest submission received</span>
            <SubmissionStatusBadge status={latestSubmission.status} />
            <span className="ml-auto text-xs text-muted-foreground">
              Evaluation will update this submission when review is complete.
            </span>
          </div>
        )}

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(480px,1.05fr)]">
          <ProblemStatement problem={problem} />
          <SolutionPanel
            key={problem.id}
            problem={problem}
            isSubmitting={createSubmission.isPending}
            disabled={!mounted || !user}
            onSubmit={submitSolution}
          />
        </div>
      </div>
    </div>
  );
}

function ProblemWorkspaceSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1600px] flex-1 space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-2/3 max-w-xl" />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Skeleton className="h-[520px] w-full" />
        <Skeleton className="h-[520px] w-full" />
      </div>
    </div>
  );
}
