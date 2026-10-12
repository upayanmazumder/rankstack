import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useLeaderboardFinalization } from '../use-leaderboard-finalization';

describe('useLeaderboardFinalization', () => {
  it('refetches once when the contest status transitions to ended', () => {
    const refetch = vi.fn();
    const { rerender } = renderHook(({ status }) => useLeaderboardFinalization(status, refetch), {
      initialProps: { status: 'live' as 'live' | 'ended' | undefined },
    });
    expect(refetch).not.toHaveBeenCalled();

    rerender({ status: 'ended' });
    expect(refetch).toHaveBeenCalledOnce();

    rerender({ status: 'ended' });
    expect(refetch).toHaveBeenCalledOnce();
  });

  it('does not refetch on initial load of an already-ended contest', () => {
    const refetch = vi.fn();
    renderHook(({ status }) => useLeaderboardFinalization(status, refetch), {
      initialProps: { status: 'ended' as 'live' | 'ended' | undefined },
    });

    expect(refetch).not.toHaveBeenCalled();
  });

  it('ignores a transition away from an unresolved initial status', () => {
    const refetch = vi.fn();
    const { rerender } = renderHook(({ status }) => useLeaderboardFinalization(status, refetch), {
      initialProps: { status: undefined as 'live' | 'ended' | undefined },
    });

    rerender({ status: 'ended' });
    expect(refetch).not.toHaveBeenCalled();
  });
});
