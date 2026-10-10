'use client';

import { toast } from 'sonner';

import { isApiError } from '@/api';
import { ContestForm } from '@/components/forms';
import type { ContestFormValues } from '@/components/forms';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui';
import { useCreateContest, useUpdateContest } from '@/hooks/api';
import { useAuthStore } from '@/stores';
import type { Contest } from '@/types';

interface ContestDialogProps {
  open: boolean;
  contest: Contest | null;
  onOpenChange: (open: boolean) => void;
}

export function ContestDialog({ open, contest, onOpenChange }: ContestDialogProps) {
  const user = useAuthStore(state => state.user);
  const createContest = useCreateContest();
  const updateContest = useUpdateContest(contest?.id ?? '');
  const mutationPending = createContest.isPending || updateContest.isPending;
  const defaultValues = contest ? toContestFormValues(contest) : emptyContestValues();

  async function submit(values: ContestFormValues) {
    if (!user) return;
    const payload = {
      title: values.title,
      description: values.description,
      startTime: new Date(values.startTime).toISOString(),
      endTime: new Date(values.endTime).toISOString(),
    };
    try {
      if (contest) await updateContest.mutateAsync(payload);
      else await createContest.mutateAsync({ ...payload, createdBy: user.id });
      toast.success(contest ? 'Contest updated.' : 'Contest created.');
      onOpenChange(false);
    } catch (error) {
      toast.error(isApiError(error) ? error.message : 'Contest could not be saved.');
    }
  }

  return (
    <Dialog open={open} onOpenChange={next => !mutationPending && onOpenChange(next)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{contest ? 'Edit contest' : 'Create contest'}</DialogTitle>
          <DialogDescription>
            Set the competition window and participant-facing details.
          </DialogDescription>
        </DialogHeader>
        <ContestForm
          key={contest?.id ?? 'create'}
          defaultValues={defaultValues}
          submitLabel={contest ? 'Save changes' : 'Create contest'}
          isSubmitting={mutationPending}
          onCancel={() => onOpenChange(false)}
          onSubmit={submit}
        />
      </DialogContent>
    </Dialog>
  );
}

function emptyContestValues(): ContestFormValues {
  const start = new Date(Date.now() + 60 * 60 * 1000);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  return {
    title: '',
    description: '',
    startTime: toLocalDateTime(start),
    endTime: toLocalDateTime(end),
  };
}

function toContestFormValues(contest: Contest): ContestFormValues {
  return {
    title: contest.title,
    description: contest.description,
    startTime: toLocalDateTime(new Date(contest.startTime)),
    endTime: toLocalDateTime(new Date(contest.endTime)),
  };
}

function toLocalDateTime(date: Date): string {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
