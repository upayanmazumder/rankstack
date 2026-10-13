import Link from 'next/link';
import { Users } from 'lucide-react';

import { RankNumeral } from '@/components/leaderboard/rank-numeral';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { Team } from '@/types';

interface TeamCardProps {
  team: Team;
  rank?: number;
}

export function TeamCard({ team, rank }: TeamCardProps) {
  return (
    <Link
      href={`/teams/${team.id}`}
      className="block h-full rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <Card className="h-full overflow-hidden transition-colors hover:border-foreground/30">
        <CardHeader className="border-b pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              {rank ? (
                <span className="w-10 text-center">
                  <span className="sr-only">Rank {rank}</span>
                  <span aria-hidden="true">
                    <RankNumeral rank={rank} className="text-3xl" />
                  </span>
                </span>
              ) : (
                <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent font-bold text-accent-foreground">
                  {team.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <h2 className="truncate text-lg font-bold">{team.name}</h2>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Total score</p>
              <p className="mt-1 text-xl leading-none font-semibold tabular-nums">
                {team.totalScore.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Roster</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-medium">
                <Users className="size-4 text-muted-foreground" />
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
            <span className="text-xs font-medium text-muted-foreground">View roster</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
