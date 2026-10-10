'use client';

import { LoaderCircle } from 'lucide-react';

import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@/components/ui';
import { useZodForm } from '@/hooks/use-zod-form';
import type { Contest } from '@/types';

import { defaultProblemFormValues, problemFormSchema } from './problem-form-schema';
import type { ProblemFormValues } from './problem-form-schema';
import { ProblemVariantFields } from './problem-variant-fields';

interface ProblemFormProps {
  contests: Contest[];
  defaultValues?: Partial<ProblemFormValues>;
  isSubmitting?: boolean;
  onCancel?: () => void;
  onSubmit: (values: ProblemFormValues) => void | Promise<void>;
}

export function ProblemForm({
  contests,
  defaultValues,
  isSubmitting = false,
  onCancel,
  onSubmit,
}: ProblemFormProps) {
  const form = useZodForm(problemFormSchema, {
    defaultValues: { ...defaultProblemFormValues, ...defaultValues },
  });
  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Contest"
          value={form.watch('contestId')}
          onChange={value => form.setValue('contestId', value, { shouldValidate: true })}
          options={contests.map(contest => ({ value: contest.id, label: contest.title }))}
          error={form.formState.errors.contestId?.message}
        />
        <SelectField
          label="Problem type"
          value={form.watch('type')}
          onChange={value =>
            form.setValue('type', value as ProblemFormValues['type'], { shouldValidate: true })
          }
          options={[
            { value: 'mcq', label: 'Multiple choice' },
            { value: 'coding', label: 'Coding' },
            { value: 'subjective', label: 'Subjective' },
          ]}
        />
      </div>
      <label className="space-y-2">
        <Label>Title</Label>
        <Input aria-invalid={Boolean(form.formState.errors.title)} {...form.register('title')} />
        <FieldError message={form.formState.errors.title?.message} />
      </label>
      <label className="space-y-2">
        <Label>Description</Label>
        <Textarea rows={4} {...form.register('description')} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Difficulty"
          value={form.watch('difficulty')}
          onChange={value => form.setValue('difficulty', value as ProblemFormValues['difficulty'])}
          options={[
            { value: 'easy', label: 'Easy' },
            { value: 'medium', label: 'Medium' },
            { value: 'hard', label: 'Hard' },
          ]}
        />
        <label className="space-y-2">
          <Label>Points</Label>
          <Input
            type="number"
            min={1}
            step="0.5"
            {...form.register('points', { valueAsNumber: true })}
          />
          <FieldError message={form.formState.errors.points?.message} />
        </label>
      </div>
      <ProblemVariantFields form={form} />
      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting || contests.length === 0}>
          {isSubmitting && <LoaderCircle className="animate-spin" />}
          {isSubmitting ? 'Creating…' : 'Create problem'}
        </Button>
      </div>
    </form>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={next => next && onChange(next)}>
        <SelectTrigger aria-label={label} aria-invalid={Boolean(error)}>
          <SelectValue placeholder={`Choose ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FieldError message={error} />
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p role="alert" className="text-xs text-destructive">
      {message}
    </p>
  ) : null;
}
