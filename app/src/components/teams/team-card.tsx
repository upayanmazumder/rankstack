import Link from 'next/link';
import { ArrowUpRight, Trophy, Users } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { Team } from '@/types';

interface TeamCardProps {
  team: Team;
  rank?: number;
}

export function TeamCard({ team, rank }: TeamCardProps) {
  return (
    <Link href={`/teams/${team.id}`} className="group block h-full">
      <Card className="h-full overflow-hidden transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
        <CardHeader className="border-b bg-muted/25 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-semibold text-primary">
                {team.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h2 className="truncate font-semibold">{team.name}</h2>
                <span className="text-xs text-muted-foreground">
                  {rank ? `#${rank} by score` : 'Competitive team'}
                </span>
              </div>
            </div>
            <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs tracking-wide text-muted-foreground uppercase">Total score</p>
              <p className="mt-1 flex items-center gap-1.5 font-mono text-lg font-semibold">
                <Trophy className="size-4 text-primary" />
                {team.totalScore.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs tracking-wide text-muted-foreground uppercase">Roster</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-medium">
                <Users className="size-4 text-primary" />
                {team.memberIds.length} member{team.memberIds.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between border-t pt-3">
            <div className="flex -space-x-2">
              {team.memberIds.slice(0, 4).map(id => (
                <Avatar key={id} className="size-7 border-2 border-background">
                  <AvatarFallback className="text-[10px]">
                    {id.slice(-2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            <span className="text-xs font-medium text-primary">View roster</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
