import Link from 'next/link';
import { Users } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { Team } from '@/types';

export function TeamCard({ team }: { team: Team }) {
  return (
    <Link href={`/teams/${team.id}`} className="block">
      <Card className="transition-colors hover:border-ring/50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold">{team.name}</h3>
            <span className="text-sm font-medium text-muted-foreground">
              {team.totalScore.toLocaleString()} pts
            </span>
          </div>
        </CardHeader>
        <CardContent className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {team.memberIds.slice(0, 4).map(id => (
              <Avatar key={id} className="size-7 border-2 border-background">
                <AvatarFallback className="text-[10px]">
                  {id.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ))}
            {team.memberIds.length > 4 && (
              <Avatar className="size-7 border-2 border-background">
                <AvatarFallback className="text-[10px]">
                  +{team.memberIds.length - 4}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="size-3" />
            {team.memberIds.length} member{team.memberIds.length !== 1 ? 's' : ''}
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
