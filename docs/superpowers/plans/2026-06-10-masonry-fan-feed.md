# Masonry Fan Feed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the fan home feed into a Pinterest-style 2-column masonry grid of seeded abstract-art cards bound to real posts (tap → detail sheet with the existing FanPostCard).

**Architecture:** FlashList v2 `masonry` replaces the FlatList in `components/fan/fan-home-feed.tsx`; new pure seed helpers in `lib/fan/seeded.ts` (node-testable); new `AbstractArt` (4 svg/gradient recipes) and `MasonryPostCard` components; existing hook/composer/FAB untouched.

**Tech stack:** @shopify/flash-list ^2.0.2 (masonry prop, NO estimatedItemSize), react-native-svg (NEW dep — `npx expo install react-native-svg`), expo-linear-gradient, reanimated FadeInDown.

**Spec:** `docs/superpowers/specs/2026-06-10-masonry-fan-feed-design.md`. Baseline `npx tsc --noEmit` ≈148 errors (pre-existing); gate = no NEW errors. Env: `export PATH="$HOME/.nvm/versions/node/v24.11.1/bin:$PATH"`. Repo: /Users/arshiarahnavard/Desktop/proslync-mobile-v1.1, branch arshia.

**Spec correction:** caption text field is `post.body` (string | null) — `FanPost` has no `.text`.

---

### Task 1: Seed helpers (`lib/fan/seeded.ts`) — TDD with node:test

**Files:** Create `lib/fan/seeded.mjs` (plain ESM JS — node:test can import it directly, Metro bundles .mjs fine), `lib/fan/seeded.d.ts` (type declarations so TS consumers get types), `lib/fan/seeded.test.mjs`. The app imports `@/lib/fan/seeded`.

- [ ] **Step 1: failing tests** — create `lib/fan/seeded.test.mjs`:

```js
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
  assert.deepEqual([...seen].sort(), [0, 1, 2, 3]);
});
```

- [ ] **Step 2:** run `node --test lib/fan/seeded.test.mjs` → module-not-found FAIL.

- [ ] **Step 3:** create `lib/fan/seeded.mjs`:

```js
// Seeded determinism for the masonry fan feed: every post id maps to the same
// abstract art + card aspect forever. Pure JS (.mjs) so node:test can run it
// without a TS toolchain; Metro bundles .mjs fine.

/** 32-bit string hash (Java-style). */
export function hashCode(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}

/** Tiny seeded PRNG → () => float in [0,1). */
export function mulberry32(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Card aspect (width/height) for a post id, uniform in [0.62, 1.45]. */
export function seededAspect(id) {
  const rand = mulberry32(hashCode(`aspect:${id}`));
  return 0.62 + rand() * (1.45 - 0.62);
}

/** Stable integer pick in [0, n) for a post id (recipe selection etc.). */
export function seededPick(id, n) {
  const rand = mulberry32(hashCode(`pick:${id}`));
  return Math.floor(rand() * n);
}
```

and `lib/fan/seeded.d.ts`:

```ts
export function hashCode(s: string): number;
export function mulberry32(seed: number): () => number;
export function seededAspect(id: string): number;
export function seededPick(id: string, n: number): number;
```

- [ ] **Step 4:** `node --test lib/fan/seeded.test.mjs` → 4 pass. `npx tsc --noEmit` → baseline.
- [ ] **Step 5:** commit: `git add lib/fan && git commit -m "feat(fan): seeded determinism helpers for masonry feed (TDD)"` (+ Co-Authored-By trailer).

---

### Task 2: Install react-native-svg + `components/fan/abstract-art.tsx`

