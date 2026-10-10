'use client';

import { AdminPageShell } from '@/components/admin/admin-page-shell';
import {
  Card,
  CardContent,
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';
import { useUsers } from '@/hooks/api';
import { useAuthStore } from '@/stores';

import { UserAdminRow } from './user-admin-row';

export function AdminUsers() {
  const users = useUsers();
  const currentUser = useAuthStore(state => state.user);

  return (
    <AdminPageShell
      eyebrow="Access control"
      title="User management"
      description="Review account activity, assign administrator access, and remove accounts when required."
    >
      <Card>
        <CardContent className="p-0">
          {users.isPending ? (
            <p role="status" className="p-8 text-center text-sm text-muted-foreground">
              Loading users…
            </p>
          ) : users.isError ? (
            <p role="alert" className="p-8 text-center text-sm text-destructive">
              Users could not be loaded.
            </p>
          ) : (
            <Table aria-label="User management" className="min-w-[780px]">
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Total score</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Access and actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(users.data ?? []).map(user => (
                  <UserAdminRow key={user.id} user={user} currentUserId={currentUser?.id ?? ''} />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AdminPageShell>
  );
}
