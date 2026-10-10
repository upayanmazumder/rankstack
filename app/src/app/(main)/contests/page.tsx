'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';

import { EmptyState } from '@/components/common/empty-state';
import { ContestCard } from '@/components/contests/contest-card';
import { Stagger, StaggerItem } from '@/components/motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useContests } from '@/hooks/api/use-contests';
import type { ContestStatus } from '@/types';

const FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Live', value: 'live' },
  { label: 'Upcoming', value: 'upcoming' },
  { label: 'Ended', value: 'ended' },
] as const;

export default function ContestsPage() {
  const [status, setStatus] = useState<(typeof FILTERS)[number]['value']>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim().toLowerCase()), 250);
    return () => window.clearTimeout(timer);
  }, [search]);
  const {
    data: contests = [],
    isPending,
    isError,
  } = useContests(status === 'all' ? undefined : { status: status as ContestStatus });
  const visibleContests = contests.filter(contest =>
    `${contest.title} ${contest.description}`.toLowerCase().includes(debouncedSearch)
  );

  return (
    <section className="mx-auto w-full max-w-6xl flex-1 space-y-7 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-5 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-widest text-primary uppercase">
            Competition desk
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Contest calendar</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Find your next challenge and follow the field.
          </p>
        </div>
        <label className="relative w-full sm:max-w-xs">
          <span className="sr-only">Search contests</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Search contests"
            className="pl-9"
          />
        </label>
      </div>

      <Tabs
        value={status}
        onValueChange={value => setStatus(value as (typeof FILTERS)[number]['value'])}
      >
        <TabsList className="h-auto max-w-full justify-start overflow-x-auto">
          {FILTERS.map(filter => (
            <TabsTrigger key={filter.value} value={filter.value}>
              {filter.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isPending ? (
        <div
          role="status"
          aria-label="Loading contests"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-40" />
          ))}
        </div>
      ) : isError ? (
        <div role="alert" className="space-y-3 py-12 text-center">
          <p>Contests could not be loaded. Please try again.</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      ) : visibleContests.length === 0 ? (
        <EmptyState
          title={debouncedSearch ? 'No matching contests' : 'No contests in this view'}
          description={
            debouncedSearch
              ? 'Try another search term.'
              : 'Contests will appear here when available.'
          }
        />
      ) : (
        <Stagger
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          stagger={Math.min(0.035, 0.2 / visibleContests.length)}
        >
          {visibleContests.map(contest => (
            <StaggerItem key={contest.id} duration={0.18}>
              <ContestCard contest={contest} />
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </section>
  );
}
