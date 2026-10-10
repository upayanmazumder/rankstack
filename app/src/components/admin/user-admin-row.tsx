'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { isApiError } from '@/api';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { UserRoleSelect } from '@/components/forms';
import { Badge, Button, TableCell, TableRow } from '@/components/ui';
import { useDeleteUser, useUpdateUser } from '@/hooks/api';
import type { Role, User } from '@/types';
import { formatDate } from '@/utils';

interface UserAdminRowProps {
  user: User;
  currentUserId: string;
}

export function UserAdminRow({ user, currentUserId }: UserAdminRowProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const updateUser = useUpdateUser(user.id);
  const deleteUser = useDeleteUser(user.id);
  const isCurrentUser = user.id === currentUserId;

  async function changeRole(role: Role) {
    try {
      await updateUser.mutateAsync({ role });
      toast.success(
        `${user.name} is now ${role === 'admin' ? 'an administrator' : 'a participant'}.`
      );
    } catch (error) {
      toast.error(isApiError(error) ? error.message : 'User role could not be updated.');
    }
  }

  async function remove() {
    try {
      await deleteUser.mutateAsync();
      toast.success('User account deleted.');
      setConfirmDelete(false);
    } catch (error) {
      toast.error(isApiError(error) ? error.message : 'User could not be deleted.');
    }
  }

  return (
    <>
      <TableRow>
        <TableCell>
          <p className="font-medium">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </TableCell>
        <TableCell>
          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>{user.role}</Badge>
        </TableCell>
        <TableCell className="font-mono">{user.totalScore}</TableCell>
        <TableCell>{formatDate(user.createdAt)}</TableCell>
        <TableCell>
          <div className="flex justify-end gap-2">
            <UserRoleSelect
              value={user.role}
              disabled={isCurrentUser || updateUser.isPending}
              onChange={changeRole}
            />
            <Button
              size="icon-sm"
              variant="destructive"
              aria-label={`Delete ${user.name}`}
              disabled={isCurrentUser}
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 />
            </Button>
          </div>
        </TableCell>
      </TableRow>
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete ${user.name}?`}
        description="This permanently removes the account. Team memberships and related records may also be affected."
        confirmLabel="Delete user"
        destructive
        loading={deleteUser.isPending}
        onConfirm={remove}
      />
    </>
  );
}
