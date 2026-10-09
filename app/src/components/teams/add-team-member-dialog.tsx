'use client';

import { useState } from 'react';
import { LoaderCircle, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

import { isApiError } from '@/api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAddTeamMember } from '@/hooks/api';
import { useZodForm } from '@/hooks/use-zod-form';
import type { User } from '@/types';

import { addTeamMemberSchema } from './add-team-member-schema';
import type { AddTeamMemberFormValues } from './add-team-member-schema';
import { MemberEmailField } from './member-email-field';

interface AddTeamMemberDialogProps {
  teamId: string;
  candidates: User[];
}

export function AddTeamMemberDialog({ teamId, candidates }: AddTeamMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const addMember = useAddTeamMember(teamId);
  const form = useZodForm(addTeamMemberSchema, { defaultValues: { memberEmail: '' } });
  const memberEmail = form.watch('memberEmail');

  function setDialogOpen(nextOpen: boolean) {
    if (addMember.isPending) return;
    setOpen(nextOpen);
    if (!nextOpen) form.reset();
  }

  async function submit(values: AddTeamMemberFormValues) {
    const email = values.memberEmail.trim().toLowerCase();
    const selectedUser = candidates.find(user => user.email.toLowerCase() === email);
    if (!selectedUser) {
      form.setError('memberEmail', { message: 'Select a matching user email.' });
      return;
    }

    try {
      await addMember.mutateAsync(selectedUser.id);
      toast.success(`${selectedUser.name} was added to the roster.`);
      setDialogOpen(false);
    } catch (error) {
      toast.error(isApiError(error) ? error.message : 'Member could not be added.');
    }
  }

  return (
    <Dialog open={open} onOpenChange={setDialogOpen}>
      <DialogTrigger
        render={
          <Button>
            <UserPlus data-icon="inline-start" />
            Add member
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a team member</DialogTitle>
          <DialogDescription>
            Search the user directory by email and add one person to this roster.
          </DialogDescription>
        </DialogHeader>
        <form className="mt-4 space-y-5" onSubmit={form.handleSubmit(submit)} noValidate>
          <MemberEmailField
            registration={form.register('memberEmail')}
            users={candidates}
            value={memberEmail}
            error={form.formState.errors.memberEmail?.message}
            readOnly={false}
            label="Member email"
            helpText="Only users who are not already on this team are shown."
            onChange={value => form.setValue('memberEmail', value, { shouldValidate: true })}
            onSelect={user =>
              form.setValue('memberEmail', user.email, { shouldValidate: true, shouldDirty: true })
            }
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addMember.isPending || candidates.length === 0}>
              {addMember.isPending && <LoaderCircle className="animate-spin" />}
              {addMember.isPending ? 'Adding…' : 'Add to roster'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
