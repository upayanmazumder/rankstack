'use client';

import Link from 'next/link';

import { ContestStatusBadge } from '@/components/contests/contest-status-badge';
import { HeroBackdrop } from '@/components/home/hero-backdrop';
import { HeroCta } from '@/components/home/hero-cta';
import { HeroHeadline } from '@/components/home/hero-headline';
import { LiveStack } from '@/components/home/live-stack';
import { Button } from '@/components/ui/button';
import { useContests } from '@/hooks/api/use-contests';
import { useHydratedUser } from '@/hooks/use-hydrated-user';
import { pickFeaturedContest } from '@/lib/featured-contest';
import { formatDateTime } from '@/utils';

const STEPS = [
  { title: 'Join a contest', description: 'Enter alone or with your team before the start time.' },
  {
    title: 'Solve the problems',
    description: 'Each contest lists its problems by letter. Some ask for code, some for a choice.',
  },
  { title: 'Get a verdict', description: 'A judge marks each submission and awards its points.' },
  {
    title: 'Move up the board',
    description: 'Points go to the leaderboard at once. Everyone in the contest sees the change.',
  },
];

export default function Home() {
  const user = useHydratedUser();
  const { data: contests = [], isPending } = useContests();

  const featured = pickFeaturedContest(contests);
  const schedule = contests
    .filter(contest => contest.status !== 'ended')
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  return (
    <div className="flex-1">
      <section className="relative isolate overflow-hidden">
        <HeroBackdrop />
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-5 pt-16 pb-20 sm:px-8 lg:grid-cols-[1fr_minmax(0,28rem)] lg:gap-20 lg:pt-24">
          <div className="flex flex-col justify-center">
            <HeroHeadline
              text="Contests that rank you as you solve."
              className="max-w-[15ch] text-4xl leading-[1.08] font-bold sm:text-5xl lg:text-6xl"
            />
            <p className="mt-6 max-w-[34rem] text-lg leading-8 text-muted-foreground">
              Join a programming contest, answer coding, multiple-choice, and written problems, and
              see your place on the leaderboard after each judged submission.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <HeroCta />
              <Button
                size="lg"
                variant="outline"
                nativeButton={false}
                render={
                  user ? (
                    <Link href="/submissions">Your submissions</Link>
                  ) : (
                    <Link href="/register">Create account</Link>
                  )
                }
              />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card/90 p-5 backdrop-blur-sm lg:mt-2">
            <LiveStack contest={featured} isPending={isPending} />
          </div>
        </div>
      </section>

      <section aria-labelledby="steps-heading" className="border-t border-border">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8">
          <h2 id="steps-heading" className="text-2xl font-semibold">
            How a contest runs
          </h2>
          <ol className="mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ title, description }, index) => (
              <li key={title} className="space-y-2">
                <p className="text-sm text-muted-foreground tabular-nums">{index + 1}</p>
                <h3 className="font-semibold">{title}</h3>
                <p className="max-w-xs leading-7 text-muted-foreground">{description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="schedule-heading" className="border-t border-border">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2 id="schedule-heading" className="text-2xl font-semibold">
              On the schedule
            </h2>
            <Link
              href="/contests"
              className="rounded-sm font-medium underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              See every contest
            </Link>
          </div>
          {schedule.length === 0 ? (
            <p className="mt-6 text-muted-foreground">
              {isPending
                ? 'Loading the schedule.'
                : 'No contest is live or scheduled at the moment.'}
            </p>
          ) : (
            <ul className="mt-6 border-t border-border">
              {schedule.map(contest => (
                <li key={contest.id}>
                  <Link
                    href={`/contests/${contest.id}`}
                    className="grid gap-x-6 gap-y-1 border-b border-border py-4 transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset sm:grid-cols-[1fr_auto_auto] sm:items-center sm:px-3"
                  >
                    <span className="truncate font-medium">{contest.title}</span>
                    <span className="text-sm text-muted-foreground">
                      {contest.status === 'live' ? 'Ends' : 'Starts'}{' '}
                      {formatDateTime(
                        contest.status === 'live' ? contest.endTime : contest.startTime
                      )}
                    </span>
                    <span className="sm:w-24 sm:text-right">
                      <ContestStatusBadge status={contest.status} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
