import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { User } from '@/types';

import { AddTeamMemberDialog } from './add-team-member-dialog';
import { TeamMemberRow } from './team-member-row';

interface TeamRosterProps {
  teamId: string;
  members: User[];
  candidates: User[];
  currentUserId?: string;
  canManage: boolean;
  canAddMembers: boolean;
}

export function TeamRoster({
  teamId,
  members,
  candidates,
  currentUserId,
  canManage,
  canAddMembers,
}: TeamRosterProps) {
  const canRemove = canManage && members.length > 1;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
        <div>
          <CardTitle>Roster</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {members.length} active member{members.length === 1 ? '' : 's'}
          </p>
        </div>
        {canAddMembers && <AddTeamMemberDialog teamId={teamId} candidates={candidates} />}
      </CardHeader>
      <CardContent className="divide-y">
        {members.map(member => (
          <TeamMemberRow
            key={member.id}
            teamId={teamId}
            member={member}
            canRemove={canRemove}
            isCurrentUser={member.id === currentUserId}
          />
        ))}
        {canManage && members.length === 1 && (
          <p className="pt-4 text-xs text-muted-foreground">
            The final member cannot be removed. Delete the team instead.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
