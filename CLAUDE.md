# Proslync mobile (v1.1, CANONICAL — branch `arshia`)

> **NEW SESSION? READ FIRST:** `~/proslync-backend-staging/NEXT-STEPS.md` (cross-repo coord) and `~/.claude/projects/-Users-arshiarahnavard-proslync-mobile-app-v1/memory/MEMORY.md` (durable memory).
>
> **This is the canonical mobile location** (decided 2026-05-18). Cloned locally from `~/proslync-mobile-app-v1` (the old v1) preserving its full git history including the Phase 1 A/B/C fusion commits (`360c5a0`, `9eea84f`, `c030608`). VPS wired in `.env.local`. The OLD v1 path is **archived/reference** — don't build there. The old "donor app" framing below is stale: Phase 1 already deleted 191 donor files and bulk-copied 124 ios-final assets.
>
> Use nvm node v24 (`export PATH=$HOME/.nvm/versions/node/v24.11.1/bin:$PATH`) — homebrew node 25.8.1 is broken.

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

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **status** (6234 symbols, 15307 relationships, 169 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## When Debugging

1. `gitnexus_query({query: "<error or symptom>"})` — find execution flows related to the issue
2. `gitnexus_context({name: "<suspect function>"})` — see all callers, callees, and process participation
3. `READ gitnexus://repo/status/process/{processName}` — trace the full execution flow step by step
4. For regressions: `gitnexus_detect_changes({scope: "compare", base_ref: "main"})` — see what your branch changed

## When Refactoring

- **Renaming**: MUST use `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` first. Review the preview — graph edits are safe, text_search edits need manual review. Then run with `dry_run: false`.
- **Extracting/Splitting**: MUST run `gitnexus_context({name: "target"})` to see all incoming/outgoing refs, then `gitnexus_impact({target: "target", direction: "upstream"})` to find all external callers before moving code.
- After any refactor: run `gitnexus_detect_changes({scope: "all"})` to verify only expected files changed.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Tools Quick Reference

| Tool | When to use | Command |
|------|-------------|---------|
| `query` | Find code by concept | `gitnexus_query({query: "auth validation"})` |
| `context` | 360-degree view of one symbol | `gitnexus_context({name: "validateUser"})` |
| `impact` | Blast radius before editing | `gitnexus_impact({target: "X", direction: "upstream"})` |
| `detect_changes` | Pre-commit scope check | `gitnexus_detect_changes({scope: "staged"})` |
| `rename` | Safe multi-file rename | `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` |
| `cypher` | Custom graph queries | `gitnexus_cypher({query: "MATCH ..."})` |

## Impact Risk Levels

| Depth | Meaning | Action |
|-------|---------|--------|
| d=1 | WILL BREAK — direct callers/importers | MUST update these |
| d=2 | LIKELY AFFECTED — indirect deps | Should test |
| d=3 | MAY NEED TESTING — transitive | Test if critical path |

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/status/context` | Codebase overview, check index freshness |
| `gitnexus://repo/status/clusters` | All functional areas |
| `gitnexus://repo/status/processes` | All execution flows |
| `gitnexus://repo/status/process/{name}` | Step-by-step execution trace |

## Self-Check Before Finishing

Before completing any code modification task, verify:
1. `gitnexus_impact` was run for all modified symbols
2. No HIGH/CRITICAL risk warnings were ignored
3. `gitnexus_detect_changes()` confirms changes match expected scope
4. All d=1 (WILL BREAK) dependents were updated

## Keeping the Index Fresh

After committing code changes, the GitNexus index becomes stale. Re-run analyze to update it:

```bash
npx gitnexus analyze
```

If the index previously included embeddings, preserve them by adding `--embeddings`:

```bash
npx gitnexus analyze --embeddings
```

To check whether embeddings exist, inspect `.gitnexus/meta.json` — the `stats.embeddings` field shows the count (0 means no embeddings). **Running analyze without `--embeddings` will delete any previously generated embeddings.**

> Claude Code users: A PostToolUse hook handles this automatically after `git commit` and `git merge`.

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
