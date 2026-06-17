// lib/fan/feed-merge.test.mjs
// Regression + characterization tests for fan-feed cross-page merge/dedup.
// Run: node --test lib/fan/feed-merge.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { mergeFeedPage } from './feed-merge.mjs';

const post = (id) => ({ id, body: `post ${id}` });

// ── happy path ───────────────────────────────────────────────────────────────

test('mergeFeedPage: appends a disjoint next page in order', () => {
  const prev = [post('a'), post('b')];
  const next = [post('c'), post('d')];
  assert.deepEqual(
    mergeFeedPage(prev, next).map((p) => p.id),
    ['a', 'b', 'c', 'd'],
  );
});

test('mergeFeedPage: empty incoming page leaves the list unchanged', () => {
  const prev = [post('a'), post('b')];
  assert.deepEqual(mergeFeedPage(prev, []).map((p) => p.id), ['a', 'b']);
});

test('mergeFeedPage: empty prev returns the incoming page', () => {
  const next = [post('a'), post('b')];
  assert.deepEqual(mergeFeedPage([], next).map((p) => p.id), ['a', 'b']);
});

// ── the regression: inclusive-cursor boundary overlap ────────────────────────

test('mergeFeedPage: drops an item already present (inclusive-cursor overlap)', () => {
  // page 1 ended with `b`; the backend's inclusive cursor re-returns `b` as the
  // first item of page 2. The merged list must NOT contain two `b`s — that
  // would collide on the `item.id` React key.
  const prev = [post('a'), post('b')];
  const next = [post('b'), post('c')];
  const merged = mergeFeedPage(prev, next);
  assert.deepEqual(merged.map((p) => p.id), ['a', 'b', 'c']);
  const ids = merged.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length, 'no duplicate ids');
});

test('mergeFeedPage: keeps the FIRST occurrence (preserves prior position/state)', () => {
  // The already-present `b` (with its optimistic like state) is kept; the
  // re-sent server copy is discarded so we never clobber local state mid-scroll.
  const prev = [{ id: 'b', body: 'local optimistic b' }];
  const next = [{ id: 'b', body: 'server b' }];
  const merged = mergeFeedPage(prev, next);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].body, 'local optimistic b');
});

test('mergeFeedPage: dedups duplicates WITHIN the incoming page too', () => {
  const merged = mergeFeedPage([], [post('a'), post('a'), post('b')]);
  assert.deepEqual(merged.map((p) => p.id), ['a', 'b']);
});

test('mergeFeedPage: defends the prepend path (composed post later paginated in)', () => {
  // A freshly-composed post was prepended locally; it must not double-render
  // when the same id arrives in a later page fetch.
  const prev = [post('new'), post('a')];
  const next = [post('a'), post('new'), post('z')];
  assert.deepEqual(mergeFeedPage(prev, next).map((p) => p.id), ['new', 'a', 'z']);
});

// ── purity / non-mutation ────────────────────────────────────────────────────

test('mergeFeedPage: does not mutate its inputs', () => {
  const prev = [post('a')];
  const next = [post('b')];
  const prevCopy = prev.slice();
  const nextCopy = next.slice();
  mergeFeedPage(prev, next);
  assert.deepEqual(prev, prevCopy);
  assert.deepEqual(next, nextCopy);
});
