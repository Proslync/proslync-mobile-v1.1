import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  collectSlots,
  classifyExt,
  parseManifestEntries,
  renderManifest,
  pickDevice,
} from './snapshot-core.mjs';

// ── pickDevice fixtures ────────────────────────────────────────────────────
// Redacted copy of real `xcrun devicectl list devices --json-output` shape
// (serial / ecid / IP scrubbed; structure preserved exactly).
const DEVICE_A = {
  identifier: '60F97B44-5747-5E0F-AB35-CBA650932373',
  deviceProperties: { name: "A's iPhone" },
  connectionProperties: { pairingState: 'paired', tunnelState: 'connected' },
  hardwareProperties: { udid: '00008140-001579E83A53001C', serialNumber: 'AAAAAAAAAAAA' },
};
const DEVICE_B = {
  identifier: 'BBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBBBB',
  deviceProperties: { name: "B's iPhone" },
  connectionProperties: { pairingState: 'paired', tunnelState: 'connected' },
  hardwareProperties: { udid: '00008140-000000000000000B', serialNumber: 'BBBBBBBBBBBB' },
};
const DEVICE_UNPAIRED = {
  identifier: 'CCCCCCCC-CCCC-CCCC-CCCC-CCCCCCCCCCCC',
  deviceProperties: { name: "C's iPad" },
  connectionProperties: { pairingState: 'unpaired', tunnelState: 'disconnected' },
  hardwareProperties: { udid: '00008140-000000000000000C', serialNumber: 'CCCCCCCCCCCC' },
};

function makeJson(devices) {
  return { result: { devices } };
}

test('pickDevice auto-picks the single paired device', () => {
  const result = pickDevice(makeJson([DEVICE_A]), null);
  assert.deepEqual(result, { identifier: '60F97B44-5747-5E0F-AB35-CBA650932373', name: "A's iPhone" });
});

test('pickDevice ignores unpaired devices during auto-pick', () => {
  const result = pickDevice(makeJson([DEVICE_UNPAIRED, DEVICE_A]), null);
  assert.deepEqual(result, { identifier: '60F97B44-5747-5E0F-AB35-CBA650932373', name: "A's iPhone" });
});

test('pickDevice throws when no paired devices present', () => {
  assert.throws(
    () => pickDevice(makeJson([DEVICE_UNPAIRED]), null),
    (err) => {
      assert.ok(err instanceof Error);
      assert.ok(err.message.includes('No paired device'), `unexpected message: ${err.message}`);
      return true;
    },
  );
});

test('pickDevice throws when multiple paired devices and no --device given (ambiguous)', () => {
  assert.throws(
    () => pickDevice(makeJson([DEVICE_A, DEVICE_B]), null),
    (err) => {
      assert.ok(err instanceof Error);
      assert.ok(err.message.includes('Multiple'), `unexpected message: ${err.message}`);
      assert.ok(err.message.includes("A's iPhone"), `expected device A in message: ${err.message}`);
      assert.ok(err.message.includes("B's iPhone"), `expected device B in message: ${err.message}`);
      return true;
    },
  );
});

test('pickDevice resolves requested device by name', () => {
  const result = pickDevice(makeJson([DEVICE_A, DEVICE_B]), "A's iPhone");
  assert.deepEqual(result, { identifier: '60F97B44-5747-5E0F-AB35-CBA650932373', name: "A's iPhone" });
});

test('pickDevice resolves requested device by identifier (UUID)', () => {
  const result = pickDevice(makeJson([DEVICE_A, DEVICE_B]), '60F97B44-5747-5E0F-AB35-CBA650932373');
  assert.deepEqual(result, { identifier: '60F97B44-5747-5E0F-AB35-CBA650932373', name: "A's iPhone" });
});

test('pickDevice resolves requested device by classic UDID', () => {
  const result = pickDevice(makeJson([DEVICE_A, DEVICE_B]), '00008140-001579E83A53001C');
  assert.deepEqual(result, { identifier: '60F97B44-5747-5E0F-AB35-CBA650932373', name: "A's iPhone" });
});

test('pickDevice throws when requested device not found', () => {
  assert.throws(
    () => pickDevice(makeJson([DEVICE_A]), 'does-not-exist'),
    (err) => {
      assert.ok(err instanceof Error);
      assert.ok(err.message.includes('does-not-exist'), `expected requested value in message: ${err.message}`);
      assert.ok(err.message.includes("A's iPhone"), `expected candidate list in message: ${err.message}`);
      return true;
    },
  );
});

