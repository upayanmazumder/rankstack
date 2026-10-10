import { AlertTriangle, ListOrdered, RotateCcw } from 'lucide-react';

import { EmptyState } from '@/components/common/empty-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface SubmissionHistoryPageShellProps {
  children: React.ReactNode;
  total: number;
}

export function SubmissionHistoryPageShell({ children, total }: SubmissionHistoryPageShellProps) {
  return (
    <div className="flex-1 bg-muted/20">
      <div className="border-b bg-background">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase">
                Activity
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">Submission history</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
                Review your attempts, evaluation outcomes, and awarded scores.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm">
              <ListOrdered className="size-4 text-muted-foreground" />
              <span className="font-mono font-semibold">{total}</span>
              <span className="text-muted-foreground">total</span>
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
    </div>
  );
}

export function SubmissionHistorySkeleton() {
  return (
    <SubmissionHistoryPageShell total={0}>
      <Card className="overflow-hidden">
        <div className="grid gap-4 border-b p-5 sm:grid-cols-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
        <SubmissionTableSkeleton />
      </Card>
    </SubmissionHistoryPageShell>
  );
}

export function SubmissionTableSkeleton() {
  return (
    <div className="space-y-3 p-5" aria-label="Loading submission history">
      {Array.from({ length: 5 }, (_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
    </div>
  );
}

export function SubmissionHistoryUnavailable() {
  return (
    <SubmissionHistoryPageShell total={0}>
      <Card>
        <CardContent className="pt-6">
          <EmptyState
            title="Submission history unavailable"
            description="Your session profile is missing. Sign in again to view your submissions."
          />
        </CardContent>
      </Card>
    </SubmissionHistoryPageShell>
  );
}

interface SubmissionHistoryErrorProps {
  onRetry: () => void;
}

export function SubmissionHistoryError({ onRetry }: SubmissionHistoryErrorProps) {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
      <AlertTriangle className="size-10 text-destructive" />
      <div>
        <p className="font-medium">Submissions could not be loaded</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Check the API connection and try again.
        </p>
      </div>
      <Button variant="outline" onClick={onRetry}>
        <RotateCcw data-icon="inline-start" />
        Try again
      </Button>
    </div>
  );
}

interface SubmissionHistoryEmptyProps {
  hasFilters: boolean;
  onClear: () => void;
}

export function SubmissionHistoryEmpty({ hasFilters, onClear }: SubmissionHistoryEmptyProps) {
  return (
    <EmptyState
      title={hasFilters ? 'No submissions match these filters' : 'No submissions yet'}
      description={
        hasFilters
          ? 'Choose another contest or evaluation status.'
          : 'Your evaluated attempts will appear here after you submit a solution.'
      }
      action={
        hasFilters ? (
          <Button variant="outline" onClick={onClear}>
            Clear filters
          </Button>
        ) : undefined
      }
    />
  );
}
