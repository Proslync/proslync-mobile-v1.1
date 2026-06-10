#!/usr/bin/env node
// Snapshot curated media from the booted iOS simulator into the repos:
//   images → <mobile>/assets/media/curated/   (bundled into the app)
//   videos → <web>/public/videos/curated/     (pushed; streamed via SHA-pinned jsdelivr)
// then regenerates lib/media/curated-manifest.ts. See
// docs/superpowers/specs/2026-06-09-curated-media-persistence-design.md.
//
// Usage: npm run snapshot-media [-- --dry-run]

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectSlots, classifyExt, parseManifestEntries, renderManifest } from './lib/snapshot-core.mjs';

const DRY_RUN = process.argv.includes('--dry-run');
const MOBILE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WEB_REPO = process.env.PROSLYNC_WEB_REPO || path.join(process.env.HOME, 'Desktop', 'proslync-web-v1.1');
const BUNDLE_ID = 'com.proslync.app';
const MANIFEST_PATH = path.join(MOBILE_ROOT, 'lib', 'media', 'curated-manifest.ts');
const IMAGE_DIR = path.join(MOBILE_ROOT, 'assets', 'media', 'curated');
const VIDEO_DIR = path.join(WEB_REPO, 'public', 'videos', 'curated');
const JSDELIVR_FILE_LIMIT = 20 * 1024 * 1024; // hard per-file cap on cdn.jsdelivr.net/gh

function fail(msg) {
  console.error(`\n✖ ${msg}`);
  process.exit(1);
}

function run(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { encoding: 'utf8', ...opts }).trim();
}

// ── 1. Locate the simulator app container ────────────────────────────────
let container;
try {
  container = run('xcrun', ['simctl', 'get_app_container', 'booted', BUNDLE_ID, 'data']);
} catch {
  fail(`Couldn't find ${BUNDLE_ID} on a booted simulator. Boot the sim and install the app first (npm run ios).`);
}
console.log(`• container: ${container}`);

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
if (!slots.length) fail('No user-set media found in the simulator. Set banners/covers/photos in the app first.');
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
