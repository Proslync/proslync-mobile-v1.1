// lib/chat/message-merge.mjs
// Pure prepend+dedup math for the live chat message cache.
// Plain JS (.mjs) so node:test runs without a TS toolchain (same pattern as
// lib/fan/feed-merge.mjs and lib/fan/like-state.mjs). The useConversation hook
// owns the React Query cache and the socket lifecycle; this module isolates the
// SOCKET-PREPEND + DEDUP so the "no duplicate message id in the cache"
// invariant is testable without a renderer.
//
// Why dedup is required (not cosmetic):
//   app/chat/[conversationId].tsx renders messages in a FlashList keyed by
//   `msg-${item.message.id}`. The chat:message socket handler in
//   useConversation prepends an incoming server message to pages[0]. But that
//   same message can ALREADY be in the cache:
//     1. Reconnect replay — socket.io re-delivers buffered events after a
//        reconnect, so a chat:message the client already applied fires again.
//     2. Fetch/socket race — the initial getMessages() page can include the
//        newest message, and a slightly-delayed chat:message for that same id
//        arrives after the room join completes.
//   A naive unconditional prepend then puts two messages with the same id in
//   the cache. The FlashList keyExtractor collides on `msg-<id>`, which React
//   warns on and which FlashList can mis-recycle into blank/duplicate bubbles.
//   Dedup makes the socket insert idempotent against re-delivery.
//
// Order contract: a genuinely-new incoming message is prepended (newest-first,
// matching the per-page server order). If its id is already present anywhere in
// the cache the prepend is a no-op — the existing copy keeps its position.

/**
 * Decide whether an incoming socket message is already represented in the cache.
 * @template {{ id: unknown }} M
 * @param {readonly { messages: readonly M[] }[]} pages — React Query infinite pages
 * @param {unknown} incomingId — id of the message the socket just delivered
 * @returns {boolean} true if a message with that id is already cached
 */
export function hasMessageId(pages, incomingId) {
  for (const page of pages) {
    for (const msg of page.messages) {
      if (msg.id === incomingId) return true;
    }
  }
  return false;
}

/**
 * Idempotently prepend an incoming socket message to the newest page.
 * Returns the SAME pages reference when the message is a duplicate (so callers
 * can skip the cache write entirely); otherwise a new pages array with the
 * message prepended to pages[0]. Never mutates its inputs.
 *
 * @template {{ id: unknown }} M
 * @param {readonly { messages: readonly M[] }[]} pages
 * @param {M} incoming
 * @returns {readonly { messages: readonly M[] }[]}
 */
export function prependMessageDedup(pages, incoming) {
  if (!pages || pages.length === 0) return pages;
  if (hasMessageId(pages, incoming.id)) return pages;
  const next = pages.slice();
  next[0] = {
    ...next[0],
    messages: [incoming, ...next[0].messages],
  };
  return next;
}
