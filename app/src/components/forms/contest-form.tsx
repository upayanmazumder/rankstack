'use client';

import { LoaderCircle } from 'lucide-react';

import { Button, Input, Label, Textarea } from '@/components/ui';
import { useZodForm } from '@/hooks/use-zod-form';

import { contestFormSchema } from './contest-form-schema';
import type { ContestFormValues } from './contest-form-schema';

interface ContestFormProps {
  defaultValues: ContestFormValues;
  submitLabel: string;
  isSubmitting?: boolean;
  onCancel?: () => void;
  onSubmit: (values: ContestFormValues) => void | Promise<void>;
}

export function ContestForm({
  defaultValues,
  submitLabel,
  isSubmitting = false,
  onCancel,
  onSubmit,
}: ContestFormProps) {
  const form = useZodForm(contestFormSchema, { defaultValues });

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FormField label="Contest name" error={form.formState.errors.title?.message}>
        <Input
          autoFocus
          aria-invalid={Boolean(form.formState.errors.title)}
          {...form.register('title')}
        />
      </FormField>
      <FormField label="Description" error={form.formState.errors.description?.message}>
        <Textarea rows={3} {...form.register('description')} />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Starts" error={form.formState.errors.startTime?.message}>
          <Input
            type="datetime-local"
            aria-invalid={Boolean(form.formState.errors.startTime)}
            {...form.register('startTime')}
          />
        </FormField>
        <FormField label="Ends" error={form.formState.errors.endTime?.message}>
          <Input
            type="datetime-local"
            aria-invalid={Boolean(form.formState.errors.endTime)}
            {...form.register('endTime')}
          />
        </FormField>
      </div>
      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <LoaderCircle className="animate-spin" />}
          {isSubmitting ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </form>
  );
}

function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </label>
  );
}
