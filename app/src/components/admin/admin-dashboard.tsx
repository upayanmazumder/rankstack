'use client';

import Link from 'next/link';
import { FileText, Gauge, ListChecks, Shield, Trophy, Users } from 'lucide-react';

import { AdminPageShell } from '@/components/admin/admin-page-shell';
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import {
  useAverageScoreByDifficulty,
  useContests,
  useSubmissions,
  useSubmissionStatusByContest,
  useTeams,
  useUsers,
} from '@/hooks/api';

const SHORTCUTS = [
  { href: '/admin/contests', label: 'Manage contests', icon: Trophy },
  { href: '/admin/problems', label: 'Problem bank', icon: FileText },
  { href: '/admin/submissions', label: 'Review queue', icon: ListChecks },
  { href: '/admin/users', label: 'Access control', icon: Shield },
] as const;

export function AdminDashboard() {
  const users = useUsers();
  const contests = useContests();
  const submissions = useSubmissions();
  const teams = useTeams();
  const averages = useAverageScoreByDifficulty();
  const statusByContest = useSubmissionStatusByContest();
  const loading = users.isPending || contests.isPending || submissions.isPending || teams.isPending;
  const allUsers = users.data ?? [];
  const allContests = contests.data ?? [];
  const pending = (submissions.data ?? []).filter(item => item.status === 'pending').length;

  return (
    <AdminPageShell
      eyebrow="Control plane"
      title="Administration overview"
      description="Monitor platform activity, evaluation queues, and competition operations from one workspace."
    >
      <section aria-label="Platform metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Registered users"
          value={allUsers.length}
          detail={`${allUsers.filter(user => user.role === 'admin').length} admins · ${allUsers.filter(user => user.role === 'participant').length} participants`}
          icon={Users}
          loading={loading}
        />
        <MetricCard
          title="Active contests"
          value={allContests.filter(contest => contest.status === 'live').length}
          detail={`${allContests.filter(contest => contest.status === 'upcoming').length} upcoming · ${allContests.filter(contest => contest.status === 'ended').length} ended`}
          icon={Trophy}
          loading={loading}
        />
        <MetricCard
          title="Pending reviews"
          value={pending}
          detail={`${submissions.data?.length ?? 0} total submissions`}
          icon={ListChecks}
          loading={loading}
          accent
        />
        <MetricCard
          title="Competitive teams"
          value={teams.data?.length ?? 0}
          detail="Registered squads"
          icon={Gauge}
          loading={loading}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Average score by difficulty</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(averages.data ?? []).map(row => (
              <div
                key={row.difficulty}
                className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
              >
                <span className="capitalize">{row.difficulty}</span>
                <span className="font-mono text-sm">
                  {row.avgScorePerProblem.toFixed(1)} avg · {row.problemCount} problems
                </span>
              </div>
            ))}
            {!averages.isPending && !averages.data?.length && (
              <p className="text-sm text-muted-foreground">
                Scored submissions will populate this analysis.
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Submission status by contest</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(statusByContest.data ?? []).map(row => (
              <div key={row.contestId} className="rounded-lg border p-3">
                <p className="font-medium">{row.title}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {row.statusCounts.map(item => (
                    <Badge key={item.status} variant="outline" className="capitalize">
                      {item.status}: {item.count}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
            {!statusByContest.isPending && !statusByContest.data?.length && (
              <p className="text-sm text-muted-foreground">
                Contest submission activity will appear here.
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      <section
        aria-label="Administrative shortcuts"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        {SHORTCUTS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-center justify-between rounded-xl border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-muted/40"
          >
            <span className="font-medium">{label}</span>
            <Icon className="size-5 text-muted-foreground transition-colors group-hover:text-primary" />
          </Link>
        ))}
      </section>
    </AdminPageShell>
  );
}

interface MetricCardProps {
  title: string;
  value: number;
  detail: string;
  icon: typeof Users;
  loading: boolean;
  accent?: boolean;
}

function MetricCard({
  title,
  value,
  detail,
  icon: Icon,
  loading,
  accent = false,
}: MetricCardProps) {
  return (
    <Card className={accent ? 'border-amber-500/40' : undefined}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
              {title}
            </p>
            <p className="mt-3 font-mono text-3xl font-semibold">{loading ? '—' : value}</p>
          </div>
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <Icon className="size-5" />
          </div>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}
