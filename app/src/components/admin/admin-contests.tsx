'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

import { AdminPageShell } from '@/components/admin/admin-page-shell';
import {
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';
import { useContests } from '@/hooks/api';
import type { Contest } from '@/types';

import { ContestAdminRow } from './contest-admin-row';
import { ContestDialog } from './contest-dialog';

export function AdminContests() {
  const contests = useContests();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Contest | null>(null);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }
  function openEdit(contest: Contest) {
    setEditing(contest);
    setDialogOpen(true);
  }

  return (
    <AdminPageShell
      eyebrow="Competition operations"
      title="Contest management"
      description="Create competition windows, update details, advance lifecycle states, and retire contests."
      action={
        <Button onClick={openCreate}>
          <Plus /> Create contest
        </Button>
      }
    >
      <Card>
        <CardContent className="p-0">
          {contests.isPending ? (
            <p role="status" className="p-8 text-center text-sm text-muted-foreground">
              Loading contests…
            </p>
          ) : contests.isError ? (
            <p role="alert" className="p-8 text-center text-sm text-destructive">
              Contests could not be loaded.
            </p>
          ) : (
            <Table aria-label="Contest management" className="min-w-[850px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Contest</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(contests.data ?? []).map(contest => (
                  <ContestAdminRow key={contest.id} contest={contest} onEdit={openEdit} />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <ContestDialog open={dialogOpen} contest={editing} onOpenChange={setDialogOpen} />
    </AdminPageShell>
  );
}