- [ ] **Step 1:** `npx expo install react-native-svg` — report the version it picks. package.json + lockfile change only (native rebuild happens later, Task 5).
- [ ] **Step 2:** create `components/fan/abstract-art.tsx` — pure memoized component, props `{ seed: string; width: number; height: number }`, palette `['#FF6F3C', '#EB621A', '#FFFFFF', '#2A2A2A']`, background `#1A1A1A`. Recipe = `seededPick(seed, 4)`; one fresh `mulberry32(hashCode('art:' + seed))` PRNG drives all randomness. Implement the four recipes per the spec §3:
  1. arcBurst — Svg `<Path>` arc segments (10–16), stroke-only 1.5px, alternating palette strokes w/ 0.25–0.9 seeded opacity; helper `arcPath(cx, cy, r, startAngle, sweep)` building `M ... A ...` strings.
  2. bauhausGrid — 3 cols × 4 rows; per cell seeded choice of Circle / quarter-arc Path / Polygon triangle / Rect bar / empty (weights favoring empty+dark so it stays sparse).
  3. organicBlob — closed smooth path from 6 points on a circle (radius jittered ±35% by seed), cubic beziers between midpoints; fill `#FF6F3C` opacity 0.55–0.8; optional second white blob at 0.08 opacity (seeded flag).
  4. radialMesh — NO svg: 3 absolutely-positioned LinearGradient circles (borderRadius 9999) at ~0.8/0.5/0.25 × width, colors `[palette pick + '00' fade]`, seeded centers.
  Render: `<View style={{width, height, backgroundColor:'#1A1A1A'}}>` containing the chosen recipe (recipes 1–3 inside one `<Svg width height>`). Export nothing else.
- [ ] **Step 3:** `npx tsc --noEmit` → baseline (svg types come with the package).
- [ ] **Step 4:** commit both (package.json, lockfile, abstract-art.tsx).

---

### Task 3: `components/fan/masonry-post-card.tsx`

- [ ] Create:

```tsx
import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AbstractArt } from '@/components/fan/abstract-art';
import { seededAspect } from '@/lib/fan/seeded';
import type { FanPost } from '@/lib/types/fan.types';

const TEXT_SECONDARY = 'rgba(255,255,255,0.55)';

type Props = {
  post: FanPost;
  colWidth: number;
  index: number;
  onPress: (post: FanPost) => void;
};

export const MasonryPostCard = React.memo(function MasonryPostCard({
  post, colWidth, index, onPress,
}: Props): React.JSX.Element {
  const artHeight = Math.round(colWidth / seededAspect(post.id));
  const caption = post.body?.trim() || `@${post.author?.handle ?? 'unknown'}`;
  const card = (
    <Pressable style={styles.card} onPress={() => onPress(post)}>
      <AbstractArt seed={post.id} width={colWidth} height={artHeight} />
      <View style={styles.metaRow}>
        <Text style={styles.caption} numberOfLines={1}>{caption}</Text>
        <Ionicons name="ellipsis-horizontal" size={16} color={TEXT_SECONDARY} />
      </View>
    </Pressable>
  );
  // Entrance stagger on the first screenful only.
  if (index < 12) {
    return (
      <Animated.View entering={FadeInDown.delay(Math.min(index, 10) * 60).duration(250)}>
        {card}
      </Animated.View>
    );
  }
  return card;
});

const styles = StyleSheet.create({
  card: { borderRadius: 16, overflow: 'hidden', backgroundColor: '#1A1A1A' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingVertical: 8 },
  caption: { flex: 1, color: TEXT_SECONDARY, fontSize: 13 },
});
```

- [ ] tsc baseline; commit.

---

### Task 4: Rewire `fan-home-feed.tsx` to FlashList masonry + detail sheet

**Modify `components/fan/fan-home-feed.tsx`** (read it fully first; current: FlatList of FanPostCard, RefreshControl, FAB at bottom:110, FanPostComposer; keep ALL existing handlers/hook usage/empty/footer/FAB/composer code).

- [ ] **Step 1: imports/layout consts.** Add `Dimensions`, `Modal` to the react-native import; add `import { FlashList } from '@shopify/flash-list';`, `import { MasonryPostCard } from '@/components/fan/masonry-post-card';`. Module consts:

```ts
const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_MARGIN = 12;
const GRID_GUTTER = 8;
// With contentContainer paddingHorizontal = MARGIN − GUTTER/2 and per-item
// wrapper paddingHorizontal = GUTTER/2, each card's true width is:
const CARD_WIDTH = (SCREEN_WIDTH - GRID_MARGIN * 2 - GRID_GUTTER) / 2;
```

