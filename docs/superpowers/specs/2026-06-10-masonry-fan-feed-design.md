# Masonry Fan Feed — Design

**Date:** 2026-06-10
**Status:** Approved by Arshia (Approach A — masonry layer over existing feed plumbing)
**Reference:** Pinterest iOS dark-mode home feed (user-provided screenshot): 2-column staggered grid, rounded cards of varying heights, near-zero chrome, floating nav.

## Goal

`app/(fan-tabs)/index.tsx` → `components/fan/fan-home-feed.tsx` becomes a Pinterest-style masonry feed where every card's visual is **procedurally generated abstract art** (no photos), deterministic per post, in the app's black/white/orange (`#FF6F3C`/`#EB621A`) language. Posts stay real: pagination, refresh, like, reply, and the composer keep working.

## What does NOT change

- `hooks/fan/use-fan-home-feed.ts` (posts, loading, refreshing, hasMore, loadMore, refresh, like, unlike, prepend) — untouched.
- `components/fan/fan-post-card.tsx` — untouched; reused inside the detail sheet.
- `components/fan/post-composer.tsx` + FAB behavior — untouched (FAB stays overlaid on the grid).
- Fan-tabs navigation — untouched.

## Architecture

```
fan-home-feed.tsx (rewired)
  └─ FlashList v2  (masonry, numColumns=2, optimizeItemArrangement)
       └─ MasonryPostCard (components/fan/masonry-post-card.tsx)  [new]
            ├─ AbstractArt (components/fan/abstract-art.tsx)      [new]
            └─ caption line + ··· glyph
  └─ Post detail sheet (Modal) → existing FanPostCard
  └─ existing FAB → FanPostComposer
```

## 1. Grid (FlashList v2)

- `<FlashList data={posts} masonry numColumns={2} optimizeItemArrangement keyExtractor={id}>` — v2 measures item heights automatically; do NOT pass `estimatedItemSize` (removed in v2). `MasonryFlashList` is deprecated — use the `masonry` prop.
- Geometry: outer horizontal margin 12dp; inter-column gutter 8; vertical gap 8; column width `(screenWidth − 24 − 8) / 2`. Gutter via per-card horizontal padding (left column pads right 4, right column pads left 4, `index % 2`) + `ItemSeparatorComponent` height 8.
- Infinite scroll: `onEndReached={loadMore}`, `onEndReachedThreshold={0.5}`. Pull-to-refresh: `RefreshControl` with `tintColor '#EB621A'` (the accent already used in this file).
- Content insets: top `insets.top + 8`; bottom enough to clear the tab bar + FAB (match the current list's bottom padding).
- Footer: existing loading spinner pattern when `hasMore && loading`.

## 2. MasonryPostCard

- Container: `borderRadius 16`, `overflow 'hidden'`, background `#1A1A1A`, no border/shadow.
- Art block: `AbstractArt seed={post.id} width={colWidth} height={artHeight}`. `artHeight = colWidth / aspect` where `aspect` is seeded from post.id, uniform in [0.62, 1.45] (mix of tall and squat, like the reference) — computed by the same seeded PRNG used inside AbstractArt so card heights are deterministic too.
- Below the art, inside the card with 8dp padding: one row — caption (`post.text` or author handle if empty), `fontSize 13`, color `rgba(255,255,255,0.55)`, `numberOfLines={1}`, flex 1 — and a `···` (ellipsis-horizontal Ionicon, 16dp, same secondary color) as a Pressable that ALSO opens the detail sheet (no separate menu in v1).
- Whole card is a Pressable → `onPress(post)` opens the detail sheet. No like/reply chrome on the card itself (Pinterest-minimal).
- Entrance: `Animated.View entering={FadeInDown.delay(min(index,10) * 60).duration(250)}` — applied only while `index < 12` AND on first page (skip for paginated appends: gate on a `hasAnimatedRef` that flips after first layout, or simply only animate when `index < 12`; pick the simpler index gate).

## 3. AbstractArt (the generator)

- Deterministic: `mulberry32(hashCode(seed))` PRNG (both as tiny local pure functions in the file, exported for tests).
- Four recipes, chosen by `floor(rand()*4)`; each draws within `width × height`, dark-premium on `#1A1A1A`:
  1. **Arc burst** (react-native-svg): 10–16 concentric arc segments (`Path`, stroke-only ~1.5px, radii up to ~90% of min dimension), strokes alternate seeded picks from `#FF6F3C` / `#FFFFFF` (low opacity) / `#EB621A`; whole burst center-offset by seed.
  2. **Bauhaus grid** (svg): 3×4 cells; per cell (seeded): filled circle / quarter-arc / diagonal triangle / bar / empty; fills from the palette with weighted bias to dark cells so compositions stay sparse.
  3. **Organic blob** (svg): one closed smooth path from 6 radially-displaced control points (cubic beziers), filled `#FF6F3C` at 0.55–0.8 seeded opacity, optional second smaller white blob at 0.08 opacity.
  4. **Radial mesh** (no svg): 3 absolutely-positioned circles (View, borderRadius 9999) at ~80/50/25% of width wrapped in `LinearGradient`s fading to transparent, seeded offsets — glowing-orb composition.
- Palette constant: `['#FF6F3C', '#EB621A', '#FFFFFF', '#2A2A2A']` with opacity variation; never any other hue.
- Static render only — no reanimated loops inside cards.
- Pure component, memoized (`React.memo`), props `{ seed: string; width: number; height: number }`.

## 4. Detail sheet

- RN `Modal` (`animationType 'slide'`, transparent) with a dark scrim and a bottom-anchored container (rounded top corners 24, bg `#0F0F0F`, max height ~80%): renders the existing `FanPostCard` for the tapped post with its real like/unlike/reply handlers (same props the old FlatList passed), plus a drag-handle bar and tap-scrim-to-close.
- Reply from the sheet routes through the existing `handleReply` → composer flow (sheet closes first).

## 5. Dependencies & constraints

- NEW: `react-native-svg` via `npx expo install react-native-svg` (Expo SDK 54-compatible version; requires a native rebuild of the dev/device app afterward).
- `expo-linear-gradient`, `reanimated`, `@shopify/flash-list@^2.0.2` — already installed.
- FlashList v2 requires the new architecture — already on (SDK 54).

## 6. Verification

1. `npx tsc --noEmit` — stays at the ~148 pre-existing baseline, zero errors in touched/new files.
2. `node --test` for the PRNG/hash + aspect derivation (pure functions exported from abstract-art.tsx are RN-coupled — instead extract `lib/fan/seeded.ts` with `hashCode`, `mulberry32`, `seededAspect` and unit-test THAT; AbstractArt imports it).
3. In sim: feed renders 2-column staggered grid; same post always shows identical art (kill+relaunch); scroll is smooth with 50+ items; pull-to-refresh and pagination work; tap → sheet with working like/reply; composer posts prepend.
4. Bundle gate: `npx expo export --platform ios` clean (catches svg native dep wiring at JS level).

## Out of scope (v1)

- List/grid toggle, real images per post, long-press context menu, share, the floating 3-button pill nav from the reference (fan-tabs already has its own nav), animations beyond the entrance stagger.
