# Frontend Component and Hook Reference

This reference describes the components and hooks in `app/src/`. Import active UI primitives from `@/components/ui`, API hooks from `@/hooks/api`, domain types from `@/types`, and stores from `@/stores`. Import feature components from concrete modules when they are not in a barrel. Put interactive examples in a Client Component (`'use client'`) under the root `QueryProvider`. Server Components can render presentational cards without hooks.

## UI Primitives

These wrappers forward the underlying HTML or Base UI component props. Each wrapper accepts `className` when the underlying component supports it. The wrappers use theme tokens from `src/app/globals.css`. Use the public composition APIs instead of styling internal DOM nodes.

| Component | Props and composition                                                                                                                                                                                                | Notes                                                                                                                                                |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`  | Base UI `Button.Props` with `variant?: 'default' \| 'outline' \| 'secondary' \| 'ghost' \| 'destructive' \| 'link'` and `size?: 'default' \| 'xs' \| 'sm' \| 'lg' \| 'icon' \| 'icon-xs' \| 'icon-sm' \| 'icon-lg'`. | Both axes default to `'default'`. Set `type="submit"` for forms. Set `disabled` during mutations.                                                    |
| `Card`    | `Card`, `CardHeader`, and `CardContent`: `React.ComponentProps<'div'>`. `CardTitle`: `React.ComponentProps<'h3'>`.                                                                                                   | Presentational slots without data fetching or implicit heading levels.                                                                               |
| `Dialog`  | `Dialog` is Base UI `Dialog.Root`. `DialogContent` mounts a portal and backdrop. `DialogTitle` and `DialogDescription` use Base UI props. `DialogHeader` accepts `div` props.                                        | For controlled dialogs, use `open` and `onOpenChange` on the root. Keep a title for accessibility. Use `ConfirmDialog` for destructive confirmation. |
| `Table`   | `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, and `TableCell` accept native table props.                                                                                                             | `Table` supplies an overflow wrapper. `TableHead` defaults `scope="col"`. Compose semantic sections instead of placing rows directly under `Table`.  |
| `Input`   | `React.ComponentProps<'input'>` (`type`, `value`, `onChange`, `aria-invalid`).                                                                                                                                       | Use a `Label` with matching `htmlFor` and `id` values. Expose validation text to assistive technology.                                               |
| `Select`  | `Select` and `SelectValue` use Base UI props. `SelectTrigger` and `SelectItem` forward Base UI props. `SelectContent` forwards positioner props and accepts popup `className` and `children`.                        | Render `SelectItem` with a `value` inside `SelectContent`. Use root `value` and `onValueChange` props. Items compose as children.                    |
| `Badge`   | `React.ComponentProps<'span'>` with `variant?: 'default' \| 'secondary' \| 'destructive' \| 'outline' \| 'success' \| 'warning' \| 'muted'`.                                                                         | Defaults to `'default'`.                                                                                                                             |

- `Label` and `Textarea` forward native element props. Feature-local menu, sheet, and avatar primitives are imported directly where used.

The full export list is in [`src/components/ui/index.ts`](src/components/ui/index.ts).

```tsx
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '@/components/ui';

<Card>
  <CardHeader>
    <CardTitle>Find a team</CardTitle>
  </CardHeader>
  <CardContent>
    <form>
      <Label htmlFor="team-search">Team name</Label>
      <Input id="team-search" name="team-search" />
      <Button type="submit" size="sm">
        Search
      </Button>
    </form>
  </CardContent>
</Card>;
```

## Domain Components

Primary cards and tables accept typed API data. Do not pass raw database documents.

