import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Submission } from '@/types';

import { useSubmissionHistory } from '../use-submissions';

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
  beforeEach(() => apiMocks.get.mockReset());

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
});
