#!/usr/bin/env node
// Snapshot curated media from the booted iOS simulator (or a connected iPhone)
// into the repos:
//   images → <mobile>/assets/media/curated/   (bundled into the app)
//   videos → <web>/public/videos/curated/     (pushed; streamed via SHA-pinned jsdelivr)
// then regenerates lib/media/curated-manifest.ts. See
// docs/superpowers/specs/2026-06-09-curated-media-persistence-design.md.
//
// Usage:
//   npm run snapshot-media [-- --dry-run]
//   npm run snapshot-media [-- --device]                  # auto-pick single connected iPhone
//   npm run snapshot-media [-- --device "A's iPhone"]     # pick by name or UDID
//   npm run snapshot-media [-- --device <udid> --dry-run] # device + dry-run

import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectSlots, classifyExt, parseManifestEntries, renderManifest, pickDevice } from './lib/snapshot-core.mjs';

const DRY_RUN = process.argv.includes('--dry-run');

// --device [<name-or-udid>]: if the flag is present with a value, use it;
// if the flag is present without a value (next arg starts with -- or is absent), auto-pick.
const DEVICE_FLAG_IDX = process.argv.findIndex((a) => a === '--device');
const USE_DEVICE = DEVICE_FLAG_IDX !== -1;
const DEVICE_REQUESTED = (() => {
  if (!USE_DEVICE) return null;
  const next = process.argv[DEVICE_FLAG_IDX + 1];
  // If next arg exists and is not another flag, treat it as the device name/udid.
  if (next && !next.startsWith('--')) return next;
  return null; // auto-pick
})();
const MOBILE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WEB_REPO = process.env.PROSLYNC_WEB_REPO || path.join(process.env.HOME, 'Desktop', 'proslync-web-v1.1');
const BUNDLE_ID = 'com.proslync.app';
const MANIFEST_PATH = path.join(MOBILE_ROOT, 'lib', 'media', 'curated-manifest.ts');
const IMAGE_DIR = path.join(MOBILE_ROOT, 'assets', 'media', 'curated');
const VIDEO_DIR = path.join(WEB_REPO, 'public', 'videos', 'curated');
const JSDELIVR_FILE_LIMIT = 20 * 1024 * 1024; // hard per-file cap on cdn.jsdelivr.net/gh

function fail(msg) {
  console.error(`\n✖ ${msg}`);
  // Leave device temp dir on failure so the caller can inspect it.
  if (deviceTmpDir && fs.existsSync(deviceTmpDir)) {
    console.error(`  (device temp dir preserved for debugging: ${deviceTmpDir})`);
  }
  process.exit(1);
}

function run(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { encoding: 'utf8', ...opts }).trim();
}

// ── 1. Locate the app container (simulator or device) ────────────────────
let container;
let deviceTmpDir = null; // set when --device; cleaned up on success

