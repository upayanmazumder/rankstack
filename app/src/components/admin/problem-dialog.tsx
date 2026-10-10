'use client';

import { toast } from 'sonner';

import { isApiError } from '@/api';
import { ProblemForm } from '@/components/forms';
import type { ProblemFormValues } from '@/components/forms';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui';
import { useCreateProblem } from '@/hooks/api';
import type { Contest, ProblemCreate } from '@/types';

interface ProblemDialogProps {
  open: boolean;
  contests: Contest[];
  onOpenChange: (open: boolean) => void;
}

export function ProblemDialog({ open, contests, onOpenChange }: ProblemDialogProps) {
  const createProblem = useCreateProblem();

  async function submit(values: ProblemFormValues) {
    try {
      await createProblem.mutateAsync(toProblemCreate(values));
      toast.success('Problem created and linked to the contest.');
      onOpenChange(false);
    } catch (error) {
      toast.error(isApiError(error) ? error.message : 'Problem could not be created.');
    }
  }

  return (
    <Dialog open={open} onOpenChange={next => !createProblem.isPending && onOpenChange(next)}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Create problem</DialogTitle>
          <DialogDescription>
            Author a validated MCQ, coding, or subjective challenge.
          </DialogDescription>
        </DialogHeader>
        <ProblemForm
          key={open ? 'open' : 'closed'}
          contests={contests}
          isSubmitting={createProblem.isPending}
          onCancel={() => onOpenChange(false)}
          onSubmit={submit}
        />
      </DialogContent>
    </Dialog>
  );
}

function toProblemCreate(values: ProblemFormValues): ProblemCreate {
  const common = {
    contestId: values.contestId,
    type: values.type,
    title: values.title,
    description: values.description,
    difficulty: values.difficulty,
    points: values.points,
  };
  if (values.type === 'mcq')
    return {
      ...common,
      type: 'mcq',
      options: values.options.map(option => option.value),
      correctAnswer: values.correctAnswer,
    };
  if (values.type === 'coding')
    return {
      ...common,
      type: 'coding',
      inputFormat: values.inputFormat,
      constraints: values.constraints,
      testCases: values.testCases,
    };
  return {
    ...common,
    type: 'subjective',
    wordLimit: values.wordLimit,
    evaluationRubric: values.evaluationRubric,
  };
}