| Component and import                                                 | Prop interface                                                                                              | Behavior                                                                                                                                         |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ContestCard` from `@/components/contests/contest-card`              | `{ contest: Contest }`                                                                                      | Links to `/contests/${contest.id}`. Shows title, status, dates, description, and participant count.                                              |
| `ProblemCard` from `@/components/problems/problem-card`              | `{ problem: Problem; disabled?: boolean }`                                                                  | Links to the problem workspace. The `disabled` prop defaults to `false` and renders a non-link card.                                             |
| `SubmissionRow` from `@/components/submissions/submission-row`       | `{ submission: Submission; problemTitle?: string; contestTitle?: string; onSelect?: (id: string) => void }` | Table row showing status, score, and formatted submission time. When callers supply `onSelect`, the problem name becomes a button.               |
| `TeamCard` from `@/components/teams/team-card`                       | `{ team: Team; rank?: number }`                                                                             | Links to `/teams/${team.id}`. Shows optional score rank, total score, and member count.                                                          |
| `LeaderboardTable` from `@/components/leaderboard/leaderboard-table` | `{ entries: LeaderboardEntry[]; currentUserId?: string }`                                                   | Shows rank, name, score, and submission count. Highlights matching `memberId`. Shows fallback text when entries are empty. Animates row changes. |

Domain types reside in [`src/types/`](src/types). `Problem` covers `mcq`, `coding`, and `subjective` types. `Submission['status']` values include `pending`, `correct`, `incorrect`, and `partial`. The UI presents `correct` as accepted and `incorrect` as rejected. `LeaderboardEntry` requires `memberId`, `score`, and `rank`. Participant name and submission count are optional.

Feature components and public props:

| Area                  | Components and props                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Contests and problems | `ContestStatusBadge({ status: ContestStatus })`. `DifficultyBadge({ difficulty: Difficulty })`. `ProblemStatement({ problem: Problem })`. `ProblemWorkspace({ contestId: string; problemId: string })`. `SolutionPanel({ problem: Problem; isSubmitting: boolean; disabled?: boolean; onSubmit: (answer: SolutionAnswer) => Promise<void> })`.                                                                                                                                                     |
| Submissions           | `SubmissionStatusBadge({ status: SubmissionStatus })`. `SubmissionHistory()` (scoped to current user). `SubmissionHistoryTable({ submissions: Submission[]; contestTitles: Record<string, string>; problemTitles: Record<string, string> })`. `SubmissionFilters({ contests: { id: string; title: string }[]; contestId: string; status: 'all' \| SubmissionStatus; onContestChange: (id: string) => void; onStatusChange: (status: 'all' \| SubmissionStatus) => void })`.                        |
| Teams                 | `TeamCatalog()` and `CreateTeamDialog()` require no props. `TeamProfile({ teamId: string })`. `TeamRoster({ teamId: string; members: User[]; candidates: User[]; currentUserId?: string; canManage: boolean; canAddMembers: boolean })`. `AddTeamMemberDialog({ teamId: string; candidates: User[] })`. `TeamMemberRow({ teamId: string; member: User; canRemove: boolean; isCurrentUser: boolean })`. `TeamDangerZone({ teamId: string; teamName: string })`.                                     |
| Shared feedback       | `EmptyState({ title: string; description?: string; action?: ReactNode })`. `ConfirmDialog({ open: boolean; onOpenChange: (open: boolean) => void; title: string; description?: string; confirmLabel?: string; cancelLabel?: string; destructive?: boolean; loading?: boolean; onConfirm: () => void; children?: ReactNode })`.                                                                                                                                                                     |
| Admin                 | `AdminPageShell({ eyebrow, title, description, action?, children })`. `ContestDialog({ open, contest, onOpenChange })`. `ProblemDialog({ open, contests, onOpenChange })`. `SubmissionReviewDialog({ submission, problem?, onOpenChange })`. `ContestAdminRow({ contest, onEdit })`. `ProblemAdminRow({ problem, contestTitle })`. `SubmissionAdminRow({ submission, submitterName, contestTitle, problemTitle, onReview })`. `UserAdminRow({ user, currentUserId })`. `AdminGuard({ children })`. |
| Admin forms           | `ContestForm({ defaultValues, submitLabel, isSubmitting?, onCancel?, onSubmit })`. `ProblemForm({ contests, defaultValues?, isSubmitting?, onCancel?, onSubmit })`. `SubmissionReviewForm({ maxPoints, defaultValues, isSubmitting?, onCancel?, onSubmit })`. `UserRoleSelect({ value: Role; disabled?: boolean; onChange: (role: Role) => void })`. Forms reside in `src/components/forms/`.                                                                                                      |

## TanStack Query API Hooks

All query hooks return query results with `data`, `isPending`, and `isError`. Mutation hooks return `mutate`, `mutateAsync`, and `isPending`. The root layout provides `QueryProvider`.

Query keys use `createQueryKeys(entity)`:

| Factory call         | Key shape                   | Purpose                           |
| -------------------- | --------------------------- | --------------------------------- |
| `keys.all()`         | `[entity]`                  | Clear every query for an entity.  |
| `keys.lists()`       | `[entity, 'list']`          | Match list queries for an entity. |
| `keys.list(filters)` | `[entity, 'list', filters]` | Cache a filtered query list.      |
| `keys.detail(id)`    | `[entity, id]`              | Cache a single record.            |

Query keys accept stable IDs. TanStack Query hashes filter objects. `useProblems()` and `useSubmissions()` use `keys.lists()` when unfiltered. `useContests(filters)` and `useSubmissions(filters)` use `keys.list(filters)`. `useSubmissionHistory(userId)` uses `{ scope: 'history', userId }`. Leaderboards use `['leaderboard', contestId, top]` and poll while the contest is live.

Query hook summary:

| Hook                                                                 | Parameters and return type                                                                              | Cache behavior                                                                                                                                                   |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useUsers()`                                                         | `User[]`.                                                                                               | Fetches the user list.                                                                                                                                           |
| `useContests(filters?)` and `useContest(id)`                         | `filters?: { status?: ContestStatus }`. Returns `Contest[]` and `Contest`.                              | Contest detail polls every 30 seconds while live and once when an upcoming contest begins. Ended contests do not poll. Detail stays disabled when `id` is empty. |
| `useLeaderboard(contestId, refetchInterval = 30_000, top = 10)`      | `LeaderboardEntry[]`.                                                                                   | Stays disabled when `contestId` is empty. Set `refetchInterval` to `false` to stop polling.                                                                      |
| `useProblems(contestId?)` and `useProblem(id)`                       | `Problem[]` and `Problem`.                                                                              | Optional `contestId` filters the list. Detail stays disabled when `id` is empty.                                                                                 |
| `useSubmissions(filters?)`                                           | `filters?: { contestId?: string; userId?: string; status?: SubmissionStatus }`. Returns `Submission[]`. | Optional filters scope the list.                                                                                                                                 |
| `useSubmissionHistory(userId)`                                       | `Submission[]`.                                                                                         | Stays disabled when `userId` is empty. Fetches pages in batches of 100 items.                                                                                    |
| `useTeams()` and `useTeam(id)`                                       | `Team[]` and `Team`.                                                                                    | Detail query stays disabled when `id` is empty.                                                                                                                  |
| `useAverageScoreByDifficulty()` and `useSubmissionStatusByContest()` | `AverageScoreByDifficulty[]` and `SubmissionStatusByContest[]`.                                         | Fetches analytical aggregation metrics from `/aggregations`.                                                                                                     |