- [ ] **Step 2: state + handler.** `const [detailPost, setDetailPost] = React.useState<FanPost | null>(null);` and `const openDetail = React.useCallback((p: FanPost) => setDetailPost(p), []);`. Keep `detailPost` fresh against the live list so likes update in the sheet: `const livePost = detailPost ? posts.find((p) => p.id === detailPost.id) ?? detailPost : null;`

- [ ] **Step 3: replace the `<FlatList …/>` element** with:

```tsx
      <FlashList
        data={posts}
        masonry
        numColumns={2}
        optimizeItemArrangement
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <View style={{ paddingLeft: index % 2 === 0 ? 0 : GRID_GUTTER / 2, paddingRight: index % 2 === 0 ? GRID_GUTTER / 2 : 0, paddingBottom: GRID_GUTTER }}>
            <MasonryPostCard post={item} colWidth={CARD_WIDTH} index={index} onPress={openDetail} />
          </View>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#EB621A" />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: 120,
          paddingHorizontal: GRID_MARGIN,
        }}
        ListEmptyComponent={ /* keep the existing empty JSX exactly */ }
        ListFooterComponent={ /* keep the existing footer JSX exactly */ }
      />
```

NOTE: in masonry mode `index % 2` approximates the column when optimizeItemArrangement reorders — if the gutter looks wrong in the sim, switch to symmetric `paddingHorizontal: GRID_GUTTER / 2` on every wrapper and reduce contentContainer padding to `GRID_MARGIN - GRID_GUTTER / 2`. Implement the SYMMETRIC variant from the start (it is order-independent and simpler):

```tsx
        renderItem={({ item, index }) => (
          <View style={{ paddingHorizontal: GRID_GUTTER / 2, paddingBottom: GRID_GUTTER }}>
            <MasonryPostCard post={item} colWidth={CARD_WIDTH} index={index} onPress={openDetail} />
          </View>
        )}
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: 120,
          paddingHorizontal: GRID_MARGIN - GRID_GUTTER / 2,
        }}
```

Do NOT pass estimatedItemSize (removed in v2). Do NOT use MasonryFlashList (deprecated).

- [ ] **Step 4: detail sheet** — after the composer JSX, add:

```tsx
      <Modal
        visible={livePost != null}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailPost(null)}
      >
        <Pressable style={styles.sheetScrim} onPress={() => setDetailPost(null)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          {livePost ? (
            <FanPostCard
              post={livePost}
              onLike={like}
              onUnlike={unlike}
              onReply={(p) => { setDetailPost(null); handleReply(p); }}
            />
          ) : null}
        </View>
      </Modal>
```

with styles:

```ts
  sheetScrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: '#0F0F0F',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    paddingBottom: 34,
    maxHeight: '80%',
  },
  sheetHandle: {
    alignSelf: 'center', width: 36, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)', marginBottom: 8,
  },
```

(`FanPostCard` import already exists in this file. The FlatList import becomes unused — remove `FlatList` from the react-native import.)

- [ ] **Step 5:** `npx tsc --noEmit` → baseline; `grep -n "FlatList" components/fan/fan-home-feed.tsx` → zero.
- [ ] **Step 6:** commit.

---

### Task 5: Verification + builds

- [ ] `node --test lib/fan/seeded.test.mjs` (4) + `node --test scripts/lib/snapshot-core.test.mjs` (17) all pass; tsc baseline.
- [ ] Bundle gate: `npx expo export --platform ios --output-dir /tmp/masonry-bundle-check` → .hbc produced (proves svg JS wiring).
- [ ] **Native rebuild required** (react-native-svg): sim — `npx expo run:ios` (background, long); then in sim switch to the fan experience and screenshot the feed: 2-column staggered abstract cards. Re-screenshot after relaunch → identical art per post (determinism).
- [ ] Phone dev build: `xcodebuild -workspace ios/Proslync.xcworkspace -scheme Proslync -configuration Release -destination 'id=00008140-001579E83A53001C' -allowProvisioningUpdates build` + `devicectl install/launch` → **Arshia verifies on phone** (gate for TestFlight).
- [ ] After Arshia's approval: EAS `build --platform ios --profile production --auto-submit` → **build 20** (healing fix rides along — already committed at 78f1b6c).
