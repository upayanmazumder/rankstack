'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, Code2, Medal, Radio, UsersRound } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useContests } from '@/hooks/api/use-contests';
import { useAuthStore } from '@/stores';

const FEATURES = [
  {
    icon: Radio,
    title: 'Scores in motion',
    description: 'Follow standings as submissions are evaluated, without refreshing the page.',
  },
  {
    icon: Code2,
    title: 'More than one format',
    description: 'Move between coding, multiple-choice, and written challenges.',
  },
  {
    icon: UsersRound,
    title: 'Compete together',
    description: 'Enter as an individual or bring your team into the arena.',
  },
];

export default function Home() {
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  const { data: contests = [] } = useContests();

  useEffect(() => {
    if (user) router.replace('/contests');
  }, [router, user]);

  const competitors = new Set(
    contests.flatMap(contest => contest.participants.map(item => item.refId))
  ).size;
  const liveContests = contests.filter(contest => contest.status === 'live').length;

  return (
    <main className="flex-1">
      <section className="relative isolate overflow-hidden border-b border-border bg-[radial-gradient(ellipse_at_82%_12%,color-mix(in_oklch,var(--primary)_10%,transparent),transparent_42%),linear-gradient(135deg,var(--background)_0%,color-mix(in_oklch,var(--background),var(--muted)_50%)_100%)]">
        <div className="mx-auto grid min-h-[540px] w-full max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:py-20">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-primary uppercase">
              <span className="size-2 rounded-full bg-emerald-500" />
              The competition platform
            </p>
            <h1 className="mt-6 max-w-2xl text-5xl leading-[1.04] font-semibold sm:text-6xl">
              Rankstack is where skill finds its rank.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
              Run focused contests, solve problems that reward different strengths, and watch the
              leaderboard move in real time.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                size="lg"
                render={
                  <Link href="/contests">
                    Explore contests <ArrowUpRight />
                  </Link>
                }
              />
              <Button
                size="lg"
                variant="outline"
                render={<Link href="/register">Create account</Link>}
              />
            </div>
          </div>
          <div
            aria-label="Live contest standings preview"
            className="relative border-l border-border pl-6 sm:pl-9"
          >
            <div className="mb-5 flex items-center justify-between border-b border-border pb-4">
              <div>
                <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                  Rankings / 01
                </p>
                <p className="mt-1 font-semibold">Current standings</p>
              </div>
              <span className="inline-flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                <span className="size-2 rounded-full bg-emerald-500" />
                LIVE
              </span>
            </div>
            {[
              { rank: '01', name: 'A. Chen', points: '2,840', icon: Medal },
              { rank: '02', name: 'M. Okafor', points: '2,610', icon: null },
              { rank: '03', name: 'S. Patel', points: '2,430', icon: null },
            ].map(({ rank, name, points, icon: Icon }) => (
              <div
                key={rank}
                className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-4 border-b border-border/70 py-4"
              >
                <span className="font-mono text-sm text-muted-foreground">{rank}</span>
                <span className="flex items-center gap-2 font-medium">
                  {Icon && <Icon className="size-4 text-amber-500" />}
                  {name}
                </span>
                <span className="font-mono text-sm tabular-nums">{points}</span>
              </div>
            ))}
            <p className="mt-4 text-xs text-muted-foreground">
              Standings update as results are verified.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl grid-cols-3 divide-x divide-border border-b border-border px-5 py-7 sm:px-8">
        <div className="pr-3">
          <p className="text-2xl font-semibold tabular-nums">{contests.length}</p>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">Contests</p>
        </div>
        <div className="px-3 sm:px-6">
          <p className="text-2xl font-semibold tabular-nums">{competitors}</p>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">Competitors</p>
        </div>
        <div className="pl-3 sm:pl-6">
          <p className="text-2xl font-semibold tabular-nums">{liveContests}</p>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">Live now</p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-8">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-widest text-primary uppercase">
              Built for the whole contest
            </p>
            <h2 className="mt-2 text-2xl font-semibold">One arena. Every kind of problem.</h2>
          </div>
          <Link
            href="/contests"
            className="hidden items-center gap-1 text-sm font-medium hover:underline sm:inline-flex"
          >
            Browse contests <ArrowUpRight className="size-4" />
          </Link>
        </div>
        <div className="grid divide-y divide-border border-y border-border md:grid-cols-3 md:divide-x md:divide-y-0">
          {FEATURES.map(({ icon: Icon, title, description }, index) => (
            <article key={title} className="py-6 md:px-6 md:first:pl-0 md:last:pr-0">
              <span className="flex size-9 items-center justify-center border border-border bg-muted/50">
                <Icon className="size-4 text-primary" />
              </span>
              <p className="mt-5 font-mono text-xs text-muted-foreground">0{index + 1}</p>
              <h3 className="mt-2 font-semibold">{title}</h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
