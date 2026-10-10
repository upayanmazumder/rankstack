'use client';

import { useState } from 'react';
import { Edit3, FastForward, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { isApiError } from '@/api';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { ContestStatusBadge } from '@/components/contests/contest-status-badge';
import { Button, TableCell, TableRow } from '@/components/ui';
import { useDeleteContest, useUpdateContestStatus } from '@/hooks/api';
import type { Contest, ContestStatus } from '@/types';
import { formatDateTime } from '@/utils';

interface ContestAdminRowProps {
  contest: Contest;
  onEdit: (contest: Contest) => void;
}

const NEXT_STATUS: Partial<Record<ContestStatus, ContestStatus>> = {
  upcoming: 'live',
  live: 'ended',
};

export function ContestAdminRow({ contest, onEdit }: ContestAdminRowProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const updateStatus = useUpdateContestStatus(contest.id);
  const deleteContest = useDeleteContest(contest.id);
  const nextStatus = NEXT_STATUS[contest.status];

  async function advanceStatus() {
    if (!nextStatus) return;
    try {
      await updateStatus.mutateAsync(nextStatus);
      toast.success(`${contest.title} is now ${nextStatus}.`);
    } catch (error) {
      toast.error(isApiError(error) ? error.message : 'Contest status could not be updated.');
    }
  }

  async function remove() {
    try {
      await deleteContest.mutateAsync();
      toast.success('Contest deleted.');
      setConfirmDelete(false);
    } catch (error) {
      toast.error(isApiError(error) ? error.message : 'Contest could not be deleted.');
    }
  }

  return (
    <>
      <TableRow>
        <TableCell>
          <p className="font-medium">{contest.title}</p>
          <p className="font-mono text-xs text-muted-foreground">{contest.id.slice(0, 8)}</p>
        </TableCell>
        <TableCell>
          <ContestStatusBadge status={contest.status} />
        </TableCell>
        <TableCell className="whitespace-nowrap">{formatDateTime(contest.startTime)}</TableCell>
        <TableCell className="whitespace-nowrap">{formatDateTime(contest.endTime)}</TableCell>
        <TableCell>
          <div className="flex justify-end gap-1">
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label={`Edit ${contest.title}`}
              onClick={() => onEdit(contest)}
            >
              <Edit3 />
            </Button>
            {nextStatus && (
              <Button
                size="sm"
                variant="outline"
                onClick={advanceStatus}
                disabled={updateStatus.isPending}
              >
                <FastForward /> {nextStatus === 'live' ? 'Go live' : 'End'}
              </Button>
            )}
            <Button
              size="icon-sm"
              variant="destructive"
              aria-label={`Delete ${contest.title}`}
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
        title={`Delete ${contest.title}?`}
        description="This also removes linked problems and submissions and cannot be undone."
        confirmLabel="Delete contest"
        destructive
        loading={deleteContest.isPending}
        onConfirm={remove}
      />
    </>
  );
}
