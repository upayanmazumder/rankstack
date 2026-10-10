import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/stores';
import type { User } from '@/types';

import { AdminGuard } from '../admin-guard';

const replace = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));

const participant: User = {
  id: 'user-1',
  name: 'Ada Participant',
  email: 'ada@example.com',
  role: 'participant',
  totalScore: 0,
  teamIds: [],
  createdAt: '2026-10-01T00:00:00.000Z',
};

describe('AdminGuard', () => {
  beforeEach(() => {
    replace.mockReset();
    useAuthStore.getState().clearAuth();
  });

  it('redirects a participant away from administrative routes', async () => {
    useAuthStore.getState().setAuth('token', participant);
    render(
      <AdminGuard>
        <div>Secret controls</div>
      </AdminGuard>
    );

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/contests'));
    expect(screen.queryByText('Secret controls')).not.toBeInTheDocument();
  });

  it('renders administrative routes for an administrator', async () => {
    useAuthStore.getState().setAuth('token', { ...participant, role: 'admin' });
    render(
      <AdminGuard>
        <div>Secret controls</div>
      </AdminGuard>
    );

    expect(await screen.findByText('Secret controls')).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
