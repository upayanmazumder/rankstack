import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { Contest } from '@/types';

import { ContestAdminRow } from '../contest-admin-row';

const mocks = vi.hoisted(() => ({ deleteContest: vi.fn(), success: vi.fn(), error: vi.fn() }));

vi.mock('@/hooks/api', () => ({
  useDeleteContest: () => ({ mutateAsync: mocks.deleteContest, isPending: false }),
  useUpdateContestStatus: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock('sonner', () => ({ toast: { success: mocks.success, error: mocks.error } }));

const contest: Contest = {
  id: 'contest-1',
  title: 'Autumn Challenge',
  description: 'A contest',
  startTime: '2026-10-10T09:00:00.000Z',
  endTime: '2026-10-10T12:00:00.000Z',
  status: 'ended',
  createdBy: 'admin-1',
  problemIds: [],
  participants: [],
  createdAt: '2026-10-01T00:00:00.000Z',
};

describe('ContestAdminRow', () => {
  it('requires confirmation before deletion and reports success', async () => {
    mocks.deleteContest.mockReset().mockResolvedValue(undefined);
    mocks.success.mockReset();
    const user = userEvent.setup();

    render(
      <table>
        <tbody>
          <ContestAdminRow contest={contest} onEdit={vi.fn()} />
        </tbody>
      </table>
    );

    await user.click(screen.getByRole('button', { name: `Delete ${contest.title}` }));
    expect(mocks.deleteContest).not.toHaveBeenCalled();

    const dialog = screen.getByRole('dialog', { name: `Delete ${contest.title}?` });
    await user.click(within(dialog).getByRole('button', { name: 'Delete contest' }));

    expect(mocks.deleteContest).toHaveBeenCalledOnce();
    expect(mocks.success).toHaveBeenCalledWith('Contest deleted.');
  });
});
