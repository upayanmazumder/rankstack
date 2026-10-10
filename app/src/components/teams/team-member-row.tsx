'use client';

import { useState } from 'react';
import { UserMinus } from 'lucide-react';
import { toast } from 'sonner';

import { isApiError } from '@/api';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRemoveTeamMember } from '@/hooks/api';
import type { User } from '@/types';

interface TeamMemberRowProps {
  teamId: string;
  member: User;
  canRemove: boolean;
  isCurrentUser: boolean;
}

export function TeamMemberRow({ teamId, member, canRemove, isCurrentUser }: TeamMemberRowProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const removeMember = useRemoveTeamMember(teamId);

  async function confirmRemoval() {
    try {
      await removeMember.mutateAsync(member.id);
      toast.success(`${member.name} was removed from the roster.`);
      setConfirmOpen(false);
    } catch (error) {
      toast.error(isApiError(error) ? error.message : 'Member could not be removed.');
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 py-4 first:pt-0 last:pb-0">
      <Avatar>
        <AvatarFallback>{member.name.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-medium">{member.name}</p>
          {isCurrentUser && <Badge variant="muted">You</Badge>}
          <Badge variant="outline" className="capitalize">
            {member.role}
          </Badge>
        </div>
        <p className="truncate text-xs text-muted-foreground">{member.email}</p>
      </div>
      <span className="font-mono text-sm">{member.totalScore.toLocaleString()} pts</span>
      {canRemove && (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="text-destructive hover:text-destructive"
          aria-label={`Remove ${member.name}`}
          onClick={() => setConfirmOpen(true)}
        >
          <UserMinus />
          <span className="hidden sm:inline">Remove</span>
        </Button>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Remove ${member.name}?`}
        description="They will lose access to this team and its team contest submissions."
        confirmLabel="Remove member"
        destructive
        loading={removeMember.isPending}
        onConfirm={() => void confirmRemoval()}
      />
    </div>
  );
}
