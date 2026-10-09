import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Team, User } from '@/types';

import { CreateTeamDialog } from '../create-team-dialog';

const participant: User = {
  id: 'user-1',
  name: 'Ada Lovelace',
  email: 'ada@rankstack.io',
  role: 'participant',
  totalScore: 120,
  teamIds: [],
  createdAt: '2026-10-01T00:00:00.000Z',
};

const createdTeam: Team = {
  id: 'team-1',
  name: 'Binary Brigade',
  memberIds: [participant.id],
  totalScore: 0,
  createdAt: '2026-10-10T00:00:00.000Z',
};

const mocks = vi.hoisted(() => ({
  currentUser: undefined as User | undefined,
  mutateAsync: vi.fn(),
  push: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock('sonner', () => ({
  toast: { success: mocks.toastSuccess, error: vi.fn() },
}));
vi.mock('@/stores', () => ({
  useAuthStore: (selector: (state: { user: User | undefined }) => unknown) =>
    selector({ user: mocks.currentUser }),
}));
vi.mock('@/hooks/api', () => ({
  useUsers: () => ({ data: [participant] }),
  useCreateTeam: () => ({ mutateAsync: mocks.mutateAsync, isPending: false }),
}));

describe('CreateTeamDialog', () => {
  beforeEach(() => {
    mocks.currentUser = participant;
    mocks.mutateAsync.mockReset().mockResolvedValue(createdTeam);
    mocks.push.mockReset();
    mocks.toastSuccess.mockReset();
  });

  it('creates a participant-owned team and navigates to it', async () => {
    const user = userEvent.setup();
    render(<CreateTeamDialog />);

    await user.click(screen.getByRole('button', { name: 'Create Team' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText('Founding member')).toHaveValue(participant.email);

    await user.type(screen.getByLabelText('Team name'), 'Binary Brigade');
    await user.click(screen.getByRole('button', { name: 'Create team' }));

    await waitFor(() =>
      expect(mocks.mutateAsync).toHaveBeenCalledWith({
        name: 'Binary Brigade',
        memberIds: [],
      })
    );
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Binary Brigade is ready to compete.');
    expect(mocks.push).toHaveBeenCalledWith('/teams/team-1');
  });

  it('shows validation feedback before submitting an incomplete form', async () => {
    const user = userEvent.setup();
    render(<CreateTeamDialog />);

    await user.click(screen.getByRole('button', { name: 'Create Team' }));
    await user.click(screen.getByRole('button', { name: 'Create team' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Team name must be at least 2 characters.'
    );
    expect(mocks.mutateAsync).not.toHaveBeenCalled();
  });
});
