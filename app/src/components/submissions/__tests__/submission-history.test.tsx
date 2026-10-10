import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { Submission, User } from '@/types';

import { SubmissionHistory } from '../submission-history';

const user: User = {
  id: 'user-1',
  name: 'Ada Lovelace',
  email: 'ada@rankstack.io',
  role: 'participant',
  totalScore: 75,
  teamIds: [],
  createdAt: '2026-10-01T00:00:00.000Z',
};

const submission: Submission = {
  id: 'submission-1',
  contestId: 'contest-unresolved',
  problemId: 'problem-unresolved',
  submittedBy: { refType: 'user', refId: user.id },
  answer: 'solution',
  status: 'correct',
  score: 75,
  submittedAt: '2026-10-09T12:00:00.000Z',
};

vi.mock('@/hooks/use-mounted', () => ({ useMounted: () => true }));
vi.mock('@/stores', () => ({
  useAuthStore: (selector: (state: { user: User }) => unknown) => selector({ user }),
}));
vi.mock('@/hooks/api', () => ({
  useSubmissionHistory: () => ({
    data: [submission],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useContests: () => ({ data: undefined, isLoading: false, isError: true }),
  useProblems: () => ({ data: undefined, isLoading: false, isError: true }),
}));

describe('SubmissionHistory', () => {
  it('keeps submissions visible when title catalogs are unavailable', () => {
    render(<SubmissionHistory />);

    expect(screen.getByText('Problem problem-')).toBeInTheDocument();
    expect(screen.getAllByText('Contest contest-')).not.toHaveLength(0);
    expect(screen.getByText('Accepted')).toBeInTheDocument();
  });
});
