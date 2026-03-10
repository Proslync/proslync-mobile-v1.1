# Status App — Frontend

## Documentation

`docs/` is symlinked to the Obsidian vault. Search docs before guessing:
```
Grep pattern="<search term>" path="docs/" glob="*.md"
```

### AI Skills — Read Before Coding

| Task | Read This First |
|------|----------------|
| Frontend code (screens, components, hooks) | `docs/AI Skills/Frontend Feature.md` |
| Fixing bugs | `docs/AI Skills/Debugging.md` |
| Reviewing code | `docs/AI Skills/Code Review.md` |

After reading the skill, follow its **Consult** section, then its **Checklist**.

---

# Project Rules

## Design Language
- UI palette: **liquid glass, white, and black only**
- No purple or other accent colors in the UI
- White is the secondary color
- Glass effects use blur, translucent white fills, and white borders
- **All buttons use the follow button style** — translucent glass (GlassButton `glass` variant): ~15% white fill, ~25% white border, white text, blur backdrop. No solid/opaque buttons (no `accent`, `danger`, or `frosted` variants).
- **All pages use a dark gradient background** — `<DarkGradientBg />` from `@/components/shared/dark-gradient-bg` as the first child in every page container. Subtle white glow at top fading to black. Base container stays `backgroundColor: '#000'`.
- Do NOT publish to TestFlight unless explicitly asked

## Tech Stack
- **React Native 0.81** with **Expo SDK 54** (expo-router for navigation)
- **TypeScript** throughout
- **React Query** (`@tanstack/react-query`) for server state
- **Zod** for validation, **react-hook-form** for forms
- **expo-video** (`useVideoPlayer`, `VideoView`) for video playback
- **react-native-pager-view** for swipeable tab navigation (NOT React Navigation tabs)
- **Stripe** (`@stripe/stripe-react-native`) for payments
- **Socket.IO** for real-time features (analytics, event updates, chat)

## Project Structure
- `app/` — Expo Router file-based routes (tabs, dashboard, manage-event, etc.)
- `app/(tabs)/` — Main tab screens using PagerView with `offscreenPageLimit={2}` (all tabs stay mounted)
- `components/` — Organized by domain: `feed/`, `glass/`, `analytics/`, `wallet/`, `tables/`, `shared/`, `ui/`, etc.
- `hooks/` — React Query hooks + custom hooks, all exported from `hooks/index.ts`
- `lib/api/` — API layer: typed methods organized by domain (events, feed, payments, analytics, etc.)
- `lib/api/client.ts` — `ApiClient` class with auth token management, refresh, timeout
- `lib/providers/` — Context providers (auth, chat, stripe, tab-navigation, wallet, theme, etc.)
- `lib/types/` — Shared TypeScript types

## Patterns

### API Layer (`lib/api/`)
- Each domain has its own file exporting an object with async methods
- Methods use `apiClient.get<T>()` / `apiClient.post<T>()` with typed responses
- Types/interfaces defined at the top of each API file
- Example: `analyticsApi.getRevenueTimeSeries(range)` in `lib/api/analytics.ts`

### React Query Hooks (`hooks/`)
- One hook file per feature: `use-{feature}.ts`
- Export a named query key constant: `export const FEATURE_KEY = 'feature-key'`
- Export the hook function: `export function useFeature(...)`
- `queryKey` includes all parameters: `[KEY, param1, param2]`
- Typical staleTime: 2min, gcTime: 10min for analytics; 5min stale for lists
- All hooks re-exported from `hooks/index.ts` grouped by domain with comments
- Mutations use `useMutation` with `onSuccess` invalidation

### Providers (`lib/providers/`)
- React Context + `useCallback`/`useMemo` pattern
- Custom hook for consumption: `useFeature()` with error if used outside provider
- Providers composed in `app/_layout.tsx`

### Tab Navigation
- PagerView-based (not React Navigation tabs) — `useIsFocused` does NOT work for tab visibility
- Use `useTabNavigation().currentTab` from `tab-navigation-provider` to check active tab
- `syncTabIndex` keeps provider in sync with PagerView's `onPageSelected`
- Tab order: `['search', 'explore', 'index', 'activity', 'profile']`

### Video/Media
- `FeedMediaPlayer` handles video + image with dynamic aspect ratio detection
- Videos auto-play/pause based on `isActive` prop (scroll position + tab visibility)
- AppState listener pauses video when app backgrounds
- Cleanup effects ensure players pause on unmount

### Theming
- `useAppTheme()` returns `{ colors, isDark }` — always use theme colors, never hardcode
- `GlassSurface` component for glass card effects
- `GlassButton` with `glass` variant only
