// lib/chat/message-merge.test.mjs
// Regression + characterization tests for the live chat socket prepend/dedup.
// Run: node --test lib/chat/message-merge.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { hasMessageId, prependMessageDedup } from './message-merge.mjs';

const msg = (id, text = `msg ${id}`) => ({ id, text });
const pagesOf = (...idLists) =>
  idLists.map((ids) => ({ messages: ids.map((id) => msg(id)), hasMore: false }));

// ── hasMessageId ──────────────────────────────────────────────────────────────

test('hasMessageId: finds an id on the newest page', () => {
  const pages = pagesOf([3, 2], [1]);
  assert.equal(hasMessageId(pages, 3), true);
});

test('hasMessageId: finds an id on an older page', () => {
  const pages = pagesOf([3, 2], [1]);
  assert.equal(hasMessageId(pages, 1), true);
});

test('hasMessageId: returns false when absent', () => {
  const pages = pagesOf([3, 2], [1]);
  assert.equal(hasMessageId(pages, 99), false);
});

// ── happy path: genuinely-new message prepends to pages[0] ────────────────────

test('prependMessageDedup: prepends a new message to the newest page', () => {
  const pages = pagesOf([3, 2], [1]);
  const next = prependMessageDedup(pages, msg(4));
  assert.deepEqual(next[0].messages.map((m) => m.id), [4, 3, 2]);
  assert.deepEqual(next[1].messages.map((m) => m.id), [1], 'older page untouched');
});

// ── the regression: re-delivered socket event must not duplicate ──────────────

test('prependMessageDedup: skips a message already on the newest page (reconnect replay)', () => {
  // socket.io re-emits a buffered chat:message after a reconnect; the message
  // is already in pages[0]. The cache must NOT gain a second copy with the same
  // id — the FlashList keyExtractor `msg-<id>` would collide.
  const pages = pagesOf([3, 2], [1]);
  const next = prependMessageDedup(pages, msg(3));
  assert.equal(next, pages, 'returns the same reference so the caller can skip the write');
  const allIds = next.flatMap((p) => p.messages.map((m) => m.id));
  assert.equal(new Set(allIds).size, allIds.length, 'no duplicate ids');
});

test('prependMessageDedup: skips a message already on an OLDER page (fetch/socket race)', () => {
  // The initial getMessages() page already contained this message; a delayed
  // chat:message for the same id arrives after the room join.
  const pages = pagesOf([5, 4], [3, 2, 1]);
  const next = prependMessageDedup(pages, msg(2));
  assert.equal(next, pages);
  const allIds = next.flatMap((p) => p.messages.map((m) => m.id));
  assert.equal(new Set(allIds).size, allIds.length, 'no duplicate ids');
});

// ── empty-cache guard (mirrors the hook's `if (!old?.pages?.length)` bailout) ─

test('prependMessageDedup: empty/absent pages are returned unchanged', () => {
  assert.deepEqual(prependMessageDedup([], msg(1)), []);
  assert.equal(prependMessageDedup(undefined, msg(1)), undefined);
  assert.equal(prependMessageDedup(null, msg(1)), null);
});

// ── purity / non-mutation ─────────────────────────────────────────────────────

test('prependMessageDedup: does not mutate its inputs', () => {
  const pages = pagesOf([3, 2], [1]);
  const snapshot = JSON.stringify(pages);
  prependMessageDedup(pages, msg(4));
  assert.equal(JSON.stringify(pages), snapshot, 'inputs unchanged');
});

test('prependMessageDedup: preserves other page fields (hasMore, etc.)', () => {
  const pages = [{ messages: [msg(2)], hasMore: true, nextCursor: 'c1' }];
  const next = prependMessageDedup(pages, msg(3));
  assert.equal(next[0].hasMore, true);
  assert.equal(next[0].nextCursor, 'c1');
  assert.deepEqual(next[0].messages.map((m) => m.id), [3, 2]);
});
