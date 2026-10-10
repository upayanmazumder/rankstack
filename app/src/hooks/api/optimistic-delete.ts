import type { QueryClient, QueryKey } from '@tanstack/react-query';

interface CachedList<T> {
  key: QueryKey;
  data: T[];
}

export async function removeFromCachedLists<T extends { id: string }>(
  queryClient: QueryClient,
  listKey: QueryKey,
  id: string
): Promise<CachedList<T>[]> {
  await queryClient.cancelQueries({ queryKey: listKey });
  const snapshots = queryClient
    .getQueriesData<T[]>({ queryKey: listKey })
    .filter((entry): entry is [QueryKey, T[]] => Array.isArray(entry[1]))
    .map(([key, data]) => ({ key, data }));

  for (const { key, data } of snapshots) {
    queryClient.setQueryData<T[]>(
      key,
      data.filter(item => item.id !== id)
    );
  }

  return snapshots;
}

export function restoreCachedLists<T>(queryClient: QueryClient, snapshots: CachedList<T>[]) {
  for (const { key, data } of snapshots) queryClient.setQueryData(key, data);
}