test('collectSlots reads v2 banner keys, covers, logos, avatar', () => {
  const storage = {
    'proslync:profile:banner:v2': JSON.stringify({ uri: 'file:///a/Documents/proslync-media/profile-banner/1.mp4', type: 'video' }),
    'proslync:coachprofile:bannerVideo:v1': 'file:///a/Documents/proslync-media/coach-banner/2.mov',
    'proslync:home:coverMedia:v2': JSON.stringify({ ncaab: { uri: 'file:///a/Documents/proslync-media/cover-ncaab/3.jpg', type: 'image' } }),
    'proslync:home:customLogos:v1': JSON.stringify({ ncaab: 'file:///a/Documents/proslync-media/logo-ncaab/4.png' }),
    'proslync:profile:avatar:v1': 'file:///a/Documents/proslync-media/profile-avatar/5.jpg',
  };
  const slots = collectSlots(storage);
  assert.deepEqual(
    slots.sort((x, y) => x.slot.localeCompare(y.slot)),
    [
      { slot: 'coach-banner', uri: 'file:///a/Documents/proslync-media/coach-banner/2.mov', type: 'video' },
      { slot: 'cover-ncaab', uri: 'file:///a/Documents/proslync-media/cover-ncaab/3.jpg', type: 'image' },
      { slot: 'logo-ncaab', uri: 'file:///a/Documents/proslync-media/logo-ncaab/4.png', type: 'image' },
      { slot: 'profile-avatar', uri: 'file:///a/Documents/proslync-media/profile-avatar/5.jpg', type: 'image' },
      { slot: 'profile-banner', uri: 'file:///a/Documents/proslync-media/profile-banner/1.mp4', type: 'video' },
    ],
  );
});

test('collectSlots prefers v2 over legacy v1 and skips empty maps', () => {
  const storage = {
    'proslync:profile:banner:v2': JSON.stringify({ uri: 'file:///x/v2.mp4', type: 'video' }),
    'proslync:profile:bannerVideo:v1': 'file:///x/v1.mp4',
    'proslync:home:coverMedia:v2': '{}',
  };
  const slots = collectSlots(storage);
  assert.equal(slots.length, 1);
  assert.equal(slots[0].uri, 'file:///x/v2.mp4');
});

test('collectSlots tolerates corrupt JSON and missing keys', () => {
  assert.deepEqual(collectSlots({}), []);
  assert.deepEqual(collectSlots({ 'proslync:home:coverMedia:v2': 'not-json{{{' }), []);
});

test('classifyExt whitelists and falls back', () => {
  assert.equal(classifyExt('file:///a/b/x.MP4', 'video'), 'mp4');
  assert.equal(classifyExt('file:///a/b/x.mov', 'video'), 'mov');
  assert.equal(classifyExt('file:///a/b/x.avi', 'video'), null);
  assert.equal(classifyExt('file:///a/b/x.jpeg', 'image'), 'jpeg');
  assert.equal(classifyExt('file:///a/b/x.heic', 'image'), 'heic');
  assert.equal(classifyExt('file:///a/b/x.bmp', 'image'), null);
  assert.equal(classifyExt('file:///a/b/noext', 'image'), null);
  assert.equal(classifyExt('file:///a/b/x.jpg?size=2', 'image'), 'jpg');
});

test('renderManifest → parseManifestEntries round-trips', () => {
  const entries = {
    'profile-banner': { type: 'video', url: 'https://cdn.jsdelivr.net/gh/o/r@abc123/public/videos/curated/profile-banner.mp4' },
    'cover-ncaab': { type: 'image', requirePath: '../../assets/media/curated/cover-ncaab.jpg' },
  };
  const src = renderManifest(entries);
  assert.ok(src.includes('export const CURATED_MEDIA'));
  assert.ok(src.includes("'profile-banner': { type: 'video', uri: 'https://cdn.jsdelivr.net/gh/o/r@abc123/public/videos/curated/profile-banner.mp4' },"));
  assert.ok(src.includes("'cover-ncaab': { type: 'image', source: require('../../assets/media/curated/cover-ncaab.jpg') },"));
  assert.deepEqual(parseManifestEntries(src), entries);
});

test('renderManifest sorts slots and matches the committed empty-manifest shape', () => {
  const empty = renderManifest({});
  assert.ok(empty.includes('// AUTO-GENERATED by scripts/snapshot-media.mjs — do not edit by hand.'));
  assert.ok(empty.includes("import type { ImageSourcePropType } from 'react-native';"));
  assert.deepEqual(parseManifestEntries(empty), {});
  const src = renderManifest({ b: { type: 'video', url: 'https://x/b.mp4' }, a: { type: 'video', url: 'https://x/a.mp4' } });
  assert.ok(src.indexOf("'a':") < src.indexOf("'b':"));
});

test('merge semantics: spread keeps untouched entries through render/parse round-trip', () => {
  const existing = { a: { type: 'video', url: 'https://old' }, b: { type: 'image', requirePath: '../../assets/media/curated/b.jpg' } };
  const fresh = { a: { type: 'video', url: 'https://new' } };
  const merged = { ...existing, ...fresh };
  const roundTripped = parseManifestEntries(renderManifest(merged));
  assert.deepEqual(roundTripped, {
    a: { type: 'video', url: 'https://new' },
    b: { type: 'image', requirePath: '../../assets/media/curated/b.jpg' },
  });
});
