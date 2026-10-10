'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { isApiError } from '@/api';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { DifficultyBadge } from '@/components/problems';
import { Badge, Button, TableCell, TableRow } from '@/components/ui';
import { useDeleteProblem } from '@/hooks/api';
import type { Problem } from '@/types';

interface ProblemAdminRowProps {
  problem: Problem;
  contestTitle: string;
}

export function ProblemAdminRow({ problem, contestTitle }: ProblemAdminRowProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleteProblem = useDeleteProblem(problem.id);

  async function remove() {
    try {
      await deleteProblem.mutateAsync();
      toast.success('Problem deleted.');
      setConfirmDelete(false);
    } catch (error) {
      toast.error(isApiError(error) ? error.message : 'Problem could not be deleted.');
    }
  }

  return (
    <>
      <TableRow>
        <TableCell>
          <p className="font-medium">{problem.title}</p>
          <p className="text-xs text-muted-foreground">{contestTitle}</p>
        </TableCell>
        <TableCell>
          <Badge variant="outline" className="capitalize">
            {problem.type}
          </Badge>
        </TableCell>
        <TableCell>
          <DifficultyBadge difficulty={problem.difficulty} />
        </TableCell>
        <TableCell className="font-mono">{problem.points}</TableCell>
        <TableCell className="text-right">
          <Button
            size="icon-sm"
            variant="destructive"
            aria-label={`Delete ${problem.title}`}
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 />
          </Button>
        </TableCell>
      </TableRow>
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete ${problem.title}?`}
        description="Attempts and linked submissions will be removed and scores reconciled."
        confirmLabel="Delete problem"
        destructive
        loading={deleteProblem.isPending}
        onConfirm={remove}
      />
    </>
  );
}
