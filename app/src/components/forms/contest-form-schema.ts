import { z } from 'zod';

export const contestFormSchema = z
  .object({
    title: z.string().trim().min(1, 'Contest name is required.').max(200),
    description: z.string().trim(),
    startTime: z.string().min(1, 'Start date and time are required.'),
    endTime: z.string().min(1, 'End date and time are required.'),
  })
  .refine(values => new Date(values.startTime) < new Date(values.endTime), {
    message: 'End time must be after the start time.',
    path: ['endTime'],
  });

export type ContestFormValues = z.infer<typeof contestFormSchema>;