if (USE_DEVICE) {
  // ── 1a. Discover the target device ──────────────────────────────────────
  const devicesJsonPath = path.join(os.tmpdir(), `proslync-devices-${Date.now()}.json`);
  try {
    run('xcrun', ['devicectl', 'list', 'devices', '--json-output', devicesJsonPath]);
  } catch (e) {
    fail(`xcrun devicectl list devices failed — is Xcode 16+ installed?\n  (${e.message})`);
  }
  let devicesJson;
  try {
    devicesJson = JSON.parse(fs.readFileSync(devicesJsonPath, 'utf8'));
  } catch {
    fail('Could not parse devicectl JSON output.');
  }
  fs.rmSync(devicesJsonPath, { force: true });

  let device;
  try {
    device = pickDevice(devicesJson, DEVICE_REQUESTED);
  } catch (e) {
    fail(e.message);
  }
  console.log(`• device: ${device.name} (${device.identifier})`);

  // ── 1b. Export the container subtrees we need into a temp dir ────────────
  deviceTmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'proslync-snapshot-'));

  /**
   * Copies a subtree from the device app-data container into `deviceTmpDir`,
   * preserving the relative layout (so `resolveContainerPath` works unchanged).
   * Returns true on success, false on failure (if `required` is false).
   */
  function copyFromDevice(source, required) {
    const destination = path.join(deviceTmpDir, source);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    const result = spawnSync(
      'xcrun',
      [
        'devicectl', 'device', 'copy', 'from',
        '--device', device.identifier,
        '--source', source,
        '--destination', destination,
        '--domain-type', 'appDataContainer',
        '--domain-identifier', BUNDLE_ID,
      ],
      { encoding: 'utf8' },
    );
    if (result.status !== 0) {
      const stderr = (result.stderr || '').trim();
      if (required) {
        // Give the best actionable hint we can from stderr / exit info.
        let hint = 'Unknown error.';
        if (stderr.includes('locked') || stderr.includes('passcode')) {
          hint = 'The device appears to be locked — unlock your iPhone and retry.';
        } else if (stderr.includes('not installed') || stderr.includes('bundle identifier')) {
          hint = `The app (${BUNDLE_ID}) is not installed on the device. Run npm run ios-device first.`;
        } else if (stderr.includes('not entitled') || stderr.includes('not permitted') || stderr.includes('permission')) {
          hint = `Container export requires a development-signed build. TestFlight/App Store builds cannot be exported.`;
        } else if (stderr.includes('not trusted') || stderr.includes('trust')) {
          hint = 'Device is not trusted — tap "Trust" on the iPhone when prompted, then retry.';
        } else if (stderr) {
          hint = stderr;
        }
        fail(
          `Failed to export AsyncStorage from device.\n  ${hint}\n\n` +
          `  Temp dir left for debugging: ${deviceTmpDir}`,
        );
      } else {
        console.log(`  • Documents/proslync-media not found on device (app may not have run yet) — skipping media files.`);
        return false;
      }
    }
    return true;
  }

  // AsyncStorage: required — this is where the slot references live.
  copyFromDevice(`Library/Application Support/${BUNDLE_ID}/RCTAsyncLocalStorage_V1`, true);

  // Media files: optional — may not exist if the app hasn't picked any media.
  copyFromDevice('Documents/proslync-media', false);

  container = deviceTmpDir;
  console.log(`• device container exported: ${deviceTmpDir}`);
} else {
  // ── 1b. Simulator path (default, unchanged) ──────────────────────────────
  try {
    container = run('xcrun', ['simctl', 'get_app_container', 'booted', BUNDLE_ID, 'data']);
  } catch {
    fail(`Couldn't find ${BUNDLE_ID} on a booted simulator. Boot the sim and install the app first (npm run ios).`);
  }
  console.log(`• container: ${container}`);
}

// ── 2. Read AsyncStorage (manifest + spill files for values >1KB) ─────────
const storageDir = path.join(container, 'Library', 'Application Support', BUNDLE_ID, 'RCTAsyncLocalStorage_V1');
const manifestFile = path.join(storageDir, 'manifest.json');
if (!fs.existsSync(manifestFile)) fail(`No AsyncStorage manifest at ${manifestFile} — has the app run on this sim?`);
const rawManifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
const storage = {};
for (const [key, value] of Object.entries(rawManifest)) {
  if (value === null) {
    // Large values are spilled to a file named md5(key).
    const spill = path.join(storageDir, createHash('md5').update(key).digest('hex'));
    if (fs.existsSync(spill)) storage[key] = fs.readFileSync(spill, 'utf8');
  } else {
    storage[key] = value;
  }
}

// ── 3. Collect slots and stage files ──────────────────────────────────────
const slots = collectSlots(storage);
if (!slots.length) fail(`No user-set media found${USE_DEVICE ? ' on the device' : ' in the simulator'}. Set banners/covers/photos in the app first.`);
console.log(`• found ${slots.length} curated slot(s): ${slots.map((s) => s.slot).join(', ')}`);

