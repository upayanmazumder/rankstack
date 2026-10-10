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

export function restoreCachedLists<T extends { id: string }>(
  queryClient: QueryClient,
  snapshots: CachedList<T>[],
  id: string
) {
  for (const { key, data } of snapshots) {
    const originalIndex = data.findIndex(item => item.id === id);
    if (originalIndex < 0) continue;

    queryClient.setQueryData<T[]>(key, current => {
      if (!current || current.some(item => item.id === id)) return current;
      const restored = [...current];
      restored.splice(Math.min(originalIndex, restored.length), 0, data[originalIndex]);
      return restored;
    });
  }
}
