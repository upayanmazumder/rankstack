import { z } from 'zod';

export const addTeamMemberSchema = z.object({
  memberEmail: z.email('Enter a valid member email address.'),
});

export type AddTeamMemberFormValues = z.input<typeof addTeamMemberSchema>;