function resolveContainerPath(uri) {
  // Stored URIs embed the container UUID at write time; reinstalls change the
  // UUID, so re-anchor on the *current* container via the /Documents/ suffix.
  const filePath = decodeURI(uri.replace(/^file:\/\//, ''));
  const docSplit = filePath.split('/Documents/');
  if (docSplit.length === 2) {
    const anchored = path.join(container, 'Documents', docSplit[1]);
    if (fs.existsSync(anchored)) return anchored;
  }
  return fs.existsSync(filePath) ? filePath : null;
}

const staged = { images: [], videos: [] }; // { slot, src, destName, heic? }
for (const { slot, uri, type } of slots) {
  const src = resolveContainerPath(uri);
  if (!src) {
    console.warn(`  ⚠ ${slot}: file missing (${uri}) — skipping`);
    continue;
  }
  const ext = classifyExt(src, type);
  if (!ext) {
    console.warn(`  ⚠ ${slot}: unsupported extension on ${src} — skipping`);
    continue;
  }
  const size = fs.statSync(src).size;
  if (type === 'video') {
    if (size > JSDELIVR_FILE_LIMIT) {
      fail(`${slot}: video is ${(size / 1e6).toFixed(1)}MB — jsdelivr caps files at 20MB.\n  Compress first, e.g.: ffmpeg -i in.mp4 -vcodec libx264 -crf 28 -preset slow -vf scale=720:-2 -an out.mp4`);
    }
    staged.videos.push({ slot, src, destName: `${slot}.${ext}` });
  } else {
    if (size > 2 * 1024 * 1024) console.warn(`  ⚠ ${slot}: image is ${(size / 1e6).toFixed(1)}MB — consider compressing (bundle size)`);
    staged.images.push({ slot, src, destName: ext === 'heic' ? `${slot}.jpg` : `${slot}.${ext}`, heic: ext === 'heic' });
  }
}
if (!staged.images.length && !staged.videos.length) fail('All slots skipped — nothing to snapshot.');

console.log(`• staging ${staged.images.length} image(s) → ${IMAGE_DIR}`);
console.log(`• staging ${staged.videos.length} video(s) → ${VIDEO_DIR}`);
if (DRY_RUN) {
  for (const f of [...staged.images, ...staged.videos]) console.log(`  [dry-run] ${f.slot}: ${f.src} → ${f.destName}`);
  console.log('\nDry run complete — nothing written.');
  if (deviceTmpDir) fs.rmSync(deviceTmpDir, { recursive: true, force: true });
  process.exit(0);
}

fs.mkdirSync(IMAGE_DIR, { recursive: true });
for (const f of staged.images) {
  const dest = path.join(IMAGE_DIR, f.destName);
  if (f.heic) {
    // RN renders HEIC unreliably — convert to JPEG with macOS sips.
    try {
      run('sips', ['-s', 'format', 'jpeg', f.src, '--out', dest]);
    } catch {
      fail(`${f.slot}: sips failed to convert HEIC → JPEG.\n  Try manually: sips -s format jpeg "${f.src}" --out "${dest}"`);
    }
  } else {
    fs.copyFileSync(f.src, dest);
  }
  console.log(`  ✓ ${f.slot} → assets/media/curated/${f.destName}`);
}

// ── 4. Publish videos via the web repo ────────────────────────────────────
let webSha = null;
let webRemote = null;
if (staged.videos.length) {
  if (!fs.existsSync(path.join(WEB_REPO, '.git'))) fail(`Web repo not found at ${WEB_REPO} (override with PROSLYNC_WEB_REPO env var).`);
  fs.mkdirSync(VIDEO_DIR, { recursive: true });
  for (const f of staged.videos) {
    fs.copyFileSync(f.src, path.join(VIDEO_DIR, f.destName));
    console.log(`  ✓ ${f.slot} → public/videos/curated/${f.destName}`);
  }
  const preStaged = run('git', ['-C', WEB_REPO, 'diff', '--cached', '--name-only'])
    .split('\n')
    .filter((l) => l && !l.startsWith('public/videos/curated'));
  if (preStaged.length) {
    fail(`Web repo has unrelated staged changes — commit or unstage them first:\n  ${preStaged.join('\n  ')}`);
  }
  run('git', ['-C', WEB_REPO, 'add', 'public/videos/curated']);
  const hasChanges = run('git', ['-C', WEB_REPO, 'diff', '--cached', '--name-only']) !== '';
  if (hasChanges) {
    run('git', ['-C', WEB_REPO, 'commit', '-m', `chore(media): curated mobile media snapshot ${new Date().toISOString().slice(0, 10)}`]);
    try {
      run('git', ['-C', WEB_REPO, 'push', 'origin', 'HEAD']);
    } catch (e) {
      fail(`Push to web repo failed — pull/rebase or check credentials, then re-run.\n  (git said: ${e.stderr?.toString().trim() || e.message})`);
    }
    console.log('• web repo committed + pushed');
  } else {
    console.log('• video files unchanged — reusing current web HEAD');
  }
  webSha = run('git', ['-C', WEB_REPO, 'rev-parse', 'HEAD']);
  const originUrl = run('git', ['-C', WEB_REPO, 'remote', 'get-url', 'origin']);
  const m = /github\.com[:/]([^/]+)\/([^/.]+)/.exec(originUrl);
  if (!m) fail(`Can't parse GitHub owner/repo from origin URL: ${originUrl}`);
  webRemote = `${m[1]}/${m[2]}`;
}

// ── 5. Verify CDN serves every video (range request → 206) ───────────────
async function verifyCdn(url) {
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { headers: { Range: 'bytes=0-99' } });
      if (res.status === 206 || res.status === 200) return true;
      else process.stdout.write(`[${res.status}] `);
    } catch (e) {
      process.stdout.write(`[${e.cause?.code || e.code || 'fetch-error'}] `);
    }
    await new Promise((r) => setTimeout(r, 5000));
  }
  return false;
}

