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

  it('uses separate results when the selected status changes', async () => {
    const ended = { ...contest, id: 'contest-2', status: 'ended' as const };
    apiMocks.get.mockImplementation((_url, config) =>
      Promise.resolve({ data: config?.params?.status === 'live' ? [contest] : [ended] })
    );

    const { result, rerender } = renderHook(({ status }) => useContests({ status }), {
      initialProps: { status: 'live' as 'live' | 'ended' },
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.data).toEqual([contest]));
    rerender({ status: 'ended' });
    await waitFor(() => expect(result.current.data).toEqual([ended]));
    rerender({ status: 'live' });
    await waitFor(() => expect(result.current.data).toEqual([contest]));
  });

  it('keeps the preview and full leaderboard results separate', async () => {
    const preview: LeaderboardEntry[] = [
      { memberId: 'user-1', participantName: 'Ada Lovelace', score: 120, rank: 1 },
    ];
    const full: LeaderboardEntry[] = [
      ...preview,
      { memberId: 'user-2', participantName: 'Grace Hopper', score: 80, rank: 2 },
    ];
    apiMocks.get.mockImplementation((_url, config) =>
      Promise.resolve({ data: { leaderboard: config?.params?.top === 10 ? preview : full } })
    );

    const { result, rerender } = renderHook(({ top }) => useLeaderboard('contest-1', false, top), {
      initialProps: { top: 10 },
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.data).toEqual(preview));
    rerender({ top: 100 });
    await waitFor(() => expect(result.current.data).toEqual(full));
    rerender({ top: 10 });
    await waitFor(() => expect(result.current.data).toEqual(preview));
  });
});
