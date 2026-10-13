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
  it('lists participants in rank order with their scores', () => {
    render(<LeaderboardTable entries={entries} />);

    const rows = screen.getAllByRole('row').slice(1);
    expect(rows.map(row => within(row).getAllByRole('cell')[0].textContent)).toEqual([
      '1',
      '2',
      '3',
    ]);
    expect(within(rows[0]).getByText('Ada Lovelace')).toBeInTheDocument();
    expect(within(rows[0]).getByText('300')).toBeInTheDocument();
  });

  it('highlights the current user row', () => {
    render(<LeaderboardTable entries={entries} currentUserId="user-2" />);

    const currentUserRow = screen.getByRole('row', { name: /Grace Hopper/ });
    expect(currentUserRow).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('row', { name: /Ada Lovelace/ })).not.toHaveAttribute('aria-current');
    expect(within(currentUserRow).getByText('You')).toBeInTheDocument();
  });
});
