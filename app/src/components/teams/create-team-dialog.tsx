'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle, Plus, Users } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateTeam, useUsers } from '@/hooks/api';
import { useZodForm } from '@/hooks/use-zod-form';
import { useAuthStore } from '@/stores';

import { createTeamSchema } from './create-team-schema';
import type { CreateTeamFormValues } from './create-team-schema';
import { MemberEmailField } from './member-email-field';

export function CreateTeamDialog() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const currentUser = useAuthStore(state => state.user);
  const usersQuery = useUsers();
  const createTeam = useCreateTeam();
  const defaultMemberEmail = currentUser?.role === 'admin' ? '' : (currentUser?.email ?? '');
  const form = useZodForm(createTeamSchema, {
    defaultValues: { name: '', memberEmail: defaultMemberEmail },
  });
  const isAdmin = currentUser?.role === 'admin';
  const selectableUsers = useMemo(
    () =>
      (usersQuery.data ?? []).filter(
        user => user.role === 'participant' && user.id !== currentUser?.id
      ),
    [currentUser?.id, usersQuery.data]
  );
  const memberEmail = form.watch('memberEmail');

  useEffect(() => {
    if (!open) form.reset({ name: '', memberEmail: defaultMemberEmail });
  }, [defaultMemberEmail, form, open]);

  async function submit(values: CreateTeamFormValues) {
    const email = values.memberEmail.trim().toLowerCase();
    const selectedUser = isAdmin
      ? selectableUsers.find(user => user.email.toLowerCase() === email)
      : currentUser;

    if (isAdmin && email && !selectedUser) {
      form.setError('memberEmail', { message: 'Select a matching participant email.' });
      return;
    }

    try {
      const team = await createTeam.mutateAsync({
        name: values.name,
        memberIds: selectedUser && selectedUser.id !== currentUser?.id ? [selectedUser.id] : [],
      });
      toast.success(`${team.name} is ready to compete.`);
      setOpen(false);
      router.push(`/teams/${team.id}`);
    } catch (error) {
      toast.error(
        isApiError(error) ? error.message : 'Team could not be created. Please try again.'
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={nextOpen => !createTeam.isPending && setOpen(nextOpen)}>
      <DialogTrigger
        render={
          <Button size="lg">
            <Plus data-icon="inline-start" />
            Create Team
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Users className="size-5" />
          </div>
          <DialogTitle>Create a competitive team</DialogTitle>
          <DialogDescription>
            Choose a recognizable squad name. You can manage the roster after creation.
          </DialogDescription>
        </DialogHeader>

        <form className="mt-5 space-y-5" onSubmit={form.handleSubmit(submit)} noValidate>
          <div className="space-y-2">
            <Label htmlFor="team-name">Team name</Label>
            <Input
              id="team-name"
              autoFocus
              placeholder="e.g. Binary Brigade"
              aria-invalid={Boolean(form.formState.errors.name)}
              aria-describedby={form.formState.errors.name ? 'team-name-error' : undefined}
              {...form.register('name')}
            />
            {form.formState.errors.name && (
              <p id="team-name-error" role="alert" className="text-xs text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <MemberEmailField
            registration={form.register('memberEmail')}
            users={selectableUsers}
            value={memberEmail}
            error={form.formState.errors.memberEmail?.message}
            readOnly={!isAdmin}
            onChange={value => form.setValue('memberEmail', value, { shouldValidate: true })}
            onSelect={user =>
              form.setValue('memberEmail', user.email, { shouldValidate: true, shouldDirty: true })
            }
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createTeam.isPending || !currentUser}>
              {createTeam.isPending && <LoaderCircle className="animate-spin" />}
              {createTeam.isPending ? 'Creating…' : 'Create team'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
