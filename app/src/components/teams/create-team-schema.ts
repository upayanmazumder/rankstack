import { z } from 'zod';

export const createTeamSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Team name must be at least 2 characters.')
    .max(120, 'Team name must be 120 characters or fewer.'),
  memberEmail: z.union([z.literal(''), z.email('Enter a valid email address.')]),
});

export type CreateTeamFormValues = z.input<typeof createTeamSchema>;
