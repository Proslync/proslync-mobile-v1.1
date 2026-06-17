export function mergeFeedPage<T extends { id: string }>(
  prev: readonly T[],
  incoming: readonly T[],
): T[];
