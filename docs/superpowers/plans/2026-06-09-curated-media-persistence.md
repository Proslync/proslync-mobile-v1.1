# Curated Media Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Media Arshia sets in the simulator (banners, covers, logos, avatar) becomes baked-in app content that ships identically in every TestFlight build, via a snapshot script that copies sim media into the repos and generates a committed manifest.

**Architecture:** Each customizable surface is a named slot resolving local pick → curated default → legacy fallback. Curated images are bundled in the mobile repo; curated videos are pushed to the public web repo and streamed via SHA-pinned jsdelivr URLs (bundled videos break AVPlayer in production iOS). `scripts/snapshot-media.mjs` reads the booted simulator's app container and regenerates `lib/media/curated-manifest.ts`.

**Tech Stack:** React Native 0.81 / Expo SDK 54, TypeScript, AsyncStorage, expo-file-system, expo-image-picker, expo-video; plain Node 24 (`node:test`) for the snapshot script.

**Spec:** `docs/superpowers/specs/2026-06-09-curated-media-persistence-design.md`

**Session notes:**
- Repo: `~/Desktop/proslync-mobile-v1.1`, branch `arshia`. Web repo (video host): `~/Desktop/proslync-web-v1.1`, public on GitHub as `arshiarahnavard7-sys/proslync-web-v1.1`.
- Use nvm node: `export PATH="$HOME/.nvm/versions/node/v24.11.1/bin:$PATH"`.
- CLAUDE.md's GitNexus MCP tools are NOT connected in this session. In lieu of `gitnexus_impact`, each task lists the exact `grep` usage-checks for the symbols it touches — run them before editing. After the final commit, run `npx gitnexus analyze` if available.
- There is no RN unit-test infra (no jest). RN-code tasks verify with `npx tsc --noEmit` + in-sim checks; the snapshot script's pure core is TDD'd with Node's built-in `node --test`.
- TypeScript check command for all tasks: `cd ~/Desktop/proslync-mobile-v1.1 && npx tsc --noEmit` — expect zero errors (verify it's zero-error BEFORE starting; if pre-existing errors exist, record them and ensure no NEW ones).

---

## File structure

| File | Responsibility |
|---|---|
| `lib/media/local-media.ts` (create) | Device-local media: `persistLocalMedia` (copy pick into documentDirectory), `isLocalMediaAlive` (orphan detection) |
| `lib/media/curated-manifest.ts` (create, then generated) | The baked curation: slot → bundled image `require()` or hosted video URL. AUTO-GENERATED after Task 7; the hand-written initial version is empty |
| `lib/media/resolve-media.ts` (create) | Pure resolution: `resolveSlotMedia(slot, local)` and `resolveAvatarSource(...)` |
| `assets/media/curated/` (create) | Bundled curated images (snapshot output) |
| `app/(tabs)/profile.tsx` (modify) | Athlete banner → v2 `{uri,type}` + resolver; avatar local persistence + resolver |
| `components/coach/coach-profile.tsx` (modify) | Coach banner → v2 + resolver |
| `app/(tabs)/index.tsx` (modify) | Covers/logos: shared persist helper, orphan pruning, resolver in `SectionCard` |
| `app/edit-profile.tsx` (modify) | Avatar picker persists locally instead of calling nonexistent backend upload |
| `scripts/lib/snapshot-core.mjs` (create) | Pure: collect slots from storage dump, parse/render manifest, ext validation |
| `scripts/lib/snapshot-core.test.mjs` (create) | `node --test` tests for the core |
| `scripts/snapshot-media.mjs` (create) | CLI: sim container IO, file staging, web-repo commit/push, CDN verify, manifest write |
| `package.json` (modify) | Add `snapshot-media` script |

AsyncStorage keys (final state):

| Key | Value |
|---|---|
| `proslync:profile:banner:v2` | JSON `{ uri, type: 'image'\|'video' }` (migrates `proslync:profile:bannerVideo:v1` string) |
| `proslync:coachprofile:banner:v2` | same (migrates `proslync:coachprofile:bannerVideo:v1`) |
| `proslync:home:coverMedia:v2` | unchanged: JSON `{ [sectionId]: { uri, type } }` |
| `proslync:home:customLogos:v1` | unchanged: JSON `{ [sectionId]: uri }` |
| `proslync:profile:avatar:v1` | plain string file URI (new) |

---

### Task 1: Media foundation module (`lib/media/`)

**Files:**
- Create: `lib/media/local-media.ts`
- Create: `lib/media/curated-manifest.ts`
- Create: `lib/media/resolve-media.ts`
- Create: `assets/media/curated/.gitkeep` (empty file)

- [ ] **Step 1: Create `lib/media/local-media.ts`**

```ts
import * as FileSystem from 'expo-file-system';

export type LocalMediaType = 'image' | 'video';

export type LocalMedia = { uri: string; type: LocalMediaType };

/**
 * Copies a picked asset (image/video) into the app's persistent
 * documentDirectory under proslync-media/<slot>/ so the URI survives app
 * restarts. The picker's returned URI typically points to a temp/cache file
 * that gets purged.
 */
export async function persistLocalMedia(
  uri: string,
  slot: string,
  kind: LocalMediaType,
): Promise<string> {
  try {
    const dir = `${FileSystem.documentDirectory}proslync-media/${slot}/`;
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    const fallbackExt = kind === 'video' ? 'mp4' : 'jpg';
    const ext = (uri.split('?')[0].split('.').pop() || fallbackExt).toLowerCase();
    const safeExt = /^[a-z0-9]{2,4}$/.test(ext) ? ext : fallbackExt;
    const dest = `${dir}${Date.now()}.${safeExt}`;
    await FileSystem.copyAsync({ from: uri, to: dest });
    return dest;
  } catch {
    // If copy fails, fall back to the original URI — better than nothing.
    return uri;
  }
}

/**
 * True if a locally-persisted media URI still points at an existing file.
 * Non-file URIs (https, bundled) are always considered alive. If the check
 * itself fails, we trust the URI rather than destroying user state.
 */
export async function isLocalMediaAlive(uri: string): Promise<boolean> {
  if (!uri.startsWith('file://')) return true;
  try {
    const info = await FileSystem.getInfoAsync(uri);
    return info.exists;
  } catch {
    return true;
  }
}
```

- [ ] **Step 2: Create `lib/media/curated-manifest.ts` (initial empty version)**

```ts
// AUTO-GENERATED by scripts/snapshot-media.mjs — do not edit by hand.
// Run `npm run snapshot-media` after curating media in the simulator.
import type { ImageSourcePropType } from 'react-native';

export type CuratedMediaEntry =
  | { type: 'image'; source: ImageSourcePropType } // bundled in the app binary
  | { type: 'video'; uri: string }; // hosted, SHA-pinned CDN URL

export const CURATED_MEDIA: Record<string, CuratedMediaEntry> = {};
```

- [ ] **Step 3: Create `lib/media/resolve-media.ts`**

```ts
import type { ImageSourcePropType } from 'react-native';
import { CURATED_MEDIA } from './curated-manifest';
import type { LocalMedia } from './local-media';

export type ResolvedMedia =
  | { kind: 'local'; type: 'image' | 'video'; uri: string }
  | { kind: 'curated-image'; type: 'image'; source: ImageSourcePropType }
  | { kind: 'curated-video'; type: 'video'; uri: string }
  | { kind: 'none' };

/**
 * Resolution order for a media slot:
 *   1. local user pick (validated by the screen at hydration time)
 *   2. curated default baked into the build
 *   3. 'none' — caller renders its legacy fallback
 */
export function resolveSlotMedia(slot: string, local: LocalMedia | null): ResolvedMedia {
  if (local) return { kind: 'local', type: local.type, uri: local.uri };
  const curated = CURATED_MEDIA[slot];
  if (curated) {
    return curated.type === 'image'
      ? { kind: 'curated-image', type: 'image', source: curated.source }
      : { kind: 'curated-video', type: 'video', uri: curated.uri };
  }
  return { kind: 'none' };
}

/**
 * Avatar-specific resolution: local pick → curated 'profile-avatar' slot →
 * server avatar URL → caller's bundled fallback. Always returns a renderable
 * Image source.
 */
export function resolveAvatarSource(
  localUri: string | null,
  serverUrl: string | null | undefined,
  fallback: ImageSourcePropType,
): ImageSourcePropType {
  if (localUri) return { uri: localUri };
  const curated = CURATED_MEDIA['profile-avatar'];
  if (curated) return curated.type === 'image' ? curated.source : { uri: curated.uri };
  if (serverUrl) return { uri: serverUrl };
  return fallback;
}
```

- [ ] **Step 4: Create `assets/media/curated/.gitkeep`** (empty file, so the directory exists in git)

- [ ] **Step 5: Typecheck**

Run: `cd ~/Desktop/proslync-mobile-v1.1 && npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 6: Commit**

```bash
cd ~/Desktop/proslync-mobile-v1.1
git add lib/media assets/media/curated/.gitkeep
git commit -m "feat(media): foundation for curated media slots (resolver + local persistence helpers)"
```

---

### Task 2: Athlete profile banner — v2 shape, image support, curated fallback

**Files:**
- Modify: `app/(tabs)/profile.tsx` (banner block ~lines 1842–1913, render ~1971–1991, RoleSwitcherSheet props ~2293–2295)

**Usage check first** (manual impact analysis): `grep -n "bannerVideo\|pickBannerVideo\|removeBannerVideo" "app/(tabs)/profile.tsx"` — all hits must be inside the ranges this task rewrites (state block, player effects, picker, render, and lines 2293–2295). If new hits appear elsewhere, update them the same way.

- [ ] **Step 1: Add imports**

In the import block of `app/(tabs)/profile.tsx`, add (keep existing imports; `FileSystem`, `ImagePicker`, `AsyncStorage` are already imported):

```ts
import { persistLocalMedia, isLocalMediaAlive, type LocalMedia } from '@/lib/media/local-media';
import { resolveSlotMedia } from '@/lib/media/resolve-media';
```

- [ ] **Step 2: Replace the banner state/hydration/persist block (currently lines 1842–1860)**

Replace:

```ts
  // Persistent custom banner video.
  const [bannerVideo, setBannerVideo] = React.useState<string | null>(null);
  const [bannerHydrated, setBannerHydrated] = React.useState(false);
  React.useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem('proslync:profile:bannerVideo:v1')
      .then((v) => { if (!cancelled && v) setBannerVideo(v); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setBannerHydrated(true); });
    return () => { cancelled = true; };
  }, []);
  React.useEffect(() => {
    if (!bannerHydrated) return;
    if (bannerVideo) {
      AsyncStorage.setItem('proslync:profile:bannerVideo:v1', bannerVideo).catch(() => {});
    } else {
      AsyncStorage.removeItem('proslync:profile:bannerVideo:v1').catch(() => {});
    }
  }, [bannerVideo, bannerHydrated]);
