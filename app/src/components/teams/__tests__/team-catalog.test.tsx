import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { Team } from '@/types';

import { TeamCatalog } from '../team-catalog';

const teams: Team[] = [
  {
    id: 'team-low',
    name: 'Lambda League',
    memberIds: ['user-1'],
    totalScore: 80,
    createdAt: '2026-10-01T00:00:00.000Z',
  },
  {
    id: 'team-high',
    name: 'Quantum Core',
    memberIds: ['user-2', 'user-3'],
    totalScore: 240,
    createdAt: '2026-10-02T00:00:00.000Z',
  },
];

vi.mock('@/hooks/api', () => ({
  useTeams: () => ({ data: teams, isPending: false, isError: false, refetch: vi.fn() }),
}));
vi.mock('../create-team-dialog', () => ({
  CreateTeamDialog: () => <button type="button">Create Team</button>,
}));

describe('TeamCatalog', () => {
  it('ranks teams by score and links cards to their profiles', () => {
    render(<TeamCatalog />);

    expect(screen.getByText('#1 by score')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Quantum Core/i })).toHaveAttribute(
      'href',
      '/teams/team-high'
    );
    expect(screen.getByRole('link', { name: /Lambda League/i })).toHaveAttribute(
      'href',
      '/teams/team-low'
    );
  });

  it('filters the catalog by team name', async () => {
    const user = userEvent.setup();
    render(<TeamCatalog />);

    await user.type(screen.getByLabelText('Search teams'), 'lambda');

    expect(screen.getByText('Lambda League')).toBeInTheDocument();
    expect(screen.getByText('#2 by score')).toBeInTheDocument();
    expect(screen.queryByText('Quantum Core')).not.toBeInTheDocument();
  });
});
