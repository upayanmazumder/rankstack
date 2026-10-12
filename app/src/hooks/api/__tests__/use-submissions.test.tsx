import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Submission } from '@/types';

import { useAdminSubmissions, useSubmissionHistory } from '../use-submissions';

const apiMocks = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock('@/api', () => ({ api: { get: apiMocks.get } }));

function createSubmission(index: number): Submission {
  return {
    id: `submission-${index}`,
    contestId: 'contest-1',
    problemId: 'problem-1',
    submittedBy: { refType: 'user', refId: 'user-1' },
    answer: `answer-${index}`,
    status: 'pending',
    score: 0,
    submittedAt: new Date(Date.UTC(2026, 9, 10, 12, 0, index)).toISOString(),
  };
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('submission query hooks', () => {
  beforeEach(() => {
    apiMocks.get.mockReset();
  });

  it('loads every newest-first history page before completing', async () => {
    const firstPage = Array.from({ length: 100 }, (_, index) => createSubmission(index));
    const secondPage = [createSubmission(100)];
    apiMocks.get.mockImplementation((_url, config) =>
      Promise.resolve({ data: config?.params?.offset === 0 ? firstPage : secondPage })
    );

    const { result } = renderHook(() => useSubmissionHistory('user-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.data).toHaveLength(101));
    expect(apiMocks.get).toHaveBeenNthCalledWith(1, '/submissions', {
      params: { userId: 'user-1', limit: 100, offset: 0 },
    });
    expect(apiMocks.get).toHaveBeenNthCalledWith(2, '/submissions', {
      params: { userId: 'user-1', limit: 100, offset: 100 },
    });
  });
  it('loads later review pages without losing earlier submissions', async () => {
    const submissions = Array.from({ length: 301 }, (_, index) => createSubmission(index));
    apiMocks.get.mockImplementation((_url, config) =>
      Promise.resolve({
        data: submissions.slice(config.params.offset, config.params.offset + config.params.limit),
      })
    );

    const { result } = renderHook(() => useAdminSubmissions({ status: 'pending' }), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.data?.pages).toHaveLength(1));
    for (let page = 2; page <= 4; page += 1) {
      await act(async () => {
        await result.current.fetchNextPage();
      });
      await waitFor(() => expect(result.current.data?.pages).toHaveLength(page));
    }

    expect(result.current.data?.pages.flat().map(item => item.id)).toEqual(
      submissions.map(item => item.id)
    );
    expect(result.current.hasNextPage).toBe(false);
    expect(apiMocks.get).toHaveBeenLastCalledWith('/submissions', {
      params: { status: 'pending', limit: 100, offset: 300 },
    });
  });
});
