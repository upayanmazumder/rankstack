import { describe, expect, it } from 'vitest';

import { contestRefetchInterval, LIVE_CONTEST_POLL_INTERVAL_MS } from '../contest-polling';

describe('contestRefetchInterval', () => {
  const now = new Date('2026-10-12T10:00:00.000Z').getTime();

  it('polls only live contests at a 30-second interval', () => {
    expect(contestRefetchInterval({ status: 'live', startTime: '' }, now)).toBe(
      LIVE_CONTEST_POLL_INTERVAL_MS
    );
    expect(contestRefetchInterval({ status: 'ended', startTime: '' }, now)).toBe(false);
    expect(contestRefetchInterval(undefined, now)).toBe(false);
  });

  it('schedules an upcoming contest at its start time instead of polling repeatedly', () => {
    expect(
      contestRefetchInterval({ status: 'upcoming', startTime: '2026-10-12T10:10:00.000Z' }, now)
    ).toBe(600_000);
    expect(
      contestRefetchInterval({ status: 'upcoming', startTime: '2026-10-12T09:00:00.000Z' }, now)
    ).toBe(false);
  });

  it('caps a distant start time at the maximum browser timer interval', () => {
    expect(
      contestRefetchInterval({ status: 'upcoming', startTime: '2027-10-12T10:00:00.000Z' }, now)
    ).toBe(2_147_483_647);
  });
});
