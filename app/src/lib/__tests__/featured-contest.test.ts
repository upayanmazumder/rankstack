import { describe, expect, it } from 'vitest';

import type { Contest } from '@/types';

import { pickFeaturedContest } from '../featured-contest';

function contest(id: string, status: Contest['status'], startTime: string, endTime: string) {
  return {
    id,
    title: id,
    description: '',
    startTime,
    endTime,
    status,
    createdBy: 'admin',
    problemIds: [],
    participants: [],
    createdAt: startTime,
  } satisfies Contest;
}

const endedEarly = contest('ended-early', 'ended', '2026-01-01T00:00Z', '2026-01-02T00:00Z');
const endedLate = contest('ended-late', 'ended', '2026-02-01T00:00Z', '2026-02-02T00:00Z');
const liveOld = contest('live-old', 'live', '2026-03-01T00:00Z', '2026-12-01T00:00Z');
const liveNew = contest('live-new', 'live', '2026-03-05T00:00Z', '2026-12-01T00:00Z');
const upcoming = contest('upcoming', 'upcoming', '2026-11-01T00:00Z', '2026-11-02T00:00Z');

describe('pickFeaturedContest', () => {
  it('prefers the live contest that started last', () => {
    expect(pickFeaturedContest([endedLate, liveOld, liveNew, upcoming])?.id).toBe('live-new');
  });

  it('falls back to the contest that ended last', () => {
    expect(pickFeaturedContest([endedLate, upcoming, endedEarly])?.id).toBe('ended-late');
  });

  it('never features an upcoming contest', () => {
    expect(pickFeaturedContest([upcoming])).toBeUndefined();
    expect(pickFeaturedContest([])).toBeUndefined();
  });
});