const freshEntries = {};
for (const f of staged.images) {
  freshEntries[f.slot] = { type: 'image', requirePath: `../../assets/media/curated/${f.destName}` };
}
for (const f of staged.videos) {
  const url = `https://cdn.jsdelivr.net/gh/${webRemote}@${webSha}/public/videos/curated/${f.destName}`;
  process.stdout.write(`• verifying CDN: ${url} ... `);
  if (!(await verifyCdn(url))) fail(`CDN never served ${url} (90s timeout). Check the push, then re-run — the script is idempotent.`);
  console.log('206 ✓');
  freshEntries[f.slot] = { type: 'video', url };
}

// ── 6. Merge + write the manifest ─────────────────────────────────────────
const existing = fs.existsSync(MANIFEST_PATH) ? parseManifestEntries(fs.readFileSync(MANIFEST_PATH, 'utf8')) : {};
const merged = { ...existing, ...freshEntries };
fs.writeFileSync(MANIFEST_PATH, renderManifest(merged));
console.log(`\n✓ wrote lib/media/curated-manifest.ts (${Object.keys(merged).length} slot(s): ${Object.keys(freshEntries).length} updated, ${Object.keys(merged).length - Object.keys(freshEntries).length} carried over)`);

console.log(`\nNext — review and commit the mobile repo:
  cd ${MOBILE_ROOT}
  git add assets/media/curated lib/media/curated-manifest.ts
  git commit -m "chore(media): curated media snapshot"
`);

// Clean up device temp dir on success (leave it on failure for debugging).
if (deviceTmpDir) {
  fs.rmSync(deviceTmpDir, { recursive: true, force: true });
}
