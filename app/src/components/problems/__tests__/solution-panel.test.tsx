import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { Problem } from '@/types';

import { SolutionPanel } from '../solution-panel';

const baseProblem: Problem = {
  id: 'problem-1',
  contestId: 'contest-1',
  type: 'mcq',
  title: 'Sample problem',
  description: 'Solve the sample problem.',
  difficulty: 'medium',
  points: 20,
  attemptCount: 4,
  createdAt: '2026-10-09T00:00:00Z',
};

describe('SolutionPanel', () => {
  it('submits the selected MCQ option', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const problem: Problem = { ...baseProblem, options: ['First answer', 'Second answer'] };

    render(<SolutionPanel problem={problem} isSubmitting={false} onSubmit={onSubmit} />);

    await user.click(screen.getByText('Second answer'));
    await user.click(screen.getByRole('button', { name: /submit solution/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith('Second answer'));
  });
  it('supports keyboard focus and selection for MCQ options', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const problem: Problem = { ...baseProblem, options: ['Option A', 'Option B'] };

    render(<SolutionPanel problem={problem} isSubmitting={false} onSubmit={onSubmit} />);

    const firstRadio = screen.getByRole('radio', { name: /Option A/i });
    firstRadio.focus();
    expect(firstRadio).toHaveFocus();
    expect(firstRadio.closest('label')).toHaveClass('focus-within:ring-2');

    await user.keyboard(' ');
    expect(firstRadio).toBeChecked();
  });

  it('submits code together with its language', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const problem: Problem = {
      ...baseProblem,
      type: 'coding',
      inputFormat: 'One integer.',
      constraints: '1 <= n <= 100',
      testCases: [{ input: '2', output: '4' }],
    };

    render(<SolutionPanel problem={problem} isSubmitting={false} onSubmit={onSubmit} />);

    await user.selectOptions(screen.getByLabelText('Programming language'), 'javascript');
    await user.type(screen.getByLabelText('Source code'), 'console.log(4);');
    await user.click(screen.getByRole('button', { name: /submit solution/i }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        language: 'javascript',
        sourceCode: 'console.log(4);',
      })
    );
  });

  it('enforces the subjective word limit before submission', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const problem: Problem = {
      ...baseProblem,
      type: 'subjective',
      wordLimit: 3,
      evaluationRubric: 'Be concise.',
    };

    render(<SolutionPanel problem={problem} isSubmitting={false} onSubmit={onSubmit} />);

    const answer = screen.getByLabelText('Written response');
    await user.type(answer, 'one two three four');
    await user.click(screen.getByRole('button', { name: /submit solution/i }));

    expect(screen.getByRole('alert')).toHaveTextContent('within 3 words');
    expect(onSubmit).not.toHaveBeenCalled();

    await user.clear(answer);
    await user.type(answer, 'one two three');
    await user.click(screen.getByRole('button', { name: /submit solution/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith('one two three'));
  });
});
