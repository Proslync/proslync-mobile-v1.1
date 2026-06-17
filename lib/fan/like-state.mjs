// lib/fan/like-state.mjs
// Pure like/unlike optimistic-state transitions for the fan feed.
// Plain JS (.mjs) so node:test runs without a TS toolchain (same pattern as
// lib/fan/seeded.mjs). The fan-home-feed hook applies the optimistic update
// inline; this module isolates the COUNT math so the optimistic-then-rollback
// invariant is testable without a React renderer.
//
// Invariant under test (lib/fan/like-state.test.mjs):
//   rollback after a failed mutation must return the post to its EXACT prior
//   like state. Inverting the optimistic delta does NOT satisfy this, because
//   the optimistic count is clamped at 0 — unliking a post already showing
//   likeCount 0 optimistically stays 0, and inverting (+1) would invent a like.

/**
 * @typedef {{ likeCount: number, viewerLiked: boolean }} LikeState
 */

/**
 * Apply an optimistic like/unlike. The count is clamped at 0 so the UI never
 * renders a negative like count.
 *
 * Idempotent on the viewer-liked transition: the count only moves when
 * `viewerLiked` actually flips relative to `state.viewerLiked`. Applying a
 * like to an already-liked post (or an unlike to an already-unliked post) is a
 * no-op on the count. Without this guard a double-fire — a rapid double-tap, or
 * a second surface (e.g. the detail sheet) acting on a post whose `viewerLiked`
 * is already `true` — would inflate the count by +1 with no corresponding real
 * like; because the backend like/unlike is idempotent it returns ok and the
 * rollback never fires, so the over-count desync is permanent until refresh.
 * That is the same non-round-tripping count-math corruption class as the
 * rollback bug below, on the apply side.
 *
 * @param {LikeState} state
 * @param {1|-1} delta — +1 for like, -1 for unlike
 * @param {boolean} viewerLiked — the target viewer-liked flag
 * @returns {LikeState}
 */
export function applyOptimisticLike(state, delta, viewerLiked) {
  // Only move the count on a real state transition. delta direction must agree
  // with the target flag (+1 ⇒ liking, -1 ⇒ unliking); a non-transition leaves
  // the count untouched.
  const transitions = Boolean(state.viewerLiked) !== viewerLiked;
  return {
    likeCount: transitions ? Math.max(0, state.likeCount + delta) : state.likeCount,
    viewerLiked,
  };
}

/**
 * Roll a failed optimistic mutation back to the snapshot captured BEFORE it was
 * applied. This restores the snapshot verbatim — it must never re-derive the
 * count by inverting the delta (see module header for why).
 * @param {LikeState} snapshot — the pre-mutation state
 * @returns {LikeState}
 */
export function rollbackOptimisticLike(snapshot) {
  return { likeCount: snapshot.likeCount, viewerLiked: snapshot.viewerLiked };
}
