# Frontend component and hook reference

This reference describes the components and hooks in `app/src/` as implemented on
the current branch. Import UI primitives from `@/components/ui`, API hooks from
`@/hooks/api`, domain types from `@/types`, and stores from `@/stores` unless a
section names a more specific path. Interactive examples belong in a Client
Component (`'use client'`) under the root `QueryProvider`; Server Components can
render presentational cards without using hooks.

## UI primitives

These wrappers forward the underlying HTML or Base UI component props, with
`className` where the underlying component supports it, in addition to the overrides below. They use theme tokens from
`src/app/globals.css`; use their public composition APIs instead of styling
internal DOM nodes.

| Component | Props and composition                                                                                                                                                                                                                                                                               | Notes                                                                                                                                                                  |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`  | Base UI `Button.Props` plus `variant?: 'default' \| 'outline' \| 'secondary' \| 'ghost' \| 'destructive' \| 'link'` and `size?: 'default' \| 'xs' \| 'sm' \| 'lg' \| 'icon' \| 'icon-xs' \| 'icon-sm' \| 'icon-lg'`                                                                                 | Both axes default to `default`. Pass `type="submit"` for forms and `disabled` during mutations. `buttonVariants()` provides matching classes for a Next.js `Link`.     |
| `Card`    | `Card`, `CardHeader`, `CardContent`, `CardFooter`: `React.ComponentProps<'div'>`; `CardTitle`: `React.ComponentProps<'h3'>`; `CardDescription`: `React.ComponentProps<'p'>`                                                                                                                         | Presentational slots; no data fetching or implicit heading hierarchy.                                                                                                  |
| `Dialog`  | `Dialog` is Base UI `Dialog.Root`; `DialogTrigger`/`DialogClose` use their Base UI props. `DialogContent` uses popup props and automatically mounts a portal and backdrop. `DialogTitle`/`DialogDescription` use Base UI title/description props; `DialogHeader`/`DialogFooter` accept `div` props. | For controlled dialogs use `open` and `onOpenChange` on the root. Keep a title for accessibility. Use `ConfirmDialog` for destructive confirmation.                    |
| `Table`   | `Table`, `TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`, `TableCell`, `TableCaption` accept their corresponding native table-element props.                                                                                                                                     | `Table` supplies a horizontal-overflow wrapper. `TableHead` defaults `scope="col"`. Compose semantic sections rather than placing rows directly under `Table`.         |
| `Input`   | `React.ComponentProps<'input'>` (`type`, `value`, `onChange`, `aria-invalid`, etc.)                                                                                                                                                                                                                 | Use a `Label` with matching `htmlFor`/`id` and expose validation text to assistive technology.                                                                         |
| `Select`  | `Select`/`SelectValue` are Base UI root/value props. `SelectTrigger`, `SelectItem`, `SelectLabel`, `SelectSeparator`, and scroll arrows forward their matching Base UI props. `SelectContent` forwards positioner props and accepts popup `className` plus `children`.                              | Render `SelectItem value="…"` inside `SelectContent`. Use root `value`/`onValueChange`; unlike native `<select>`, items are composed rather than passed as `<option>`. |
| `Badge`   | `React.ComponentProps<'span'>` plus `variant?: 'default' \| 'secondary' \| 'destructive' \| 'outline' \| 'success' \| 'warning' \| 'muted'`                                                                                                                                                         | Defaults to `default`; `badgeVariants()` is exported for matching non-`Badge` markup.                                                                                  |
| `Sheet`   | `Sheet` is Base UI `Dialog.Root`; trigger/close/title/description and overlay use their Base UI props. `SheetContent` adds `side?: 'top' \| 'bottom' \| 'left' \| 'right'` to popup props; `SheetHeader`/`SheetFooter` accept `div` props.                                                          | Defaults to `side="right"`; content supplies its own portal, backdrop, and close control.                                                                              |

Other public primitives: `Avatar`/`AvatarFallback` accept `span` props and
`AvatarImage` accepts `img` props with required `alt`; `DropdownMenu` exposes
Base UI root, trigger, content, item, checkbox/radio, label, separator, and
submenu slots; `Tabs` accepts `value?`, `defaultValue?`, and `onValueChange?`,
while `TabsTrigger` and `TabsContent` require a `value`. `Label`, `Textarea`,
and `Skeleton` forward their native element props. `Separator` accepts
`orientation?: 'horizontal' | 'vertical'` and `decorative?: boolean` (both
default to horizontal/decorative). `Toaster` forwards Sonner toaster props and
follows the current theme. Their exports are enumerated in
[`src/components/ui/index.ts`](src/components/ui/index.ts).

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

## Domain components

The primary cards and table are intentionally data-in/markup-out. Pass the
typed API result; do not pass raw MongoDB documents.

| Component and import                                                 | Prop interface                                                                                              | Behavior                                                                                                                                                                                                                               |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ContestCard` from `@/components/contests/contest-card`              | `{ contest: Contest }`                                                                                      | Links to `/contests/${contest.id}`; displays title, status, dates, description, and participant count.                                                                                                                                 |
| `ProblemCard` from `@/components/problems`                           | `{ problem: Problem; disabled?: boolean }`                                                                  | Links to the contest problem workspace; `disabled` defaults to `false` and renders an `aria-disabled` non-link card instead.                                                                                                           |
| `SubmissionRow` from `@/components/submissions`                      | `{ submission: Submission; problemTitle?: string; contestTitle?: string; onSelect?: (id: string) => void }` | A table row with name/ID fallbacks, status, score, and formatted submission time. When `onSelect` is supplied, the problem name becomes an action button.                                                                              |
| `TeamCard` from `@/components/teams`                                 | `{ team: Team; rank?: number }`                                                                             | Links to `/teams/${team.id}`; shows optional score rank, total score, and roster count.                                                                                                                                                |
| `LeaderboardTable` from `@/components/leaderboard/leaderboard-table` | `{ entries: LeaderboardEntry[]; currentUserId?: string }`                                                   | Shows rank, participant name (falling back to `memberId`), score, and submission count. Highlights the matching `memberId`; empty input displays “No participants yet.” It animates reordered rows unless reduced motion is requested. |

