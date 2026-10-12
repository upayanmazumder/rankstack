import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';

import { QUERY_STALE_TIME_MS } from '@/constants';

import { fetchAllPages, getQueryClient, makeQueryClient } from '../query';

describe('makeQueryClient', () => {
  it('returns a QueryClient', () => {
    expect(makeQueryClient()).toBeInstanceOf(QueryClient);
  });

  it('sets staleTime to QUERY_STALE_TIME_MS', () => {
    const client = makeQueryClient();
    expect(client.getDefaultOptions().queries?.staleTime).toBe(QUERY_STALE_TIME_MS);
  });

  it('sets mutation retry to 0', () => {
    const client = makeQueryClient();
    expect(client.getDefaultOptions().mutations?.retry).toBe(0);
  });
});

describe('getQueryClient', () => {
  it('returns the same instance on repeated calls (browser singleton)', () => {
    const a = getQueryClient();
    const b = getQueryClient();
    expect(a).toBe(b);
  });

  it('returns a QueryClient', () => {
    expect(getQueryClient()).toBeInstanceOf(QueryClient);
  });
});

describe('fetchAllPages', () => {
  it('continues through full pages and returns records from the last short page', async () => {
    const offsets: number[] = [];
    const records = await fetchAllPages(async ({ limit, offset }) => {
      offsets.push(offset);
      expect(limit).toBe(2);
      return [1, 2, 3, 4, 5].slice(offset, offset + limit);
    }, 2);

    expect(records).toEqual([1, 2, 3, 4, 5]);
    expect(offsets).toEqual([0, 2, 4]);
  });

  it('stops after an empty page when the last data page is full', async () => {
    const offsets: number[] = [];
    const records = await fetchAllPages(async ({ limit, offset }) => {
      offsets.push(offset);
      return [1, 2].slice(offset, offset + limit);
    }, 2);

    expect(records).toEqual([1, 2]);
    expect(offsets).toEqual([0, 2]);
  });
});
