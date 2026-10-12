import { isServer, QueryClient } from '@tanstack/react-query';

import { QUERY_GC_TIME_MS, QUERY_STALE_TIME_MS } from '@/constants';

let browserQueryClient: QueryClient | undefined;

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: QUERY_STALE_TIME_MS,
        gcTime: QUERY_GC_TIME_MS,
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

export function getQueryClient() {
  if (isServer) return makeQueryClient();
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}

// Typed query key factory. Usage: const userKeys = createQueryKeys('users')
export function createQueryKeys<K extends string>(entity: K) {
  return {
    all: () => [entity] as const,
    lists: () => [entity, 'list'] as const,
    list: <F extends Record<string, unknown>>(filters?: F) => [entity, 'list', filters] as const,
    detail: (id: string | number) => [entity, id] as const,
  };
}

// Loop a bounded, offset-paginated list endpoint until a short page signals
// the end, returning every record. Used by directory-style queries (e.g. the
// user and team catalogs) whose callers expect the complete collection for
// client-side search and member-selection, not just the first page.
export async function fetchAllPages<T>(
  fetchPage: (params: { limit: number; offset: number }) => Promise<T[]>,
  pageSize = 200
): Promise<T[]> {
  const results: T[] = [];
  let offset = 0;
  for (;;) {
    const page = await fetchPage({ limit: pageSize, offset });
    results.push(...page);
    if (page.length < pageSize) break;
    offset += pageSize;
  }
  return results;
}
