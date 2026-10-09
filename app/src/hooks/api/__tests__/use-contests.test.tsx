import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Contest, LeaderboardEntry } from '@/types';

import { useContests, useLeaderboard } from '../use-contests';

const apiMocks = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock('@/api', () => ({ api: { get: apiMocks.get } }));

const contest: Contest = {
  id: 'contest-1',
  title: 'Spring Challenge',
  description: 'A live contest',
  startTime: '2026-04-01T09:00:00.000Z',
  endTime: '2026-04-01T12:00:00.000Z',
  status: 'live',
  createdBy: 'admin-1',
  problemIds: ['problem-1'],
  participants: [{ refType: 'user', refId: 'user-1' }],
  createdAt: '2026-03-01T00:00:00.000Z',
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('contest query hooks', () => {
  beforeEach(() => apiMocks.get.mockReset());

  it('loads contests with the selected status filter', async () => {
    apiMocks.get.mockResolvedValue({ data: [contest] });

    const { result } = renderHook(() => useContests({ status: 'live' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.data).toEqual([contest]));
    expect(apiMocks.get).toHaveBeenCalledWith('/contests', { params: { status: 'live' } });
  });

  it('returns leaderboard entries for the selected contest', async () => {
    const entries: LeaderboardEntry[] = [
      { memberId: 'user-1', participantName: 'Ada Lovelace', score: 120, rank: 1 },
    ];
    apiMocks.get.mockResolvedValue({ data: { contestId: 'contest-1', leaderboard: entries } });

    const { result } = renderHook(() => useLeaderboard('contest-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.data).toEqual(entries));
    expect(apiMocks.get).toHaveBeenCalledWith('/contests/contest-1/leaderboard');
  });
});
