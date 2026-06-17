export function hasMessageId<M extends { id: unknown }>(
  pages: readonly { messages: readonly M[] }[],
  incomingId: unknown,
): boolean;

export function prependMessageDedup<
  P extends { messages: M[] },
  M extends { id: unknown },
>(
  pages: P[],
  incoming: M,
): P[];
