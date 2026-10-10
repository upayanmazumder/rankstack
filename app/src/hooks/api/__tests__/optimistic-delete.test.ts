import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';

import { removeFromCachedLists, restoreCachedLists } from '../optimistic-delete';

describe('optimistic list deletion', () => {
  it('updates every filtered list and restores exact snapshots after an error', async () => {
    const queryClient = new QueryClient();
    const allKey = ['contests', 'list'] as const;
    const liveKey = ['contests', 'list', { status: 'live' }] as const;
    const endedKey = ['contests', 'list', { status: 'ended' }] as const;
    const otherKey = ['users', 'list'] as const;
    const all = [{ id: 'target' }, { id: 'survivor' }];
    const live = [{ id: 'target' }];
    const ended = [{ id: 'survivor' }];
    queryClient.setQueryData(allKey, all);
    queryClient.setQueryData(liveKey, live);
    queryClient.setQueryData(endedKey, ended);
    queryClient.setQueryData(otherKey, all);

    const snapshots = await removeFromCachedLists(queryClient, allKey, 'target');

    expect(queryClient.getQueryData(allKey)).toEqual([{ id: 'survivor' }]);
    expect(queryClient.getQueryData(liveKey)).toEqual([]);
    expect(queryClient.getQueryData(endedKey)).toEqual(ended);
    expect(queryClient.getQueryData(otherKey)).toEqual(all);

    restoreCachedLists(queryClient, snapshots);
    expect(queryClient.getQueryData(allKey)).toEqual(all);
    expect(queryClient.getQueryData(liveKey)).toEqual(live);
  });
});