```

with:

```ts
  // Persistent custom banner (image or video). v2 stores { uri, type }; v1
  // stored a bare video URI string and is migrated on first hydration.
  const BANNER_KEY = 'proslync:profile:banner:v2';
  const BANNER_KEY_LEGACY = 'proslync:profile:bannerVideo:v1';
  const [banner, setBanner] = React.useState<LocalMedia | null>(null);
  const [bannerHydrated, setBannerHydrated] = React.useState(false);
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let next: LocalMedia | null = null;
        const v2 = await AsyncStorage.getItem(BANNER_KEY);
        if (v2) {
          next = JSON.parse(v2);
        } else {
          const v1 = await AsyncStorage.getItem(BANNER_KEY_LEGACY);
          if (v1) {
            next = { uri: v1, type: 'video' };
            AsyncStorage.removeItem(BANNER_KEY_LEGACY).catch(() => {});
          }
        }
        // Orphan healing: a reinstall wipes documentDirectory but not always
        // AsyncStorage — drop pointers to files that no longer exist so the
        // curated default shows instead of a black box.
        if (next && !(await isLocalMediaAlive(next.uri))) next = null;
        if (!cancelled && next) setBanner(next);
      } catch {
        // ignore corrupt storage
      } finally {
        if (!cancelled) setBannerHydrated(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);
  React.useEffect(() => {
    if (!bannerHydrated) return;
    if (banner) {
      AsyncStorage.setItem(BANNER_KEY, JSON.stringify(banner)).catch(() => {});
    } else {
      AsyncStorage.removeItem(BANNER_KEY).catch(() => {});
    }
  }, [banner, bannerHydrated]);

  const bannerMedia = resolveSlotMedia('profile-banner', banner);
  const bannerVideoUri =
    bannerMedia.kind !== 'none' && bannerMedia.type === 'video' ? bannerMedia.uri : null;
```

- [ ] **Step 3: Update the video player to use the resolved URI (currently lines 1862–1879)**

Replace `useVideoPlayer(bannerVideo ?? null, ...)` with `useVideoPlayer(bannerVideoUri, ...)` (the config callback body stays identical), and in the keep-playing effect replace both `bannerVideo` references with `bannerVideoUri`:

```ts
  const bannerPlayer = useVideoPlayer(bannerVideoUri, (p) => {
    if (!p) return;
    p.loop = true;
    p.muted = true;
    p.play();
  });

  // Keep banner video playing through re-renders / focus changes / hot reloads.
  React.useEffect(() => {
    if (!bannerPlayer || !bannerVideoUri) return;
    bannerPlayer.play();
    const sub = bannerPlayer.addListener('playingChange', (e: any) => {
      if (!e?.isPlaying) {
        try { bannerPlayer.play(); } catch {}
      }
    });
    return () => { try { sub.remove(); } catch {} };
  }, [bannerPlayer, bannerVideoUri]);
```

- [ ] **Step 4: Replace the picker (currently lines 1881–1913)**

Replace `pickBannerVideo`/`removeBannerVideo` with:

```ts
  const pickBanner = React.useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Photo access needed', 'Allow photo library access in Settings to pick media.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const type: 'image' | 'video' = asset.type === 'video' ? 'video' : 'image';
      const persistedUri = await persistLocalMedia(asset.uri, 'profile-banner', type);
      setBanner({ uri: persistedUri, type });
    }
  }, []);

  const removeBanner = React.useCallback(() => {
    setBanner(null);
  }, []);
