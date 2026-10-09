'use client';

import Link from 'next/link';
import { ArrowLeft, Trophy, Users } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTeam, useUsers } from '@/hooks/api';

interface TeamProfileProps {
  teamId: string;
}

export function TeamProfile({ teamId }: TeamProfileProps) {
  const teamQuery = useTeam(teamId);
  const usersQuery = useUsers();
  const team = teamQuery.data;

  if (teamQuery.isPending || usersQuery.isPending) {
    return <Skeleton className="mx-auto my-8 h-96 w-[calc(100%-2rem)] max-w-4xl" />;
  }

  if (teamQuery.isError || !team) {
    return (
      <section className="mx-auto w-full max-w-4xl flex-1 space-y-4 px-4 py-12 text-center sm:px-6">
        <h1 className="text-2xl font-semibold">Team unavailable</h1>
        <p className="text-sm text-muted-foreground">This team could not be loaded.</p>
        <Button variant="outline" onClick={() => void teamQuery.refetch()}>
          Retry
        </Button>
      </section>
    );
  }

  const members = (usersQuery.data ?? []).filter(user => team.memberIds.includes(user.id));

  return (
    <section className="mx-auto w-full max-w-4xl flex-1 space-y-6 px-4 py-8 sm:px-6">
      <Link href="/teams" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
        <ArrowLeft data-icon="inline-start" />
        All teams
      </Link>

      <div className="rounded-xl border bg-gradient-to-br from-primary/10 via-background to-background p-6 sm:p-8">
        <p className="text-xs font-semibold tracking-widest text-primary uppercase">Team profile</p>
        <h1 className="mt-2 text-3xl font-semibold">{team.name}</h1>
        <div className="mt-5 flex flex-wrap gap-5 text-sm">
          <span className="flex items-center gap-2">
            <Trophy className="size-4 text-primary" />
            <strong className="font-mono">{team.totalScore.toLocaleString()}</strong> points
          </span>
          <span className="flex items-center gap-2">
            <Users className="size-4 text-primary" />
            {team.memberIds.length} member{team.memberIds.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Roster</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {members.map(member => (
            <div key={member.id} className="flex items-center gap-3 py-4 first:pt-0 last:pb-0">
              <Avatar>
                <AvatarFallback>{member.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{member.name}</p>
                <p className="truncate text-xs text-muted-foreground">{member.email}</p>
              </div>
              <span className="ml-auto font-mono text-sm">
                {member.totalScore.toLocaleString()} pts
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
