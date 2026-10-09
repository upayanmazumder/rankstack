import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import * as z from 'zod';

import { useZodForm } from '../use-zod-form';

const schema = z.object({ age: z.string().regex(/^\d+$/).transform(Number) });

describe('useZodForm', () => {
  it('accepts input defaults and submits the transformed output', async () => {
    const onSubmit = vi.fn<(data: { age: number }) => void>();
    const { result } = renderHook(() => useZodForm(schema, { defaultValues: { age: '12' } }));

    expect(result.current.getValues('age')).toBe('12');
    await act(async () => result.current.handleSubmit(onSubmit)());
    expect(onSubmit.mock.calls[0]?.[0]).toEqual({ age: 12 });
  });

  it('rejects invalid input before submitting', async () => {
    const onSubmit = vi.fn();
    const onInvalid = vi.fn();
    const { result } = renderHook(() =>
      useZodForm(schema, { defaultValues: { age: 'not a number' } })
    );

    await act(async () => result.current.handleSubmit(onSubmit, onInvalid)());
    expect(onSubmit).not.toHaveBeenCalled();
    expect(onInvalid.mock.calls[0]?.[0].age?.message).toBeDefined();
  });
});
