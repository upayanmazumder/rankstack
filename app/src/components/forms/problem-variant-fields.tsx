'use client';

import { Plus, Trash2 } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import { useFieldArray } from 'react-hook-form';

import { Button, Input, Label, Textarea } from '@/components/ui';

import type { ProblemFormValues } from './problem-form-schema';

export function ProblemVariantFields({ form }: { form: UseFormReturn<ProblemFormValues> }) {
  const type = form.watch('type');
  const options = useFieldArray({ control: form.control, name: 'options' });
  const testCases = useFieldArray({ control: form.control, name: 'testCases' });

  if (type === 'mcq') {
    return (
      <fieldset className="space-y-3 rounded-lg border p-4">
        <legend className="px-1 text-sm font-medium">Answer options</legend>
        {options.fields.map((field, index) => (
          <div key={field.id} className="flex items-start gap-2">
            <input
              className="mt-3 size-4 accent-primary"
              type="radio"
              aria-label={`Mark option ${index + 1} correct`}
              value={form.watch(`options.${index}.value`)}
              {...form.register('correctAnswer')}
            />
            <Input
              aria-label={`Option ${index + 1}`}
              placeholder={`Option ${index + 1}`}
              {...form.register(`options.${index}.value`)}
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label={`Remove option ${index + 1}`}
              disabled={options.fields.length <= 2}
              onClick={() => options.remove(index)}
            >
              <Trash2 />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => options.append({ value: '' })}
        >
          <Plus /> Add option
        </Button>
        {form.formState.errors.correctAnswer?.message && (
          <p role="alert" className="text-xs text-destructive">
            {form.formState.errors.correctAnswer.message}
          </p>
        )}
      </fieldset>
    );
  }

  if (type === 'coding') {
    return (
      <div className="space-y-4">
        <label className="space-y-2">
          <Label>Input format</Label>
          <Textarea rows={2} {...form.register('inputFormat')} />
        </label>
        <label className="space-y-2">
          <Label>Constraints</Label>
          <Textarea rows={2} {...form.register('constraints')} />
        </label>
        <fieldset className="space-y-3 rounded-lg border p-4">
          <legend className="px-1 text-sm font-medium">Test cases</legend>
          {testCases.fields.map((field, index) => (
            <div key={field.id} className="grid gap-2 rounded-md bg-muted/40 p-3 sm:grid-cols-2">
              <Textarea
                aria-label={`Test case ${index + 1} input`}
                placeholder="Input"
                {...form.register(`testCases.${index}.input`)}
              />
              <div className="flex gap-2">
                <Textarea
                  aria-label={`Test case ${index + 1} output`}
                  placeholder="Expected output"
                  {...form.register(`testCases.${index}.output`)}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label={`Remove test case ${index + 1}`}
                  disabled={testCases.fields.length <= 1}
                  onClick={() => testCases.remove(index)}
                >
                  <Trash2 />
                </Button>
              </div>
            </div>
          ))}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => testCases.append({ input: '', output: '' })}
          >
            <Plus /> Add test case
          </Button>
          {form.formState.errors.testCases?.root?.message && (
            <p role="alert" className="text-xs text-destructive">
              {form.formState.errors.testCases.root.message}
            </p>
          )}
        </fieldset>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
      <label className="space-y-2">
        <Label>Word limit</Label>
        <Input type="number" min={1} {...form.register('wordLimit', { valueAsNumber: true })} />
      </label>
      <label className="space-y-2">
        <Label>Evaluation rubric</Label>
        <Textarea rows={4} {...form.register('evaluationRubric')} />
        {form.formState.errors.evaluationRubric?.message && (
          <p role="alert" className="text-xs text-destructive">
            {form.formState.errors.evaluationRubric.message}
          </p>
        )}
      </label>
    </div>
  );
}