Mutation hook inputs:

| Entity      | Mutation hooks and inputs                                                                                                                                                                                                                                      |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Users       | `useUpdateUser(id)` accepts `UserUpdate`. `useDeleteUser(id)` accepts no arguments.                                                                                                                                                                            |
| Contests    | `useCreateContest()` accepts `ContestCreate`. `useUpdateContest(id)` accepts `ContestUpdate`. `useUpdateContestStatus(id)` accepts `ContestStatus`. `useDeleteContest(id)` accepts no arguments. `useAddParticipant(contestId)` accepts `AddParticipantInput`. |
| Problems    | `useCreateProblem()` accepts `ProblemCreate`. `useDeleteProblem(id)` accepts no arguments.                                                                                                                                                                     |
| Submissions | `useCreateSubmission()` accepts `SubmissionCreate`. `useUpdateSubmissionStatus(id)` accepts `{ status: SubmissionStatus; score: number }`.                                                                                                                     |
| Teams       | `useCreateTeam()` accepts `TeamCreate`. `useAddTeamMember(teamId)` and `useRemoveTeamMember(teamId)` accept `userId: string`. `useDeleteTeam(id)` accepts no arguments.                                                                                        |
| Session     | `useLogin()` accepts `LoginRequest`. `useRegister()` accepts register credentials. `useLogout()` accepts no arguments.                                                                                                                                         |

