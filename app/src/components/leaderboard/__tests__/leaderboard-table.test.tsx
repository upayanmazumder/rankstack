import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { LeaderboardEntry } from '@/types';

import { LeaderboardTable } from '../leaderboard-table';

const entries: LeaderboardEntry[] = [
  { memberId: 'user-1', participantName: 'Ada Lovelace', score: 300, rank: 1 },
  { memberId: 'user-2', participantName: 'Grace Hopper', score: 200, rank: 2 },
  { memberId: 'user-3', participantName: 'Katherine Johnson', score: 100, rank: 3 },
];

describe('LeaderboardTable', () => {
  it('renders ranked participants with distinct podium styles', () => {
    render(<LeaderboardTable entries={entries} />);

    const first = screen.getByRole('row', { name: /Ada Lovelace/ });
    const second = screen.getByRole('row', { name: /Grace Hopper/ });
    const third = screen.getByRole('row', { name: /Katherine Johnson/ });

    expect(within(first).getByText('1')).toHaveClass('text-amber-500');
    expect(within(second).getByText('2')).toHaveClass('text-zinc-400');
    expect(within(third).getByText('3')).toHaveClass('text-amber-700');
    expect(within(first).getByText('300')).toBeInTheDocument();
  });

  it('highlights the current user row', () => {
    render(<LeaderboardTable entries={entries} currentUserId="user-2" />);

    const currentUserRow = screen.getByRole('row', { name: /Grace Hopper/ });
    expect(currentUserRow).toHaveClass('bg-primary/10');
    expect(within(currentUserRow).getByText('You')).toBeInTheDocument();
  });
});
