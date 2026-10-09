'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { isApiError } from '@/api';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useDeleteTeam } from '@/hooks/api';

interface TeamDangerZoneProps {
  teamId: string;
  teamName: string;
}

export function TeamDangerZone({ teamId, teamName }: TeamDangerZoneProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const router = useRouter();
  const deleteTeam = useDeleteTeam(teamId);

  async function confirmDeletion() {
    try {
      await deleteTeam.mutateAsync();
      toast.success(`${teamName} was deleted.`);
      router.replace('/teams');
    } catch (error) {
      toast.error(isApiError(error) ? error.message : 'Team could not be deleted.');
    }
  }

  return (
    <Card className="border-destructive/30">
      <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold text-destructive">Danger zone</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Permanently delete this team, its submissions, and contest references.
          </p>
        </div>
        <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
          <Trash2 />
          Delete team
        </Button>
      </CardContent>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Delete ${teamName}?`}
        description="This cannot be undone. Team submissions and contest participation will also be removed."
        confirmLabel="Delete team"
        destructive
        loading={deleteTeam.isPending}
        onConfirm={() => void confirmDeletion()}
      />
    </Card>
  );
}
