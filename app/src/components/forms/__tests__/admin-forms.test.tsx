import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { Contest } from '@/types';

import { ContestForm } from '../contest-form';
import { ProblemForm } from '../problem-form';
import { SubmissionReviewForm } from '../submission-review-form';

const contest: Contest = {
  id: 'contest-1',
  title: 'Systems Sprint',
  description: 'Distributed systems challenge',
  startTime: '2026-10-10T09:00:00.000Z',
  endTime: '2026-10-10T12:00:00.000Z',
  status: 'upcoming',
  createdBy: 'admin-1',
  problemIds: [],
  participants: [],
  createdAt: '2026-10-01T00:00:00.000Z',
};

describe('administrative forms', () => {
  it('shows contest name and date-order validation errors inline', async () => {
    const submit = vi.fn();
    render(
      <ContestForm
        defaultValues={{
          title: '',
          description: '',
          startTime: '2026-10-10T12:00',
          endTime: '2026-10-10T10:00',
        }}
        submitLabel="Save contest"
        onSubmit={submit}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Save contest' }));

    expect(await screen.findByText('Contest name is required.')).toBeInTheDocument();
    expect(screen.getByText('End time must be after the start time.')).toBeInTheDocument();
    expect(submit).not.toHaveBeenCalled();
  });

  it('validates the active polymorphic problem fields', async () => {
    const submit = vi.fn();
    render(<ProblemForm contests={[contest]} onSubmit={submit} />);

    await userEvent.click(screen.getByRole('button', { name: 'Create problem' }));

    expect(await screen.findByText('Choose a contest.')).toBeInTheDocument();
    expect(screen.getByText('Problem title is required.')).toBeInTheDocument();
    expect(screen.getByText('Choose the correct option.')).toBeInTheDocument();
    expect(submit).not.toHaveBeenCalled();
  });
  it('validates coding problems without failing on MCQ options', async () => {
    const submit = vi.fn();
    render(
      <ProblemForm
        contests={[contest]}
        defaultValues={{
          type: 'coding',
          contestId: 'contest-1',
          title: 'Binary Search',
          points: 20,
        }}
        onSubmit={submit}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Create problem' }));

    expect(await screen.findByText('Expected output is required.')).toBeInTheDocument();
    expect(screen.queryByText('Choose the correct option.')).not.toBeInTheDocument();
    expect(screen.queryByText('Option cannot be empty.')).not.toBeInTheDocument();
  });

  it('prevents an adjudicated score from exceeding the problem points', async () => {
    const submit = vi.fn();
    render(
      <SubmissionReviewForm
        maxPoints={20}
        defaultValues={{ status: 'correct', score: 25 }}
        onSubmit={submit}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Publish grade' }));

    expect(await screen.findByText('Score cannot exceed 20.')).toBeInTheDocument();
    expect(submit).not.toHaveBeenCalled();
  });
});