`Contest`, `Problem`, `Submission`, `Team`, and `LeaderboardEntry` live in
[`src/types/`](src/types). `Problem` covers `mcq`, `coding`, and `subjective`;
`Submission['status']` is `pending | correct | incorrect | partial` (the UI
labels `correct`/`incorrect` as accepted/rejected). `LeaderboardEntry` requires
`memberId`, `score`, and `rank`; `participantName` and `submissionCount` are
optional.

Additional feature-level components and their public props:

| Area                  | Components / props                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Contests and problems | `ContestStatusBadge({ status: ContestStatus })`; `DifficultyBadge({ difficulty: Difficulty })`; `ProblemStatement({ problem: Problem })`; `ProblemWorkspace({ contestId: string; problemId: string })`; `SolutionPanel({ problem: Problem; isSubmitting: boolean; disabled?: boolean; onSubmit: (answer: SolutionAnswer) => Promise<void> })`. The workspace fetches and submits; the statement and card are presentational.                                                                                                                                          |
| Submissions           | `SubmissionStatusBadge({ status: SubmissionStatus })`; `SubmissionHistory()` (no props, current-user scoped); `SubmissionHistoryTable({ submissions: Submission[]; contestTitles: Record<string,string>; problemTitles: Record<string,string> })`; `SubmissionFilters({ contests: { id: string; title: string }[]; contestId: string; status: 'all' \| SubmissionStatus; onContestChange: (id: string) => void; onStatusChange: (status: 'all' \| SubmissionStatus) => void })`.                                                                                      |
| Teams                 | `TeamCatalog()` and `CreateTeamDialog()` take no props; `TeamProfile({ teamId: string })`; `TeamRoster({ teamId: string; members: User[]; candidates: User[]; currentUserId?: string; canManage: boolean; canAddMembers: boolean })`; `AddTeamMemberDialog({ teamId: string; candidates: User[] })`; `TeamMemberRow({ teamId: string; member: User; canRemove: boolean; isCurrentUser: boolean })`; `TeamDangerZone({ teamId: string; teamName: string })`.                                                                                                           |
| Shared feedback       | `EmptyState({ title: string; description?: string; action?: ReactNode })`; `ConfirmDialog({ open: boolean; onOpenChange: (open: boolean) => void; title: string; description?: string; confirmLabel?: string; cancelLabel?: string; destructive?: boolean; loading?: boolean; onConfirm: () => void; children?: ReactNode })`.                                                                                                                                                                                                                                        |
| Admin                 | `AdminPageShell({ eyebrow, title, description, action?, children })`; `ContestDialog({ open, contest, onOpenChange })`; `ProblemDialog({ open, contests, onOpenChange })`; `SubmissionReviewDialog({ submission, problem?, onOpenChange })`; `ContestAdminRow({ contest, onEdit })`; `ProblemAdminRow({ problem, contestTitle })`; `SubmissionAdminRow({ submission, submitterName, contestTitle, problemTitle, onReview })`; `UserAdminRow({ user, currentUserId })`. The admin dashboard/list components and guard take no props except `AdminGuard({ children })`. |
| Admin forms           | `ContestForm({ defaultValues, submitLabel, isSubmitting?, onCancel?, onSubmit })`; `ProblemForm({ contests, defaultValues?, isSubmitting?, onCancel?, onSubmit })`; `SubmissionReviewForm({ maxPoints, defaultValues, isSubmitting?, onCancel?, onSubmit })`; `UserRoleSelect({ value: Role; disabled?: boolean; onChange: (role: Role) => void })`. Form value types/schemas are in `src/components/forms/`.                                                                                                                                                         |