```

- [ ] **Step 5: Replace the banner render (currently lines 1972–1985)**

Replace the `{bannerVideo ? <VideoView .../> : <Image .../>}` branch with:

```tsx
            {bannerVideoUri ? (
              <VideoView
                player={bannerPlayer}
                style={{ position: 'absolute', top: -15, left: -3, width: 420, height: 320 }}
                contentFit="cover"
                nativeControls={false}
              />
            ) : (
              <Image
                source={
                  bannerMedia.kind === 'local'
                    ? { uri: bannerMedia.uri }
                    : bannerMedia.kind === 'curated-image'
                      ? bannerMedia.source
                      : require('@/assets/images/kiyan-banner.png')
                }
                style={{ position: 'absolute', top: -15, left: -3, width: 420, height: 320 }}
                resizeMode="cover"
              />
            )}
```

- [ ] **Step 6: Update RoleSwitcherSheet props (currently lines 2293–2295)**

```tsx
        onChangeBanner={pickBanner}
        onRemoveBanner={removeBanner}
        hasCustomBanner={!!banner}
```

- [ ] **Step 7: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors. (If `LocalMedia` import is flagged unused, the state block in Step 2 wasn't applied.)

- [ ] **Step 8: Smoke-test in sim**

With Metro running (`npm run ios` or existing session): open profile tab → banner shows the kiyan PNG fallback → pick a banner *image* via the role sheet's change-banner action → image shows → relaunch the app (Cmd+R or kill/reopen) → image persists.

- [ ] **Step 9: Commit**

```bash
git add "app/(tabs)/profile.tsx"
git commit -m "feat(profile): banner v2 (image or video) with curated-manifest fallback and orphan healing"
```

---

### Task 3: Coach profile banner — same treatment

**Files:**
- Modify: `components/coach/coach-profile.tsx` (banner block lines 164–231, render 284–297, props 723–725)

**Usage check:** `grep -n "bannerVideo\|pickBannerVideo\|removeBannerVideo" components/coach/coach-profile.tsx` — hits only in the ranges above.

- [ ] **Step 1: Add imports**

```ts
import { persistLocalMedia, isLocalMediaAlive, type LocalMedia } from '@/lib/media/local-media';
import { resolveSlotMedia } from '@/lib/media/resolve-media';
```

- [ ] **Step 2: Replace state/hydration/persist (lines 164–182)**

Identical pattern to Task 2 Step 2, with these substitutions — keys `proslync:coachprofile:banner:v2` / `proslync:coachprofile:bannerVideo:v1`, slot `'coach-banner'`:

```ts
  // Persistent custom banner (image or video) for the coach profile.
  const BANNER_KEY = 'proslync:coachprofile:banner:v2';
  const BANNER_KEY_LEGACY = 'proslync:coachprofile:bannerVideo:v1';
  const [banner, setBanner] = React.useState<LocalMedia | null>(null);
  const [bannerHydrated, setBannerHydrated] = React.useState(false);
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let next: LocalMedia | null = null;
        const v2 = await AsyncStorage.getItem(BANNER_KEY);
        if (v2) {
          next = JSON.parse(v2);
        } else {
          const v1 = await AsyncStorage.getItem(BANNER_KEY_LEGACY);
          if (v1) {
            next = { uri: v1, type: 'video' };
            AsyncStorage.removeItem(BANNER_KEY_LEGACY).catch(() => {});
          }
        }
        if (next && !(await isLocalMediaAlive(next.uri))) next = null;
        if (!cancelled && next) setBanner(next);
      } catch {
      } finally {
        if (!cancelled) setBannerHydrated(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);
  React.useEffect(() => {
    if (!bannerHydrated) return;
    if (banner) {
      AsyncStorage.setItem(BANNER_KEY, JSON.stringify(banner)).catch(() => {});
    } else {
      AsyncStorage.removeItem(BANNER_KEY).catch(() => {});
    }
  }, [banner, bannerHydrated]);

  const bannerMedia = resolveSlotMedia('coach-banner', banner);
  const bannerVideoUri =
    bannerMedia.kind !== 'none' && bannerMedia.type === 'video' ? bannerMedia.uri : null;
```

- [ ] **Step 3: Player + keep-playing effect (lines 184–200)** — same as Task 2 Step 3 (`bannerVideoUri` replaces `bannerVideo`).

- [ ] **Step 4: Picker (lines 202–231)** — same as Task 2 Step 4 but slot `'coach-banner'`; names `pickBanner` / `removeBanner`.

- [ ] **Step 5: Render (lines 284–297)** — same branch as Task 2 Step 5 with fallback `require('@/assets/images/coach-banner.png')`.

- [ ] **Step 6: Props (lines 723–725)** — `onChangeBanner={pickBanner}`, `onRemoveBanner={removeBanner}`, `hasCustomBanner={!!banner}`.

- [ ] **Step 7: Typecheck** — `npx tsc --noEmit`, no new errors.

- [ ] **Step 8: Commit**

```bash
git add components/coach/coach-profile.tsx
git commit -m "feat(coach): banner v2 (image or video) with curated fallback and orphan healing"
```

---

### Task 4: Home dashboard covers & logos — shared helper, pruning, curated fallback

**Files:**
- Modify: `app/(tabs)/index.tsx` (persistAsset ~1146–1163, hydration ~1189–1218, pickers ~1237–1273, `SectionCard` ~851–906, call site ~1309–1310)

**Usage check:** `grep -n "persistAsset\|coverMedia\|customLogo" "app/(tabs)/index.tsx"` — confirm `persistAsset` is used only by `pickCoverPhoto`/`pickLogo`, and `SectionCard` is the only component receiving `coverMedia`/`customLogo` props.

- [ ] **Step 1: Imports + delete local `persistAsset`**

Add imports:

```ts
import { persistLocalMedia, isLocalMediaAlive, type LocalMedia } from '@/lib/media/local-media';
import { resolveSlotMedia } from '@/lib/media/resolve-media';
```

Delete the module-level `persistAsset` function (lines 1146–1163) and the now-redundant local type alias line `type CoverMedia = { uri: string; type: 'image' | 'video' };` (line 1140), replacing the latter with:

```ts
type CoverMedia = LocalMedia;
```

(Keeping the `CoverMedia` name avoids touching every annotation in the file.)

- [ ] **Step 2: Update pickers to the shared helper**

In `pickCoverPhoto` replace:

```ts
      const persistedUri = await persistAsset(asset.uri, `cover-${sectionId}`, type);
```

with:

```ts
      const persistedUri = await persistLocalMedia(asset.uri, `cover-${sectionId}`, type);
```

In `pickLogo` replace:

```ts
      const persistedUri = await persistAsset(result.assets[0].uri, `logo-${sectionId}`, 'image');
```

with:

```ts
      const persistedUri = await persistLocalMedia(result.assets[0].uri, `logo-${sectionId}`, 'image');
```

- [ ] **Step 3: Prune orphans during hydration (lines 1189–1218)**

Replace the hydration effect body's success path with a pruning version:

```ts
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [coversRaw, legacyRaw, logosRaw] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY_COVERS),
          AsyncStorage.getItem(STORAGE_KEY_COVERS_LEGACY),
          AsyncStorage.getItem(STORAGE_KEY_LOGOS),
        ]);
        if (cancelled) return;
        let covers: Record<string, CoverMedia> = {};
        if (coversRaw) {
          covers = JSON.parse(coversRaw);
        } else if (legacyRaw) {
          // Migrate legacy v1: { [id]: uri } → { [id]: { uri, type: 'image' } }
          const legacy = JSON.parse(legacyRaw) as Record<string, string>;
          Object.entries(legacy).forEach(([id, uri]) => {
            covers[id] = { uri, type: 'image' };
          });
        }
        // Orphan healing: drop entries whose backing file is gone (reinstall).
        const prunedCovers: Record<string, CoverMedia> = {};
        for (const [id, m] of Object.entries(covers)) {
          if (await isLocalMediaAlive(m.uri)) prunedCovers[id] = m;
        }
        const logos = logosRaw ? (JSON.parse(logosRaw) as Record<string, string>) : {};
        const prunedLogos: Record<string, string> = {};
        for (const [id, uri] of Object.entries(logos)) {
          if (await isLocalMediaAlive(uri)) prunedLogos[id] = uri;
        }
        if (cancelled) return;
        if (Object.keys(prunedCovers).length) setCoverMedia(prunedCovers);
        if (Object.keys(prunedLogos).length) setCustomLogos(prunedLogos);
      } catch {
        // ignore corrupt storage
      } finally {
        if (!cancelled) setStorageHydrated(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);
```

- [ ] **Step 4: Resolve in `SectionCard` (lines 851–906)**

Inside `SectionCard`, replace:

```ts
  const isVideoCover = coverMedia?.type === 'video';
  const bgSource = coverMedia
    ? (coverMedia.type === 'image' ? { uri: coverMedia.uri } : null)
    : section.bgImage;
```

with:

```ts
  const resolvedCover = resolveSlotMedia(`cover-${section.id}`, coverMedia ?? null);
  const coverVideoUri =
    resolvedCover.kind !== 'none' && resolvedCover.type === 'video' ? resolvedCover.uri : null;
  const bgSource =
    resolvedCover.kind === 'local' && resolvedCover.type === 'image'
      ? { uri: resolvedCover.uri }
      : resolvedCover.kind === 'curated-image'
        ? resolvedCover.source
        : resolvedCover.kind === 'none'
          ? section.bgImage
          : null;
```

Update the render branch (lines 876–886): replace `isVideoCover` with `!!coverVideoUri` and `<VideoCover uri={coverMedia!.uri} ...>` with `<VideoCover uri={coverVideoUri!} ...>`:

```tsx
      {(bgSource || coverVideoUri) && (
        <>
          {coverVideoUri ? (
            <VideoCover uri={coverVideoUri} style={styles.sectionBgImage} />
          ) : (
            <Image
              source={bgSource!}
              style={styles.sectionBgImage}
              resizeMode="cover"
            />
          )}
```

And the logo render (lines 905–906): replace

```tsx
          {customLogo ? (
            <Image source={{ uri: customLogo }} style={styles.sectionIconImage} />
```

with:

```tsx
          {(() => {
            const resolvedLogo = resolveSlotMedia(
              `logo-${section.id}`,
              customLogo ? { uri: customLogo, type: 'image' } : null,
            );
            return resolvedLogo.kind !== 'none' && resolvedLogo.type === 'image' ? (
              <Image
                source={resolvedLogo.kind === 'local' ? { uri: resolvedLogo.uri } : (resolvedLogo as any).source}
                style={styles.sectionIconImage}
              />
            ) : null;
          })()}
```

then reconnect the original `: (` else-branch (the default icon) so the surrounding ternary structure stays valid — the original code was `{customLogo ? (...) : (...default icon...)}`; the new structure is `{resolvedLogo-is-image ? (...) : (...default icon...)}`, so implement it as a small const above the return instead if the IIFE reads poorly:

```ts
  const resolvedLogo = resolveSlotMedia(
    `logo-${section.id}`,
    customLogo ? { uri: customLogo, type: 'image' } : null,
  );
  const logoSource =
    resolvedLogo.kind === 'local'
      ? { uri: resolvedLogo.uri }
      : resolvedLogo.kind === 'curated-image'
        ? resolvedLogo.source
        : null;
```

and render `{logoSource ? (<Image source={logoSource} style={styles.sectionIconImage} />) : (...original default icon branch...)}`. **Prefer this const version.**

- [ ] **Step 5: Typecheck** — `npx tsc --noEmit`, no new errors.

- [ ] **Step 6: Smoke-test in sim** — home tab renders; pick a cover and a logo for one section; relaunch; both persist.

- [ ] **Step 7: Commit**

```bash
git add "app/(tabs)/index.tsx"
git commit -m "feat(home): covers/logos resolve through curated manifest, shared persist helper, orphan pruning"
```

---

### Task 5: Avatar — local persistence + curated fallback

**Files:**
- Modify: `app/edit-profile.tsx` (uploadAvatar ~119–141, avatarUrl ~186, render ~252, imports)
- Modify: `app/(tabs)/profile.tsx` (avatar memo ~1829–1836, viewer ~2240–2243, pill ~2280–2283, SocialPostCard def ~197–208 + call site ~2166)

**Usage check:** `grep -n "uploadAvatar\|selectedImage\|avatarUrl" app/edit-profile.tsx` and `grep -n "avatarUrl\|kiyan-avatar" "app/(tabs)/profile.tsx"`.

- [ ] **Step 1: `app/edit-profile.tsx` — imports**

Add:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persistLocalMedia } from '@/lib/media/local-media';
import { resolveAvatarSource } from '@/lib/media/resolve-media';
```

(`authApi` stays imported — `handleSave` still uses `authApi.updateProfile`.)

- [ ] **Step 2: `app/edit-profile.tsx` — replace `uploadAvatar` (lines 119–141)**

The VPS has no `/api/files/*` endpoints (see spec §1), so the presigned-URL flow always failed. Persist locally instead:

```ts
  const AVATAR_KEY = 'proslync:profile:avatar:v1';

  const saveAvatarLocally = async (uri: string) => {
    setIsUploadingPhoto(true);
    try {
      const persistedUri = await persistLocalMedia(uri, 'profile-avatar', 'image');
      setSelectedImage(persistedUri);
      await AsyncStorage.setItem(AVATAR_KEY, persistedUri);
      showSuccess('Photo updated');
    } catch (error: any) {
      console.error('Save avatar error:', error);
      showError(error?.message || 'Failed to save photo');
      setSelectedImage(null);
    } finally {
      setIsUploadingPhoto(false);
    }
  };
```

Update both call sites (`handlePickImage` line 87, `handleOpenCamera` line 111): `await uploadAvatar(asset.uri, asset.fileSize);` → `await saveAvatarLocally(asset.uri);`.

- [ ] **Step 3: `app/edit-profile.tsx` — hydrate + resolve (lines 186 and 252)**

Below the `formData` hydration effect, add:

```ts
  React.useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem('proslync:profile:avatar:v1')
      .then((v) => { if (!cancelled && v) setSelectedImage(v); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);
```

Replace line 186:

```ts
  const avatarSource = selectedImage
    ? { uri: selectedImage }
    : resolveAvatarSource(null, user?.avatar?.url, DEFAULT_AVATAR);
```

Replace line 252's `source={avatarUrl ? { uri: avatarUrl } : DEFAULT_AVATAR}` with `source={avatarSource}`. Fix any other `avatarUrl` references in this file the typechecker flags.

- [ ] **Step 4: `app/(tabs)/profile.tsx` — hydrate local avatar + resolve**

Add import (extends Task 2's import): `resolveAvatarSource` from `@/lib/media/resolve-media`, and add to the avatar area (near the banner state added in Task 2):

```ts
  const [localAvatar, setLocalAvatar] = React.useState<string | null>(null);
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const v = await AsyncStorage.getItem('proslync:profile:avatar:v1');
        if (v && (await isLocalMediaAlive(v))) {
          if (!cancelled) setLocalAvatar(v);
        } else if (v) {
          AsyncStorage.removeItem('proslync:profile:avatar:v1').catch(() => {});
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);
```

Replace the memo at 1829–1836:

```ts
  const { username, avatarSource, initial } = React.useMemo(
    () => ({
      username: "kiyan",
      avatarSource: resolveAvatarSource(
        localAvatar,
        user?.avatar?.url,
        require('@/assets/images/kiyan-avatar.png'),
      ),
      initial: "K",
    }),
    [user, localAvatar],
  );
```

- [ ] **Step 5: `app/(tabs)/profile.tsx` — render sites**

1. Top-left pill (line 2281): `source={require('@/assets/images/kiyan-avatar.png')}` → `source={avatarSource}`.
2. Avatar viewer (lines 1934 and 2240–2243): `handleAvatarTap`'s `if (avatarUrl) setShowAvatarViewer(true);` → `setShowAvatarViewer(true);` and the viewer's `{avatarUrl && (<Image source={{ uri: avatarUrl }} ...` → `<Image source={avatarSource} ...` (drop the conditional wrapper, keep the style prop).
3. `SocialPostCard` (line 197): add an `avatarSource` prop and use it:

```ts
function SocialPostCard({ post, athleteName, athleteMeta, avatarSource }: { post: SocialPost; athleteName: string; athleteMeta: string; avatarSource: ImageSourcePropType }) {
```

(import `ImageSourcePropType` as a type from `react-native` if not present), replace line 205–208's `source={require('@/assets/images/kiyan-avatar.png')}` with `source={avatarSource}`, and at the call site (line 2166) pass `avatarSource={avatarSource}`.

- [ ] **Step 6: Typecheck** — `npx tsc --noEmit`, no new errors (it will catch any missed `avatarUrl` reference).

- [ ] **Step 7: Smoke-test in sim** — edit profile → change photo → toast "Photo updated", no network error (previously this errored against the VPS); profile tab pill + social cards show the new photo; relaunch → persists.

- [ ] **Step 8: Commit**

```bash
git add app/edit-profile.tsx "app/(tabs)/profile.tsx"
git commit -m "feat(avatar): local persistence with curated fallback (backend file upload doesn't exist yet)"
```

---

### Task 6: Snapshot core — pure logic, TDD with node:test

**Files:**
- Create: `scripts/lib/snapshot-core.mjs`
- Create: `scripts/lib/snapshot-core.test.mjs`

This is plain Node — no Expo imports. All functions are pure (no IO) so they're testable.

- [ ] **Step 1: Write the failing tests (`scripts/lib/snapshot-core.test.mjs`)**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  collectSlots,
  classifyExt,
  parseManifestEntries,
  renderManifest,
} from './snapshot-core.mjs';

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

test('classifyExt whitelists and falls back', () => {
  assert.equal(classifyExt('file:///a/b/x.MP4', 'video'), 'mp4');
  assert.equal(classifyExt('file:///a/b/x.mov', 'video'), 'mov');
  assert.equal(classifyExt('file:///a/b/x.avi', 'video'), null);
  assert.equal(classifyExt('file:///a/b/x.jpeg', 'image'), 'jpeg');
  assert.equal(classifyExt('file:///a/b/x.heic', 'image'), 'heic');
  assert.equal(classifyExt('file:///a/b/x.bmp', 'image'), null);
});

test('renderManifest → parseManifestEntries round-trips', () => {
  const entries = {
    'profile-banner': { type: 'video', url: 'https://cdn.jsdelivr.net/gh/o/r@abc123/public/videos/curated/profile-banner.mp4' },
    'cover-ncaab': { type: 'image', requirePath: '../../assets/media/curated/cover-ncaab.jpg' },
  };
  const src = renderManifest(entries);
  assert.ok(src.includes("export const CURATED_MEDIA"));
  assert.ok(src.includes("'profile-banner': { type: 'video', uri: 'https://cdn.jsdelivr.net/gh/o/r@abc123/public/videos/curated/profile-banner.mp4' },"));
  assert.ok(src.includes("'cover-ncaab': { type: 'image', source: require('../../assets/media/curated/cover-ncaab.jpg') },"));
  assert.deepEqual(parseManifestEntries(src), entries);
});

test('parseManifestEntries returns {} for the empty initial manifest', () => {
  const empty = renderManifest({});
  assert.deepEqual(parseManifestEntries(empty), {});
});

test('merge semantics: new entries override, untouched survive (plain object spread)', () => {
  const existing = { a: { type: 'video', url: 'https://old' }, b: { type: 'image', requirePath: '../../assets/media/curated/b.jpg' } };
  const fresh = { a: { type: 'video', url: 'https://new' } };
  const merged = { ...existing, ...fresh };
  assert.equal(merged.a.url, 'https://new');
  assert.equal(merged.b.requirePath, '../../assets/media/curated/b.jpg');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `export PATH="$HOME/.nvm/versions/node/v24.11.1/bin:$PATH" && cd ~/Desktop/proslync-mobile-v1.1 && node --test scripts/lib/`
Expected: FAIL — `Cannot find module ... snapshot-core.mjs`.

- [ ] **Step 3: Implement `scripts/lib/snapshot-core.mjs`**

```js
// Pure logic for the curated-media snapshot pipeline. No IO here — the CLI
// (scripts/snapshot-media.mjs) handles the filesystem/git/network so this
// module stays unit-testable with `node --test`.

const IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'webp', 'heic']);
const VIDEO_EXTS = new Set(['mp4', 'mov']);

/**
 * storage: plain object of AsyncStorage key → string value (the CLI reads
 * this out of the simulator's RCTAsyncLocalStorage manifest + spill files).
 * Returns [{ slot, uri, type }] for every curated-able media value found.
 */
export function collectSlots(storage) {
  const slots = [];
  const json = (key) => {
    try {
      const raw = storage[key];
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  // Banners: v2 { uri, type } preferred, legacy v1 bare video URI fallback.
  for (const [slot, v2Key, v1Key] of [
    ['profile-banner', 'proslync:profile:banner:v2', 'proslync:profile:bannerVideo:v1'],
    ['coach-banner', 'proslync:coachprofile:banner:v2', 'proslync:coachprofile:bannerVideo:v1'],
  ]) {
    const v2 = json(v2Key);
    if (v2 && v2.uri) {
      slots.push({ slot, uri: v2.uri, type: v2.type === 'video' ? 'video' : 'image' });
    } else if (storage[v1Key]) {
      slots.push({ slot, uri: storage[v1Key], type: 'video' });
    }
  }

  const covers = json('proslync:home:coverMedia:v2') || {};
  for (const [id, m] of Object.entries(covers)) {
    if (m && m.uri) {
      slots.push({ slot: `cover-${id}`, uri: m.uri, type: m.type === 'video' ? 'video' : 'image' });
    }
  }

  const logos = json('proslync:home:customLogos:v1') || {};
  for (const [id, uri] of Object.entries(logos)) {
    if (uri) slots.push({ slot: `logo-${id}`, uri, type: 'image' });
  }

  const avatar = storage['proslync:profile:avatar:v1'];
  if (avatar) slots.push({ slot: 'profile-avatar', uri: avatar, type: 'image' });

  return slots;
}

/** Lower-cased extension if whitelisted for the media type, else null. */
export function classifyExt(uri, type) {
  const ext = (uri.split('?')[0].split('.').pop() || '').toLowerCase();
  const ok = type === 'video' ? VIDEO_EXTS : IMAGE_EXTS;
  return ok.has(ext) ? ext : null;
}

const ENTRY_RE = /^\s*'([^']+)': \{ type: '(image|video)', (?:uri: '([^']+)'|source: require\('([^']+)'\)) \},$/;

/**
 * Parses entries back out of a generated curated-manifest.ts. Only matches
 * the exact line format renderManifest emits — hand-edits are not supported
 * (the file header says "do not edit by hand").
 */
export function parseManifestEntries(src) {
  const entries = {};
  for (const line of src.split('\n')) {
    const m = ENTRY_RE.exec(line);
    if (!m) continue;
    const [, slot, type, url, requirePath] = m;
    entries[slot] = type === 'video' ? { type, url } : { type, requirePath };
  }
  return entries;
}

/** Renders the full curated-manifest.ts source from an entries map. */
export function renderManifest(entries) {
  const lines = Object.keys(entries)
    .sort()
    .map((slot) => {
      const e = entries[slot];
      return e.type === 'video'
        ? `  '${slot}': { type: 'video', uri: '${e.url}' },`
        : `  '${slot}': { type: 'image', source: require('${e.requirePath}') },`;
    });
  return `// AUTO-GENERATED by scripts/snapshot-media.mjs — do not edit by hand.
// Run \`npm run snapshot-media\` after curating media in the simulator.
import type { ImageSourcePropType } from 'react-native';

export type CuratedMediaEntry =
  | { type: 'image'; source: ImageSourcePropType } // bundled in the app binary
  | { type: 'video'; uri: string }; // hosted, SHA-pinned CDN URL

export const CURATED_MEDIA: Record<string, CuratedMediaEntry> = {
${lines.join('\n')}
};
`;
}
```

Note: `renderManifest({})` produces an empty object literal spanning two lines (`{\n\n}`) — that's valid TS and matches the round-trip test.

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test scripts/lib/`
Expected: all 6 tests pass.

- [ ] **Step 5: Verify the rendered manifest matches the committed initial one in spirit** — `renderManifest({})` and `lib/media/curated-manifest.ts` must declare identical types (they do — keep them in sync if you change either).

- [ ] **Step 6: Commit**

```bash
git add scripts/lib/snapshot-core.mjs scripts/lib/snapshot-core.test.mjs
git commit -m "feat(scripts): snapshot-core pure logic with node:test coverage"
```

---

### Task 7: Snapshot CLI — `npm run snapshot-media`

**Files:**
- Create: `scripts/snapshot-media.mjs`
- Modify: `package.json` (scripts block)

- [ ] **Step 1: Create `scripts/snapshot-media.mjs`**

```js
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

const staged = { images: [], videos: [] }; // { slot, src, destName }
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
    run('sips', ['-s', 'format', 'jpeg', f.src, '--out', dest]);
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
  run('git', ['-C', WEB_REPO, 'add', 'public/videos/curated']);
  const hasChanges = run('git', ['-C', WEB_REPO, 'diff', '--cached', '--name-only']) !== '';
  if (hasChanges) {
    run('git', ['-C', WEB_REPO, 'commit', '-m', `chore(media): curated mobile media snapshot ${new Date().toISOString().slice(0, 10)}`]);
    run('git', ['-C', WEB_REPO, 'push', 'origin', 'HEAD']);
    console.log('• web repo committed + pushed');
  } else {
    console.log('• video files unchanged — reusing current web HEAD');
  }
  webSha = run('git', ['-C', WEB_REPO, 'rev-parse', 'HEAD']);
  const originUrl = run('git', ['-C', WEB_REPO, 'remote', 'get-url', 'origin']);
  const m = /github\.com[:/]([^/]+)\/([^/.]+)/.exec(originUrl);
  if (!m) fail(`Can't parse GitHub owner/repo from origin URL: ${originUrl}`);
  webRemote = `${m[1]}/${m[2]}`;

  // If HEAD has no new commit but a video slot is new to the manifest, make
  // sure the file is actually reachable at this SHA (it is, if previously
  // committed); CDN verification below is the real gate.
}

// ── 5. Verify CDN serves every video (range request → 206) ───────────────
async function verifyCdn(url) {
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { headers: { Range: 'bytes=0-99' } });
      if (res.status === 206 || res.status === 200) return true;
    } catch {}
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
```

- [ ] **Step 2: Add the npm script**

In `package.json` `"scripts"`, after `"reset-project"`:

```json
    "snapshot-media": "node ./scripts/snapshot-media.mjs",
```

- [ ] **Step 3: Test the failure paths**

Run: `npm run snapshot-media -- --dry-run` with the app installed but **no media set**.
Expected: `✖ No user-set media found in the simulator...` and exit code 1.

Run: `xcrun simctl shutdown booted` (if safe) or rename check — simpler: temporarily pass a bogus bundle by editing nothing; instead verify the booted-sim error path by reading the code. Minimum: the no-media path above must work.

- [ ] **Step 4: node:test still green + typecheck**

Run: `node --test scripts/lib/` → all pass. `npx tsc --noEmit` → no new errors (script is .mjs, untouched by tsc — this guards the manifest).

- [ ] **Step 5: Commit**

```bash
git add scripts/snapshot-media.mjs package.json
git commit -m "feat(scripts): snapshot-media CLI — sim container → bundled images + CDN-hosted videos + manifest"
```

---

### Task 8: End-to-end verification (the actual acceptance test)

No new files — this proves the whole pipeline. Requires Metro/sim running.

- [ ] **Step 1: Curate in the sim.** Set at least: one profile banner **video**, one profile banner re-pick as **image** then back to video (exercises both types), one home cover (image), one home logo, one avatar photo. Verify all render.

- [ ] **Step 2: Dry-run, then real snapshot.**

```bash
export PATH="$HOME/.nvm/versions/node/v24.11.1/bin:$PATH"
cd ~/Desktop/proslync-mobile-v1.1
npm run snapshot-media -- --dry-run   # lists every slot you set
npm run snapshot-media                # stages, pushes web repo, verifies CDN, writes manifest
```

Expected: each staged file logged with ✓; every video URL logs `206 ✓`; manifest written.

- [ ] **Step 3: Spot-check outputs.**

```bash
git status --short                                  # assets/media/curated/* + lib/media/curated-manifest.ts
cat lib/media/curated-manifest.ts                   # entries present, URLs SHA-pinned
curl -s -o /dev/null -w "%{http_code}\n" -r 0-100 "<each video URL from the manifest>"   # 206
npx tsc --noEmit                                     # manifest compiles
```

- [ ] **Step 4: Commit the curation.**

```bash
git add assets/media/curated lib/media/curated-manifest.ts
git commit -m "chore(media): curated media snapshot"
```

- [ ] **Step 5: THE TestFlight simulation.**

```bash
xcrun simctl uninstall booted com.proslync.app   # wipes Documents + AsyncStorage, like a fresh install
npm run ios                                       # rebuild + reinstall
```

Expected: with ZERO local state, profile banner, home cover, logo, and avatar all show your curation (banner video streams from jsdelivr). This is exactly what a TestFlight device will see.

- [ ] **Step 6: Merge safety.** Re-pick ONE slot in the sim (e.g. new home cover), re-run `npm run snapshot-media`, then `git diff --stat` — only that slot's asset + one manifest line change; all other entries intact.

- [ ] **Step 7: Orphan healing.** `xcrun simctl get_app_container booted com.proslync.app data`, delete one file under `Documents/proslync-media/`, relaunch the app → that surface shows the curated default (not a black box), and after relaunch the stale key is gone.

- [ ] **Step 8: Final commit + wrap-up.**

```bash
git status   # should be clean (or only the Step 6 re-snapshot)
```

If `npx gitnexus analyze` is available, run it to refresh the index. Then use superpowers:finishing-a-development-branch.

---

## Self-review notes

- **Spec coverage:** slots table → Tasks 2–5; manifest → Tasks 1, 6, 7; resolver → Task 1 (consumed in 2–5); snapshot script incl. md5 spill files, UUID re-anchoring, 20MB guard, heic→jpg, CDN 206 verify, merge semantics, dry-run → Tasks 6–7; error handling (orphan healing) → Tasks 2–5 + 8.7; testing → node:test (Task 6), tsc gates everywhere, acceptance in Task 8. Out-of-scope items (per-user sync, publish button) correctly absent.
- **Type consistency:** `LocalMedia`/`LocalMediaType` (local-media.ts), `CuratedMediaEntry`/`CURATED_MEDIA` (curated-manifest.ts), `ResolvedMedia`/`resolveSlotMedia`/`resolveAvatarSource` (resolve-media.ts), core fns `collectSlots`/`classifyExt`/`parseManifestEntries`/`renderManifest` — names match across all tasks.
- **Known judgment calls:** `CoverMedia = LocalMedia` alias keeps index.tsx diff small; viewer opens unconditionally now (avatar always resolves to something); `runtime video failure → image fallback` from spec §5 is best-effort via orphan healing + curated fallback — expo-video gives no simple error callback on `VideoView`, so a broken *remote* URL (CDN down) shows the poster-less player; accepted because SHA-pinned jsdelivr is the reliability mechanism.
