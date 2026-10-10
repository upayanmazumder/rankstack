'use client';

import { useMemo } from 'react';
import { LoaderCircle } from 'lucide-react';
import { z } from 'zod';

import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { useZodForm } from '@/hooks/use-zod-form';
import type { SubmissionStatus } from '@/types';

interface SubmissionReviewValues {
  status: SubmissionStatus;
  score: number;
}

interface SubmissionReviewFormProps {
  maxPoints: number;
  defaultValues: SubmissionReviewValues;
  isSubmitting?: boolean;
  onCancel?: () => void;
  onSubmit: (values: SubmissionReviewValues) => void | Promise<void>;
}

export function SubmissionReviewForm({
  maxPoints,
  defaultValues,
  isSubmitting = false,
  onCancel,
  onSubmit,
}: SubmissionReviewFormProps) {
  const schema = useMemo(
    () =>
      z.object({
        status: z.enum(['pending', 'correct', 'incorrect', 'partial']),
        score: z.number().min(0).max(maxPoints, `Score cannot exceed ${maxPoints}.`),
      }),
    [maxPoints]
  );
  const form = useZodForm(schema, { defaultValues });

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <label className="space-y-2">
        <Label>Evaluation status</Label>
        <Select
          value={form.watch('status')}
          onValueChange={value => value && form.setValue('status', value as SubmissionStatus)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="correct">Accepted</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="incorrect">Rejected</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </label>
      <label className="space-y-2">
        <Label>Awarded score (maximum {maxPoints})</Label>
        <Input
          type="number"
          min={0}
          max={maxPoints}
          step="0.5"
          aria-invalid={Boolean(form.formState.errors.score)}
          {...form.register('score', { valueAsNumber: true })}
        />
        {form.formState.errors.score?.message && (
          <p role="alert" className="text-xs text-destructive">
            {form.formState.errors.score.message}
          </p>
        )}
      </label>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <LoaderCircle className="animate-spin" />}
          {isSubmitting ? 'Publishing…' : 'Publish grade'}
        </Button>
      </div>
    </form>
  );
}
