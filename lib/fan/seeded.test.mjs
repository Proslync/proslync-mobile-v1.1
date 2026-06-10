import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hashCode, mulberry32, seededAspect, seededPick } from './seeded.mjs';

test('hashCode is deterministic and spreads', () => {
  assert.equal(hashCode('post-1'), hashCode('post-1'));
  assert.notEqual(hashCode('post-1'), hashCode('post-2'));
});

test('mulberry32 yields deterministic sequence in [0,1)', () => {
  const a = mulberry32(42); const b = mulberry32(42);
  const seqA = [a(), a(), a()]; const seqB = [b(), b(), b()];
  assert.deepEqual(seqA, seqB);
  for (const v of seqA) assert.ok(v >= 0 && v < 1);
});

test('seededAspect deterministic and clamped to [0.62, 1.45]', () => {
  for (const id of ['a', 'b', 'post-123', 'x'.repeat(40)]) {
    const r1 = seededAspect(id); const r2 = seededAspect(id);
    assert.equal(r1, r2);
    assert.ok(r1 >= 0.62 && r1 <= 1.45, `${id} → ${r1}`);
  }
});

test('seededPick covers all recipes across many seeds', () => {
  const seen = new Set();
  for (let i = 0; i < 200; i++) seen.add(seededPick(`post-${i}`, 4));
  assert.deepEqual([...seen].sort((a, b) => a - b), [0, 1, 2, 3]);
});
