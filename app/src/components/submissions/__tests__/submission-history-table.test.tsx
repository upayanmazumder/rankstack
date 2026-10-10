import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { Submission } from '@/types';

import { SubmissionHistoryTable } from '../submission-history-table';

const submission: Submission = {
  id: 'submission-one',
  contestId: 'contest-one',
  problemId: 'problem-one',
  submittedBy: { refType: 'user', refId: 'user-one' },
  answer: 'solution',
  status: 'correct',
  score: 75,
  submittedAt: '2026-10-09T12:00:00.000Z',
};

describe('SubmissionHistoryTable', () => {
  it('renders submission metadata with resolved names', () => {
    render(
      <SubmissionHistoryTable
        submissions={[submission]}
        contestTitles={{ 'contest-one': 'Autumn Invitational' }}
        problemTitles={{ 'problem-one': 'Array Rotation' }}
      />
    );

    expect(screen.getByRole('table', { name: 'Submission history' })).toBeInTheDocument();
    expect(screen.getByText('Array Rotation')).toBeInTheDocument();
    expect(screen.getByText('Autumn Invitational')).toBeInTheDocument();
    expect(screen.getByText('Accepted')).toBeInTheDocument();
    expect(screen.getByText('75')).toBeInTheDocument();
  });
});
