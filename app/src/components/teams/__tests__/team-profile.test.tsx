import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Team, User } from '@/types';

import { TeamProfile } from '../team-profile';

const admin: User = {
  id: 'admin-1',
  name: 'Admin User',
  email: 'admin@rankstack.io',
  role: 'admin',
  totalScore: 300,
  teamIds: ['team-1'],
  createdAt: '2026-10-01T00:00:00.000Z',
};

const member: User = {
  id: 'user-1',
  name: 'Ada Lovelace',
  email: 'ada@rankstack.io',
  role: 'participant',
  totalScore: 120,
  teamIds: ['team-1'],
  createdAt: '2026-10-01T00:00:00.000Z',
};

const candidate: User = {
  id: 'user-2',
  name: 'Grace Hopper',
  email: 'grace@rankstack.io',
  role: 'participant',
  totalScore: 90,
  teamIds: [],
  createdAt: '2026-10-01T00:00:00.000Z',
};

const team: Team = {
  id: 'team-1',
  name: 'Binary Brigade',
  memberIds: [admin.id, member.id],
  totalScore: 420,
  createdAt: '2026-10-01T00:00:00.000Z',
};

const mocks = vi.hoisted(() => ({
  currentUser: undefined as User | undefined,
  addMember: vi.fn(),
  removeMember: vi.fn(),
  deleteTeam: vi.fn(),
  replace: vi.fn(),
}));

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: mocks.replace }) }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/stores', () => ({
  useAuthStore: (selector: (state: { user: User | undefined }) => unknown) =>
    selector({ user: mocks.currentUser }),
}));
vi.mock('@/hooks/api', () => ({
  useTeam: () => ({ data: team, isPending: false, isError: false, refetch: vi.fn() }),
  useUsers: () => ({ data: [admin, member, candidate], isPending: false }),
  useAddTeamMember: () => ({ mutateAsync: mocks.addMember, isPending: false }),
  useRemoveTeamMember: () => ({ mutateAsync: mocks.removeMember, isPending: false }),
  useDeleteTeam: () => ({ mutateAsync: mocks.deleteTeam, isPending: false }),
}));

describe('TeamProfile', () => {
  beforeEach(() => {
    mocks.currentUser = admin;
    mocks.addMember.mockReset().mockResolvedValue(team);
    mocks.removeMember.mockReset().mockResolvedValue(team);
    mocks.deleteTeam.mockReset().mockResolvedValue(undefined);
    mocks.replace.mockReset();
  });

  it('renders team metrics, member identities, roles, and manager actions', () => {
    render(<TeamProfile teamId={team.id} />);

    expect(screen.getByRole('heading', { name: team.name })).toBeInTheDocument();
    expect(screen.getByText('420')).toBeInTheDocument();
    expect(screen.getByText('2 members')).toBeInTheDocument();
    expect(screen.getByText(member.name)).toBeInTheDocument();
    expect(screen.getAllByText('participant')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Add member' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: `Remove ${member.name}` })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete team' })).toBeInTheDocument();
  });

  it('searches by email and adds the selected user', async () => {
    const user = userEvent.setup();
    render(<TeamProfile teamId={team.id} />);

    await user.click(screen.getByRole('button', { name: 'Add member' }));
    await user.type(screen.getByLabelText('Member email'), 'grace');
    await user.click(screen.getByRole('option', { name: /Grace Hopper/i }));
    await user.click(screen.getByRole('button', { name: 'Add to roster' }));

    await waitFor(() => expect(mocks.addMember).toHaveBeenCalledWith(candidate.id));
  });

  it('confirms member removal and team deletion', async () => {
    const user = userEvent.setup();
    render(<TeamProfile teamId={team.id} />);

    await user.click(screen.getByRole('button', { name: `Remove ${member.name}` }));
    let dialog = screen.getByRole('dialog', { name: `Remove ${member.name}?` });
    await user.click(within(dialog).getByRole('button', { name: 'Remove member' }));
    await waitFor(() => expect(mocks.removeMember).toHaveBeenCalledWith(member.id));

    await user.click(screen.getByRole('button', { name: 'Delete team' }));
    dialog = screen.getByRole('dialog', { name: `Delete ${team.name}?` });
    await user.click(within(dialog).getByRole('button', { name: 'Delete team' }));

    await waitFor(() => expect(mocks.deleteTeam).toHaveBeenCalledOnce());
    expect(mocks.replace).toHaveBeenCalledWith('/teams');
  });
});