## TanStack Query API hooks

All query hooks return the usual TanStack Query result (`data`, `isPending`,
`isError`, `refetch`, etc.); mutation hooks return `mutate`/`mutateAsync` and
`isPending`. They require `QueryProvider`, mounted by the root layout. Query
keys are centralized in `createQueryKeys(entity)`:

| Factory call         | Shape                       | Use                                              |
| -------------------- | --------------------------- | ------------------------------------------------ |
| `keys.all()`         | `[entity]`                  | Invalidate every query for an entity.            |
| `keys.lists()`       | `[entity, 'list']`          | Match the list prefix, including filtered lists. |
| `keys.list(filters)` | `[entity, 'list', filters]` | Cache a specific filter set.                     |
| `keys.detail(id)`    | `[entity, id]`              | Cache a single record.                           |

Query keys use the input IDs/filters as supplied. Pass stable IDs; TanStack
Query hashes object-valued filters. `useProblems()` and `useSubmissions()` use
the two-part `lists()` key when unfiltered; `useContests()` and
`useSubmissions(filters)` use `list(filters)`. The history hook has a separate
list key with `{ scope: 'history', userId }`. Leaderboards use
`['leaderboard', contestId, top]` and are polled separately from contest detail.

| Hook                                                               | Parameters / result                                                                                           | Cache and behavior                                                                                                    |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `useUsers()` / `useUser(id)`                                       | `User[]` / `User`                                                                                             | User list/detail keys; detail disabled for empty `id`.                                                                |
| `useContests(filters?)` / `useContest(id)`                         | `filters?: { status?: ContestStatus }`; `Contest[]` / `Contest`                                               | Contest detail polls every 5 s until status is `ended`; disabled for empty `id`.                                      |
| `useLeaderboard(contestId, refetchInterval = 5_000, top = 10)`     | `LeaderboardEntry[]`                                                                                          | Disabled for empty ID; pass `false` to stop polling. Key includes `top`, not interval.                                |
| `useProblems(contestId?)` / `useProblem(id)`                       | `Problem[]` / `Problem`                                                                                       | Optional `contestId` filters the list; detail disabled for empty `id`.                                                |
| `useSubmissions(filters?)` / `useSubmission(id)`                   | `filters?: { contestId?: string; userId?: string; status?: SubmissionStatus }`; `Submission[]` / `Submission` | Detail disabled for empty `id`. Use `userId` for user-scoped queries.                                                 |
| `useSubmissionHistory(userId)`                                     | `Submission[]`                                                                                                | Disabled for empty ID. Loads all newest-first API pages in batches of 100, keyed separately from generic submissions. |
| `useTeams()` / `useTeam(id)`                                       | `Team[]` / `Team`                                                                                             | Team list/detail keys; detail disabled for empty `id`.                                                                |
| `useAverageScoreByDifficulty()` / `useSubmissionStatusByContest()` | `AverageScoreByDifficulty[]` / `SubmissionStatusByContest[]`                                                  | Aggregation detail keys, both fetched from `/aggregations`.                                                           |

