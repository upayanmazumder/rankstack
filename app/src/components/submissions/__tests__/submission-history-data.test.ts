import { describe, expect, it } from 'vitest';

import type { Submission } from '@/types';

import {
  createTitleLookup,
  filterAndSortSubmissions,
  resolveEntityTitle,
} from '../submission-history-data';

const submissions: Submission[] = [
  {
    id: 'older-correct',
    contestId: 'contest-one',
    problemId: 'problem-one',
    submittedBy: { refType: 'user', refId: 'user-one' },
    answer: 'A',
    status: 'correct',
    score: 100,
    submittedAt: '2026-10-08T10:00:00.000Z',
  },
  {
    id: 'newer-pending',
    contestId: 'contest-two',
    problemId: 'problem-two',
    submittedBy: { refType: 'user', refId: 'user-one' },
    answer: 'B',
    status: 'pending',
    score: 0,
    submittedAt: '2026-10-09T10:00:00.000Z',
  },
  {
    id: 'newest-correct',
    contestId: 'contest-one',
    problemId: 'problem-three',
    submittedBy: { refType: 'user', refId: 'user-one' },
    answer: 'C',
    status: 'correct',
    score: 80,
    submittedAt: '2026-10-09T12:00:00.000Z',
  },
];

describe('filterAndSortSubmissions', () => {
  it('orders submissions newest first', () => {
    const result = filterAndSortSubmissions(submissions, { contestId: 'all', status: 'all' });

    expect(result.map(submission => submission.id)).toEqual([
      'newest-correct',
      'newer-pending',
      'older-correct',
    ]);
  });

  it('combines contest and status filters', () => {
    const result = filterAndSortSubmissions(submissions, {
      contestId: 'contest-one',
      status: 'correct',
    });

    expect(result.map(submission => submission.id)).toEqual(['newest-correct', 'older-correct']);
  });
});

describe('submission title helpers', () => {
  it('builds title lookups and provides a compact fallback', () => {
    const lookup = createTitleLookup([{ id: 'problem-one', title: 'Array Rotation' }]);

    expect(resolveEntityTitle(lookup, 'problem-one', 'Problem')).toBe('Array Rotation');
    expect(resolveEntityTitle(lookup, 'abcdef123456', 'Problem')).toBe('Problem abcdef12');
  });
});
