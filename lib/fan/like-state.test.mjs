// lib/fan/like-state.test.mjs
// Regression + characterization tests for fan-feed optimistic like state.
// Run: node --test lib/fan/like-state.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { applyOptimisticLike, rollbackOptimisticLike } from './like-state.mjs';

// ── applyOptimisticLike ─────────────────────────────────────────────────────

test('applyOptimisticLike: like increments and sets viewerLiked', () => {
  assert.deepEqual(applyOptimisticLike({ likeCount: 5, viewerLiked: false }, 1, true), {
    likeCount: 6,
    viewerLiked: true,
  });
});

test('applyOptimisticLike: unlike decrements and clears viewerLiked', () => {
  assert.deepEqual(applyOptimisticLike({ likeCount: 5, viewerLiked: true }, -1, false), {
    likeCount: 4,
    viewerLiked: false,
  });
});

test('applyOptimisticLike: count is clamped at 0 (never renders negative)', () => {
  assert.deepEqual(applyOptimisticLike({ likeCount: 0, viewerLiked: true }, -1, false), {
    likeCount: 0,
    viewerLiked: false,
  });
});

// ── idempotency invariant (double-fire / second-surface) ────────────────────

test('applyOptimisticLike: liking an already-liked post does NOT inflate the count', () => {
  // viewerLiked is already true — a second `like` (double-tap, or a stale
  // second surface) must not add a phantom +1. The backend like is idempotent
  // so ok=true and no rollback ever fires; an unconditional +1 would desync
  // the count permanently.
  assert.deepEqual(applyOptimisticLike({ likeCount: 6, viewerLiked: true }, 1, true), {
    likeCount: 6,
    viewerLiked: true,
  });
});

test('applyOptimisticLike: unliking an already-unliked post does NOT under-count', () => {
  assert.deepEqual(applyOptimisticLike({ likeCount: 6, viewerLiked: false }, -1, false), {
    likeCount: 6,
    viewerLiked: false,
  });
});

test('applyOptimisticLike: repeated likes are idempotent on the count', () => {
  const start = { likeCount: 10, viewerLiked: false };
  const once = applyOptimisticLike(start, 1, true);
  const twice = applyOptimisticLike(once, 1, true);
  const thrice = applyOptimisticLike(twice, 1, true);
  assert.equal(once.likeCount, 11, 'first like increments');
  assert.equal(twice.likeCount, 11, 'second like is a no-op on the count');
  assert.equal(thrice.likeCount, 11, 'third like is a no-op on the count');
  assert.equal(thrice.viewerLiked, true);
});

// ── rollback invariant (the bug fix) ────────────────────────────────────────

test('rollback restores the EXACT prior state after a failed mutation', () => {
  for (const start of [
    { likeCount: 0, viewerLiked: false },
    { likeCount: 0, viewerLiked: true },
    { likeCount: 1, viewerLiked: true },
    { likeCount: 42, viewerLiked: false },
  ]) {
    // like → rollback
    const afterLike = applyOptimisticLike(start, 1, true);
    void afterLike; // optimistic update applied to UI, then the network fails
    assert.deepEqual(rollbackOptimisticLike(start), start, 'like rollback is exact');

    // unlike → rollback
    const afterUnlike = applyOptimisticLike(start, -1, false);
    void afterUnlike;
    assert.deepEqual(rollbackOptimisticLike(start), start, 'unlike rollback is exact');
  }
});

test('REGRESSION: unliking a post already at likeCount 0 then failing does NOT invent a like', () => {
  // Pre-mutation state: viewer shows the post as liked but the count is 0
  // (a real desync — another client unliked concurrently, or the post was
  // optimistically created with count 0). The OLD code rolled back by applying
  // the inverse delta (+1) to the clamped optimistic value, yielding likeCount
  // 1 — a like that never existed. Snapshot-restore must keep it at 0.
  const start = { likeCount: 0, viewerLiked: true };

  // Optimistic unlike clamps to 0 (verified above) — UI shows 0 / unliked.
  const optimistic = applyOptimisticLike(start, -1, false);
  assert.equal(optimistic.likeCount, 0);

  // Network unlike fails → roll back to the captured snapshot.
  const rolledBack = rollbackOptimisticLike(start);
  assert.deepEqual(rolledBack, start);
  assert.equal(rolledBack.likeCount, 0, 'must NOT be 1 (the inverse-delta bug)');
  assert.equal(rolledBack.viewerLiked, true);

  // Prove the OLD buggy behaviour would have differed: inverse delta on the
  // clamped optimistic value over-counts.
  const buggyInverse = Math.max(0, optimistic.likeCount + 1); // old rollback math
  assert.equal(buggyInverse, 1);
  assert.notEqual(buggyInverse, start.likeCount);
});