Mutation hook inputs are the argument to `mutate` or `mutateAsync`:

| Entity      | Mutation hooks and input                                                                                                                                                                                                                                                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Users       | `useCreateUser()` → `UserCreate`; `useUpdateUser(id)` → `UserUpdate`; `useDeleteUser(id)` → no argument.                                                                                                                                                                                                                                   |
| Contests    | `useCreateContest()` → `ContestCreate`; `useUpdateContest(id)` → `ContestUpdate`; `useUpdateContestStatus(id)` → `ContestStatus`; `useDeleteContest(id)` → no argument. `useAddParticipant(contestId)` → `{ refType: 'user' \| 'team'; refId: string }` (import directly from `@/hooks/api/use-contests`; it is not in the barrel export). |
| Problems    | `useCreateProblem()` → `ProblemCreate` discriminated by `type`; `useDeleteProblem(id)` → no argument.                                                                                                                                                                                                                                      |
| Submissions | `useCreateSubmission()` → `SubmissionCreate`; `useUpdateSubmissionStatus(id)` → `{ status: SubmissionStatus; score: number }`; `useDeleteSubmission(id)` → no argument.                                                                                                                                                                    |
| Teams       | `useCreateTeam()` → `TeamCreate`; `useUpdateTeam(id)` → `TeamUpdate`; `useAddTeamMember(teamId)` / `useRemoveTeamMember(teamId)` → `userId: string`; `useDeleteTeam(id)` → no argument.                                                                                                                                                    |
| Session     | `useLogin()` → `LoginRequest`; `useRegister()` → `{ name: string; email: string; password: string }`; `useLogout()` → no argument. Login uses the `/api/session` bridge and refreshes auth state; logout clears it even if the request fails.                                                                                              |

Create/update mutations invalidate their relevant list/detail caches. Deleting
a contest, problem, team, or user immediately removes it from cached lists,
restores only that item if the request fails, and refetches authoritative data
when settled. Contest/problem/team deletions also invalidate affected related
entities and leaderboards. `useUpdateSubmissionStatus` invalidates submission,
leaderboard, and user caches. UI callers own confirmation dialogs and toasts;
the hooks do not display them.

```tsx
'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { useContests, useDeleteContest } from '@/hooks/api';

function ContestList() {
  const contests = useContests({ status: 'live' });
  if (contests.isPending) return <p>Loading contests…</p>;
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

## Zustand state stores

`useAuthStore` is exported from `@/stores`. Its state is
`{ user: User | null; sessionGeneration: number; setAuth; clearAuth }`.
`setAuth(user)` sets the public profile and increments `sessionGeneration`;
`clearAuth()` clears it and increments the generation. For compatibility,
`setAuth(token, user)` is also accepted, but the token argument is ignored by
the store. Only `user` is persisted in browser storage (`auth-store`);
`sessionGeneration` is an in-memory change counter. Authentication itself is
verified by the session bridge/cookie and server guard—not by checking this
profile alone. Guard hydration-sensitive UI before assuming persisted state is
available.

`createSelectors` exposes `useAuthStore.use.user()` and
`useAuthStore.use.sessionGeneration()` (as well as selectors for the two
actions). Direct selectors such as `useAuthStore(state => state.user)` and
imperative `useAuthStore.getState().clearAuth()` are also supported. Use the
selector form in Client Components to avoid subscribing to unrelated state:

```tsx
'use client';

import { useAuthStore } from '@/stores';

function AccountName() {
  const user = useAuthStore.use.user();
  return <span>{user?.name ?? 'Guest'}</span>;
}
```

`useUiStore` is separate: `sidebarOpen: boolean`,
`setSidebarOpen(open: boolean)`, and `toggleSidebar()` with generated
`useUiStore.use.*()` selectors. It persists under `ui-store` and does not
represent authentication state.

## Other shared hooks

- `useMounted()` from `@/hooks/use-mounted` returns `false` during initial
  render and `true` after mount; use it when reading browser-hydrated state
  could produce a server/client mismatch.
- `useZodForm(schema, options?)` from `@/hooks/use-zod-form` returns a React
  Hook Form instance with `zodResolver(schema)` installed. `options` accepts
  normal `useForm` options except `resolver`; the inferred input/output types
  follow the Zod schema. Domain forms use this helper for validated submit
  handlers and field errors.