Cache behavior varies by hook. `useCreateContest` and `useCreateTeam` invalidate list caches; `useCreateTeam` also invalidates user caches. Update hooks invalidate matching detail and list caches. `useDeleteUser`, `useDeleteContest`, `useDeleteProblem`, and `useDeleteTeam` remove items from cached lists immediately. They restore items if the request fails and invalidate related caches when settled. Deleting a contest, problem, or team clears related caches and leaderboards. `useUpdateSubmissionStatus` clears submission, leaderboard, and user caches. UI components provide confirmation dialogs and toasts.

```tsx
'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { useContests, useDeleteContest } from '@/hooks/api';

function ContestList() {
  const contests = useContests({ status: 'live' });
  if (contests.isPending) return <p>Loading contests...</p>;
  if (contests.isError) return <p>Could not load contests.</p>;
  return (
    <ul>
      {contests.data.map(contest => (
        <li key={contest.id}>
          {contest.title} <DeleteContestButton id={contest.id} />
        </li>
      ))}
    </ul>
  );
}

function DeleteContestButton({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const deletion = useDeleteContest(id);

  async function remove() {
    try {
      await deletion.mutateAsync();
      toast.success('Contest deleted.');
      setOpen(false);
    } catch {
      toast.error('Contest could not be deleted.');
    }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Delete
      </button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete contest?"
        destructive
        loading={deletion.isPending}
        onConfirm={() => void remove()}
      />
    </>
  );
}
```

## Zustand State Stores

`useAuthStore` is in `@/stores`. The store state contains:

- `user: User | null`
- `sessionGeneration: number`
- `setAuth(user)`
- `clearAuth()`

`setAuth(user)` stores the profile and increments `sessionGeneration`. `clearAuth()` removes user state and increments the generation. The store also accepts `setAuth(token, user)` for compatibility, but ignores the token argument. Browser storage persists only `user` under the key `auth-store`. The `sessionGeneration` property exists in memory only.
The cookie and server route verify session authenticity. Client state does not grant access on its own.

`createSelectors` supplies auto-generated hooks:

- `useAuthStore.use.user()`
- `useAuthStore.use.sessionGeneration()`
- `useAuthStore.use.setAuth()`
- `useAuthStore.use.clearAuth()`

Direct selector functions such as `useAuthStore(state => state.user)` also work.

```tsx
'use client';

import { useAuthStore } from '@/stores';

function AccountName() {
  const user = useAuthStore.use.user();
  return <span>{user?.name ?? 'Guest'}</span>;
}
```

`useUiStore` manages sidebar state:

- `sidebarOpen: boolean`
- `setSidebarOpen(open: boolean)`
- `toggleSidebar()`

`useUiStore` persists state under `ui-store`. It does not store authentication data.

## Other Shared Hooks

- `useMounted()` from `@/hooks/use-mounted` returns `false` during initial render and `true` after mount. Use it to prevent hydration mismatches.
- `useZodForm(schema, options?)` from `@/hooks/use-zod-form` returns a form instance with `zodResolver(schema)`. Use this helper for schema-verified forms.
