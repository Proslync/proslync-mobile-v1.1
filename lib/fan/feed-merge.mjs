// lib/fan/feed-merge.mjs
// Pure page-merge math for the fan home feed's hand-rolled pagination.
// Plain JS (.mjs) so node:test runs without a TS toolchain (same pattern as
// lib/fan/like-state.mjs). The useFanHomeFeed hook owns the React state and
// the request lifecycle; this module isolates the APPEND + DEDUP so the
// "no duplicate ids across pages" invariant is testable without a renderer.
//
// Why dedup is required (not cosmetic):
//   The feed list renders with `keyExtractor={(item) => item.id}`
//   (components/fan/fan-home-feed.tsx). If the backend's keyset cursor is
//   inclusive at the boundary — a common off-by-one where `nextCursor` points
//   AT the last returned row rather than strictly after it — the first item of
//   page N+1 repeats the last item of page N. A naive `[...prev, ...next]`
//   append then yields two list items with the same React key, which React
//   warns on and which can drop/duplicate rows on reconciliation. Dedup makes
//   the merge idempotent against that overlap. It also defends against the
//   optimistic `prepend()` path: a freshly-composed post that later arrives in
//   a paginated page won't double-render.
//
// Order contract: existing items keep their position; only genuinely-new
// items (by id) from the incoming page are appended, in their server order.

/**
 * @template {{ id: string }} T
 * @param {readonly T[]} prev — items already in the list
 * @param {readonly T[]} incoming — the freshly-fetched next page
 * @returns {T[]} prev followed by incoming items whose id is not already present
 */
export function mergeFeedPage(prev, incoming) {
  const seen = new Set();
  for (const item of prev) seen.add(item.id);
  const result = prev.slice();
  for (const item of incoming) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    result.push(item);
  }
  return result;
}
