'use client';

import { useMemo, useState } from 'react';
import { Search, ShieldCheck, Users } from 'lucide-react';

import { EmptyState } from '@/components/common/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useTeams } from '@/hooks/api';

import { CreateTeamDialog } from './create-team-dialog';
import { TeamCard } from './team-card';

export function TeamCatalog() {
  const [search, setSearch] = useState('');
  const teamsQuery = useTeams();
  const teams = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (teamsQuery.data ?? [])
      .toSorted((left, right) => right.totalScore - left.totalScore)
      .map((team, index) => ({ team, rank: index + 1 }))
      .filter(({ team }) => team.name.toLowerCase().includes(query));
  }, [search, teamsQuery.data]);

  return (
    <section className="mx-auto w-full max-w-6xl flex-1 space-y-7 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-5 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-widest text-primary uppercase">
            Squad registry
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Teams &amp; Guilds</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Discover competitive squads, compare collective scores, and assemble your roster.
          </p>
        </div>
        <CreateTeamDialog />
      </div>

      <div className="flex flex-col gap-3 rounded-xl border bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative w-full sm:max-w-sm">
          <span className="sr-only">Search teams</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Search teams"
            className="bg-background pl-9"
          />
        </label>
        <div className="flex items-center gap-4 px-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="size-4 text-primary" />
            Score ranked
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="size-4 text-primary" />
            {teamsQuery.data?.length ?? 0} registered
          </span>
        </div>
      </div>

      {teamsQuery.isPending ? (
        <div
          role="status"
          aria-label="Loading teams"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-40" />
          ))}
        </div>
      ) : teamsQuery.isError ? (
        <div role="alert" className="space-y-3 py-12 text-center">
          <p>Teams could not be loaded. Please try again.</p>
          <Button variant="outline" onClick={() => void teamsQuery.refetch()}>
            Retry
          </Button>
        </div>
      ) : teams.length === 0 ? (
        <EmptyState
          title={search ? 'No matching teams' : 'No teams yet'}
          description={
            search
              ? 'Try a different team name.'
              : 'Create the first squad and start competing together.'
          }
          action={!search ? <CreateTeamDialog /> : undefined}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map(({ team, rank }) => (
            <TeamCard key={team.id} team={team} rank={rank} />
          ))}
        </div>
      )}
    </section>
  );
}
