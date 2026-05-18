# Phase 2 — Athlete Role Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land Phase 2 of the v1 ← iOS-final fusion for the **athlete** role. Brings in: (a) cross-role shared infrastructure (personas, dev-login, actor-context, role-tabs, deal/[id], dev tools) that ALL subsequent roles will reuse, and (b) athlete-specific API surface + 10 screens, wired to live VPS where routes exist and `[mock]`-labelled fallback fixtures where they don't.

**Architecture:** Three tiers landing in order. Tier 0 = cross-role shared infra (single commit). Tier 1 = athlete API files + hooks (single commit). Tier 2 = athlete screens, copied verbatim from ios-final and integrated with role-tabs (single commit per logical group). Athlete role-view in the existing tab dispatcher remains untouched until Tier 3 wires it to the new screens.

**Tech Stack:** React Native 0.81 + Expo SDK 54 + TypeScript + expo-router + React Query + Socket.IO (deferred — websocket disabled in config). VPS at `http://209.142.66.121:3055` in `fallback` mode. Auth via dev-login (`POST /api/dev/login`) — OTP flow not used in this plan.

**Spec:** `docs/superpowers/specs/2026-05-18-v1-ios-final-fusion-design.md` (§ Phase 2 → Athlete)
**Phase 1 status:** Landed at commits `360c5a0` (residue) → `9eea84f` (assets) → `c030608` (API foundation + /_dev/health). Sim verified.

**Repo paths:**
- `V1 = /Users/arshiarahnavard/proslync-mobile-app-v1`
- `IF = /Users/arshiarahnavard/proslync-app-ios-final`

---

## File Structure

### Tier 0 — Cross-role shared infrastructure

**Creates:**
- `lib/storage/secure-tokens.ts` — copied from `IF/lib/storage/secure-tokens.ts`. Token persistence via SecureStore. Needed by actor-context.
- `lib/storage/mmkv.ts` — copied verbatim. Used by impersonation-provider for in-memory persona swap.
- `lib/providers/actor-context-provider.tsx` — copied from `IF`. Holds active actor (user + role) and persona switcher state.
- `lib/providers/impersonation-provider.tsx` — copied from `IF`. Allows dev-login impersonation swap.
- `app/_dev/_layout.tsx` — already exists from Phase 1 (created for /_dev/health). Tier 0 extends it to register cache/entities/flags/personas/sockets routes.
- `app/_dev/index.tsx` — landing screen with links to each dev tool.
- `app/_dev/personas.tsx` — copied from `IF`. Calls `GET /api/dev/users`, lets user pick a persona, fires `POST /api/dev/login`, stores returned token via secureTokens, updates actor-context.
- `app/_dev/cache.tsx`, `app/_dev/entities.tsx`, `app/_dev/flags.tsx`, `app/_dev/sockets.tsx` — copied verbatim. Pure dev tools, no athlete-specific deps.
- `app/(tabs)/ad.tsx`, `app/(tabs)/athlete.tsx`, `app/(tabs)/brand.tsx`, `app/(tabs)/deals.tsx`, `app/(tabs)/nil.tsx`, `app/(tabs)/role.tsx` — role-tab screens copied from `IF/app/(tabs)/`. Each is a thin shell that renders the role-view component (e.g. `athlete.tsx` renders `<AthleteView>`).
- `app/deal/[id].tsx` — copied verbatim. Role-aware deal detail screen used by athlete, brand, school, NIL manager.

**Modifies:**
- `app/_layout.tsx` — wraps `<ActorContextProvider>` and `<ImpersonationProvider>` around the existing provider stack (between `AuthProvider` and `RoleProvider`). Adds `<Stack.Screen name="deal/[id]" />`. The `<Stack.Screen name="_dev" />` already exists from Phase 1.
- `app/_dev/_layout.tsx` — adds Stack.Screen entries for the new _dev routes.
- `app/(tabs)/_layout.tsx` — if ios-final's `(tabs)/_layout.tsx` differs structurally from v1's (it has 5+ tabs vs v1's 3), keep v1's 3-tab structure but verify that copied role-tab files don't break the NativeTabs registration. The new role-tab files are stack-routed, not tab-routed (no `NativeTabs.Trigger` entry needed).

### Tier 1 — Athlete API + hooks

**Creates:**
- `lib/api/athlete-payouts.ts` (re-export shim, 8 lines)
- `lib/api/disclosures.ts` (re-export shim, 8 lines)
- `lib/api/permission-grants.ts` (89 lines)
- `lib/api/nil-comps.ts` (re-export shim, 8 lines)
- `lib/api/open-deals.ts` (136 lines)
- `lib/api/_internal/athlete-payouts-impl.ts`
- `lib/api/_internal/disclosures-impl.ts`
- `lib/api/_internal/nil-comps-impl.ts`
- `hooks/use-athlete-payouts.ts`, `hooks/use-disclosures.ts`, `hooks/use-permission-grants.ts`, `hooks/use-nil-comps.ts`, `hooks/use-open-deals.ts` — copied verbatim from ios-final if present; otherwise written as thin React Query wrappers around the API methods.

**Modifies:**
- `lib/api/index.ts` — re-export all five new API surfaces.
- `hooks/index.ts` — re-export the five new hook modules under a `// Athlete (Phase 2)` section comment.

### Tier 2 — Athlete screens

**Creates (10 screens, all copied verbatim from ios-final):**
- `app/athlete/calendar.tsx` (248 lines)
- `app/athlete/comparables/[dealId].tsx` (173 lines)
- `app/athlete/disclosures/index.tsx` (275 lines)
- `app/athlete/disclosures/[id].tsx` (271 lines)
- `app/athlete/opportunities/index.tsx` (235 lines)
- `app/athlete/opportunities/[id].tsx` (691 lines)
- `app/athlete/payouts.tsx` (484 lines)
- `app/athlete/permissions/index.tsx` (298 lines)
- `app/athlete/permissions/[id].tsx` (151 lines)
- `app/athlete/training-log.tsx` (395 lines)

**Modifies:**
- `app/_layout.tsx` — register each athlete route group via `<Stack.Screen name="athlete/calendar" />` etc.

### Tier 3 — Wire athlete role-view to new screens

**Modifies:**
- Existing athlete role-view (currently the player branch in `app/(tabs)/index.tsx` or `app/(tabs)/activity.tsx` per role-dispatch logic) — adds navigation links from the role home to each new athlete screen.

---

## Pre-flight

### Task 0: Confirm Phase 1 state stable

**Files:** none — diagnosis only.

- [ ] **Step 0.1: Verify HEAD matches expected Phase 1 endpoint**

Run: `git -C /Users/arshiarahnavard/proslync-mobile-app-v1 log --oneline -5`
Expected: most recent commit is Phase 1d (`c030608` or descendant). If not, stop and report.

- [ ] **Step 0.2: Confirm sim is up and on the post-Phase-1 build**

Ask the user: "Quick check — is the sim still showing the post-Phase-1 build (cold-reload would be ideal but a hot reload is fine)? Confirm Coach + Athlete views render before I start adding."

Wait for user OK.

- [ ] **Step 0.3: Confirm VPS still reachable**

Run: `curl -sS -m 5 http://209.142.66.121:3055/api/health | head -c 200`
Expected: JSON starting with `{"ok":true,"service":"proslync-core-api"`. If timeout or error, stop and report.

- [ ] **Step 0.4: Inventory ios-final source completeness**

Run:
```bash
ls /Users/arshiarahnavard/proslync-app-ios-final/lib/providers/{actor-context-provider,impersonation-provider,fan-auth-provider}.tsx 2>&1
ls /Users/arshiarahnavard/proslync-app-ios-final/lib/storage/{secure-tokens,mmkv,fan-tokens}.ts 2>&1
ls /Users/arshiarahnavard/proslync-app-ios-final/app/_dev/*.tsx 2>&1
ls /Users/arshiarahnavard/proslync-app-ios-final/app/(tabs)/{ad,athlete,brand,deals,nil,role}.tsx 2>&1
ls /Users/arshiarahnavard/proslync-app-ios-final/app/deal/[id].tsx 2>&1
ls /Users/arshiarahnavard/proslync-app-ios-final/app/athlete/{calendar,payouts,training-log}.tsx /Users/arshiarahnavard/proslync-app-ios-final/app/athlete/comparables/[dealId].tsx /Users/arshiarahnavard/proslync-app-ios-final/app/athlete/disclosures/{index,[id]}.tsx /Users/arshiarahnavard/proslync-app-ios-final/app/athlete/opportunities/{index,[id]}.tsx /Users/arshiarahnavard/proslync-app-ios-final/app/athlete/permissions/{index,[id]}.tsx 2>&1
```
Expected: every listed file exists in `IF`. If any are missing, note them as deferred / to be authored fresh.

---

## Tier 0 — Cross-role shared infrastructure

### Task 1: Copy storage helpers (secure-tokens + mmkv)

**Files:**
- Create: `lib/storage/secure-tokens.ts`
- Create: `lib/storage/mmkv.ts`

- [ ] **Step 1.1: Create storage dir and copy files**

Run:
```bash
mkdir -p /Users/arshiarahnavard/proslync-mobile-app-v1/lib/storage
cp /Users/arshiarahnavard/proslync-app-ios-final/lib/storage/secure-tokens.ts /Users/arshiarahnavard/proslync-mobile-app-v1/lib/storage/secure-tokens.ts
cp /Users/arshiarahnavard/proslync-app-ios-final/lib/storage/mmkv.ts /Users/arshiarahnavard/proslync-mobile-app-v1/lib/storage/mmkv.ts
```

- [ ] **Step 1.2: Verify dependencies resolve**

Run: `grep -E "^import" /Users/arshiarahnavard/proslync-mobile-app-v1/lib/storage/secure-tokens.ts /Users/arshiarahnavard/proslync-mobile-app-v1/lib/storage/mmkv.ts`

Check each import path against v1's `package.json`. If any package is missing (e.g. `expo-secure-store`, `react-native-mmkv`), report it. Do NOT install packages without explicit user approval — instead, replace the missing dep with a stub:
- `expo-secure-store` missing → stub `setItemAsync/getItemAsync/deleteItemAsync` against `AsyncStorage` (already in v1)
- `react-native-mmkv` missing → stub the MMKV class as an in-memory `Map` wrapper

- [ ] **Step 1.3: Run tsc on just these two files**

Run: `cd /Users/arshiarahnavard/proslync-mobile-app-v1 && npx tsc --noEmit 2>&1 | grep "lib/storage" | head -10`
Expected: no errors specific to lib/storage.

### Task 2: Copy actor-context + impersonation providers

**Files:**
- Create: `lib/providers/actor-context-provider.tsx`
- Create: `lib/providers/impersonation-provider.tsx`
- Modify: `lib/providers/index.ts`

- [ ] **Step 2.1: Copy files**

Run:
```bash
cp /Users/arshiarahnavard/proslync-app-ios-final/lib/providers/actor-context-provider.tsx /Users/arshiarahnavard/proslync-mobile-app-v1/lib/providers/actor-context-provider.tsx
cp /Users/arshiarahnavard/proslync-app-ios-final/lib/providers/impersonation-provider.tsx /Users/arshiarahnavard/proslync-mobile-app-v1/lib/providers/impersonation-provider.tsx
```

- [ ] **Step 2.2: Inspect imports and resolve missing**

Run: `grep "^import\|from '@/" /Users/arshiarahnavard/proslync-mobile-app-v1/lib/providers/actor-context-provider.tsx /Users/arshiarahnavard/proslync-mobile-app-v1/lib/providers/impersonation-provider.tsx | head -30`

For each import, verify the target exists in v1. Common gaps to expect:
- `@/lib/api/_internal/...-impl` files (created in Tier 1 — if referenced here, stub with `const impl: any = {};`)
- `@/lib/types/auth.types` extensions — if `Persona` or `ActorContext` types are missing, copy from ios-final's auth.types.ts
- Hooks not yet created — stub with no-op

Document each stub with a `// TODO Phase 2: replace stub once <X> lands` comment.

- [ ] **Step 2.3: Add re-exports to `lib/providers/index.ts`**

Use Edit to add (after the existing exports, before the Calls block):
```ts
// Actor context (Phase 2)
export { ActorContextProvider, useActorContext } from './actor-context-provider';
export { ImpersonationProvider, useImpersonation } from './impersonation-provider';
```

Verify the export names by reading the bottom of each provider file first (e.g. `grep "^export" lib/providers/actor-context-provider.tsx`). Adjust the names if they differ.

- [ ] **Step 2.4: tsc check**

Run: `cd /Users/arshiarahnavard/proslync-mobile-app-v1 && npx tsc --noEmit 2>&1 | grep "lib/providers/" | head -10`
Expected: no new errors.

### Task 3: Compose new providers in `app/_layout.tsx`

**Files:**
- Modify: `app/_layout.tsx`

- [ ] **Step 3.1: Add imports**

Insert after the existing provider imports:
```tsx
import { ActorContextProvider } from "@/lib/providers/actor-context-provider";
import { ImpersonationProvider } from "@/lib/providers/impersonation-provider";
```

- [ ] **Step 3.2: Wrap in JSX tree**

Place the wrappers between `<AuthProvider>` and `<RoleProvider>`:
```tsx
<AuthProvider>
  <ActorContextProvider>
    <ImpersonationProvider>
      <RoleProvider>
        ... existing children ...
      </RoleProvider>
    </ImpersonationProvider>
  </ActorContextProvider>
</AuthProvider>
```

Use Edit tool with the existing `<AuthProvider>` block as the unique `old_string` anchor. Read ±10 lines around the AuthProvider JSX first to get exact indentation.

### Task 4: Copy _dev screens (personas, cache, entities, flags, index, sockets)

**Files:**
- Modify: `app/_dev/_layout.tsx`
- Create: `app/_dev/personas.tsx`, `index.tsx`, `cache.tsx`, `entities.tsx`, `flags.tsx`, `sockets.tsx`

- [ ] **Step 4.1: Copy each _dev file verbatim**

Run:
```bash
cp /Users/arshiarahnavard/proslync-app-ios-final/app/_dev/personas.tsx /Users/arshiarahnavard/proslync-mobile-app-v1/app/_dev/personas.tsx
cp /Users/arshiarahnavard/proslync-app-ios-final/app/_dev/index.tsx /Users/arshiarahnavard/proslync-mobile-app-v1/app/_dev/index.tsx
cp /Users/arshiarahnavard/proslync-app-ios-final/app/_dev/cache.tsx /Users/arshiarahnavard/proslync-mobile-app-v1/app/_dev/cache.tsx
cp /Users/arshiarahnavard/proslync-app-ios-final/app/_dev/entities.tsx /Users/arshiarahnavard/proslync-mobile-app-v1/app/_dev/entities.tsx
cp /Users/arshiarahnavard/proslync-app-ios-final/app/_dev/flags.tsx /Users/arshiarahnavard/proslync-mobile-app-v1/app/_dev/flags.tsx
cp /Users/arshiarahnavard/proslync-app-ios-final/app/_dev/sockets.tsx /Users/arshiarahnavard/proslync-mobile-app-v1/app/_dev/sockets.tsx
```

- [ ] **Step 4.2: Update `app/_dev/_layout.tsx` to register all routes**

Replace the existing `_dev/_layout.tsx` content with:

```tsx
import { Stack } from "expo-router";

export default function DevLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTintColor: "#fff",
        headerStyle: { backgroundColor: "#000" },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Dev Tools" }} />
      <Stack.Screen name="health" options={{ title: "VPS Health" }} />
      <Stack.Screen name="personas" options={{ title: "Personas" }} />
      <Stack.Screen name="cache" options={{ title: "React Query Cache" }} />
      <Stack.Screen name="entities" options={{ title: "Entities" }} />
      <Stack.Screen name="flags" options={{ title: "Feature Flags" }} />
      <Stack.Screen name="sockets" options={{ title: "Sockets" }} />
    </Stack>
  );
}
```

- [ ] **Step 4.3: Resolve dependency imports**

Each copied _dev screen imports from various ios-final modules. Run:
```bash
grep -h "^import\|from '@/" /Users/arshiarahnavard/proslync-mobile-app-v1/app/_dev/*.tsx | sort -u | head -40
```

For each `@/`-prefixed import path that doesn't resolve in v1:
- If it's `@/lib/dev/*` (the mock-registry / datasets system) — stub locally inside the dev screen with `const stub: any = {};` and comment with `// TODO Phase 2: wire to real dev system`
- If it's a missing component (e.g. `@/components/glass/*`) — check if v1 has the equivalent and update the import path; otherwise stub
- If it's a missing hook — stub or update

The goal is to get all 6 _dev screens to tsc-clean state. Visual/runtime polish in those dev tools is a Phase 2.5 concern.

- [ ] **Step 4.4: tsc check**

Run: `cd /Users/arshiarahnavard/proslync-mobile-app-v1 && npx tsc --noEmit 2>&1 | grep "app/_dev" | head -20`
Expected: zero errors. Iterate fixes until clean.

### Task 5: Copy role-tab screens (ad, athlete, brand, deals, nil, role)

**Files:**
- Create: `app/(tabs)/ad.tsx`, `athlete.tsx`, `brand.tsx`, `deals.tsx`, `nil.tsx`, `role.tsx`

- [ ] **Step 5.1: Copy each role-tab file**

Run:
```bash
cp /Users/arshiarahnavard/proslync-app-ios-final/app/\(tabs\)/ad.tsx /Users/arshiarahnavard/proslync-mobile-app-v1/app/\(tabs\)/ad.tsx
cp /Users/arshiarahnavard/proslync-app-ios-final/app/\(tabs\)/athlete.tsx /Users/arshiarahnavard/proslync-mobile-app-v1/app/\(tabs\)/athlete.tsx
cp /Users/arshiarahnavard/proslync-app-ios-final/app/\(tabs\)/brand.tsx /Users/arshiarahnavard/proslync-mobile-app-v1/app/\(tabs\)/brand.tsx
cp /Users/arshiarahnavard/proslync-app-ios-final/app/\(tabs\)/deals.tsx /Users/arshiarahnavard/proslync-mobile-app-v1/app/\(tabs\)/deals.tsx
cp /Users/arshiarahnavard/proslync-app-ios-final/app/\(tabs\)/nil.tsx /Users/arshiarahnavard/proslync-mobile-app-v1/app/\(tabs\)/nil.tsx
cp /Users/arshiarahnavard/proslync-app-ios-final/app/\(tabs\)/role.tsx /Users/arshiarahnavard/proslync-mobile-app-v1/app/\(tabs\)/role.tsx
```

- [ ] **Step 5.2: Note tab-routing decision**

v1's `(tabs)/_layout.tsx` registers only `index`, `activity`, `profile` (3 tabs). The newly-copied role-tab files are NOT auto-registered as NativeTabs.Trigger entries — that's fine because they're meant to be navigated to as stack routes within a parent tab, not tab targets themselves. Verify by reading the top of each copied file: most likely they `export default function AthleteTab()` etc. and are intended as named stack screens.

Do NOT add NativeTabs.Trigger entries for these — that would change v1's tab bar shape.

- [ ] **Step 5.3: Resolve imports + tsc**

Same iteration loop as Task 4.3 — grep imports, stub or repoint missing ones. Get each to tsc-clean.

### Task 6: Copy deal/[id] screen

**Files:**
- Create: `app/deal/[id].tsx`
- Modify: `app/_layout.tsx`

- [ ] **Step 6.1: Copy file**

Run: `mkdir -p /Users/arshiarahnavard/proslync-mobile-app-v1/app/deal && cp /Users/arshiarahnavard/proslync-app-ios-final/app/deal/\[id\].tsx /Users/arshiarahnavard/proslync-mobile-app-v1/app/deal/\[id\].tsx`

- [ ] **Step 6.2: Register in `app/_layout.tsx`**

Add `<Stack.Screen name="deal/[id]" />` near the existing `<Stack.Screen name="nil-manager/athlete/[id]" />` line.

- [ ] **Step 6.3: Resolve imports + tsc**

deal/[id] likely depends on proslyncApi (already in v1) and viewer-role helpers. For any missing dep, stub.

### Task 7: Tier 0 tsc verify + commit

- [ ] **Step 7.1: Full tsc**

Run: `cd /Users/arshiarahnavard/proslync-mobile-app-v1 && npx tsc --noEmit 2>&1 | grep -E "^(app|components|hooks|lib)/" | wc -l`
Compare to the Phase 1 baseline of 58 errors. Acceptable: ≤ 70 (some new files may have minor type issues we can fix in Tier 3). If > 70, audit the diff and decide whether to add fixes inline.

- [ ] **Step 7.2: Commit Tier 0**

Run:
```bash
cd /Users/arshiarahnavard/proslync-mobile-app-v1
git add -A
git diff --cached --stat | tail -3
```
Verify reasonable file count (~15-25 files).

```bash
git commit -m "$(cat <<'EOF'
Phase 2 Tier 0: cross-role shared infra

Adds the shared infra all roles will use in Phase 2:
- lib/storage/{secure-tokens,mmkv}.ts — token + cache persistence
- lib/providers/{actor-context,impersonation}-provider — persona state
- app/_dev/{index,personas,cache,entities,flags,sockets}.tsx — dev tools
- app/(tabs)/{ad,athlete,brand,deals,nil,role}.tsx — role-named stack screens
- app/deal/[id].tsx — role-aware deal detail
- app/_layout.tsx wraps ActorContext + Impersonation providers
- app/_dev/_layout.tsx registers all dev routes

All ios-final imports resolved via existing v1 modules or stubbed
with TODO Phase 2 markers where the dependent ports haven't landed
yet.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Tier 1 — Athlete API + hooks

### Task 8: Copy athlete API files

**Files:**
- Create: `lib/api/athlete-payouts.ts`, `disclosures.ts`, `permission-grants.ts`, `nil-comps.ts`, `open-deals.ts`
- Create: `lib/api/_internal/athlete-payouts-impl.ts`, `disclosures-impl.ts`, `nil-comps-impl.ts`

- [ ] **Step 8.1: Copy each API file from ios-final**

Run:
```bash
cd /Users/arshiarahnavard/proslync-mobile-app-v1
cp /Users/arshiarahnavard/proslync-app-ios-final/lib/api/athlete-payouts.ts lib/api/athlete-payouts.ts
cp /Users/arshiarahnavard/proslync-app-ios-final/lib/api/disclosures.ts lib/api/disclosures.ts
cp /Users/arshiarahnavard/proslync-app-ios-final/lib/api/permission-grants.ts lib/api/permission-grants.ts
cp /Users/arshiarahnavard/proslync-app-ios-final/lib/api/nil-comps.ts lib/api/nil-comps.ts
cp /Users/arshiarahnavard/proslync-app-ios-final/lib/api/open-deals.ts lib/api/open-deals.ts
cp /Users/arshiarahnavard/proslync-app-ios-final/lib/api/_internal/athlete-payouts-impl.ts lib/api/_internal/athlete-payouts-impl.ts
cp /Users/arshiarahnavard/proslync-app-ios-final/lib/api/_internal/disclosures-impl.ts lib/api/_internal/disclosures-impl.ts
cp /Users/arshiarahnavard/proslync-app-ios-final/lib/api/_internal/nil-comps-impl.ts lib/api/_internal/nil-comps-impl.ts
```

- [ ] **Step 8.2: Resolve imports**

Each file imports from `./client` (the apiClient) and `../config`. These exist in v1 after Phase 1d. Other imports (envelopes, types from `./proslync` or `./proslync-spines`) — verify each resolves. Stub or update import paths where needed.

- [ ] **Step 8.3: Update `lib/api/index.ts`**

Add (after existing proslyncApi exports):
```ts
// Athlete (Phase 2)
export { athletePayoutsApi } from './athlete-payouts';
export { disclosuresApi } from './disclosures';
export { permissionGrantsApi } from './permission-grants';
export { nilCompsApi } from './nil-comps';
export { openDealsApi } from './open-deals';
```

Verify the actual export names by reading the bottom of each file first; adjust if different.

- [ ] **Step 8.4: tsc**

Run: `cd /Users/arshiarahnavard/proslync-mobile-app-v1 && npx tsc --noEmit 2>&1 | grep "lib/api" | head -20`
Expected: zero new errors.

### Task 9: Write athlete hooks

**Files:**
- Create: `hooks/use-athlete-payouts.ts`, `use-disclosures.ts`, `use-permission-grants.ts`, `use-nil-comps.ts`, `use-open-deals.ts`
- Modify: `hooks/index.ts`

- [ ] **Step 9.1: Check ios-final for existing hooks**

Run:
```bash
ls /Users/arshiarahnavard/proslync-app-ios-final/hooks/{use-athlete-payouts,use-disclosures,use-permission-grants,use-nil-comps,use-open-deals,use-athlete-wallet,use-athlete-contracts}.ts 2>&1
```

Copy any that exist. For the rest, write thin React Query wrappers using the v1 hooks pattern from `CLAUDE.md`:

```ts
import { useQuery } from '@tanstack/react-query';
import { athletePayoutsApi } from '@/lib/api/athlete-payouts';

export const ATHLETE_PAYOUTS_KEY = 'athlete-payouts';

export function useAthletePayouts(athleteId: string | undefined) {
  return useQuery({
    queryKey: [ATHLETE_PAYOUTS_KEY, athleteId],
    queryFn: () => athletePayoutsApi.list(athleteId!),
    enabled: !!athleteId,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
```

Repeat for each athlete API. Reference the actual API method names by reading each API file first.

- [ ] **Step 9.2: Add to `hooks/index.ts`**

Insert at the end, before `// Admin hooks`:
```ts
// Athlete (Phase 2)
export { useAthletePayouts, ATHLETE_PAYOUTS_KEY } from './use-athlete-payouts';
export { useDisclosures, useDisclosure, DISCLOSURES_KEY } from './use-disclosures';
export { usePermissionGrants, PERMISSION_GRANTS_KEY } from './use-permission-grants';
export { useNilComps, NIL_COMPS_KEY } from './use-nil-comps';
export { useOpenDeals, useOpenDeal, OPEN_DEALS_KEY } from './use-open-deals';
```

Adjust the exported names to match what you actually wrote in Step 9.1.

- [ ] **Step 9.3: tsc**

Run: `cd /Users/arshiarahnavard/proslync-mobile-app-v1 && npx tsc --noEmit 2>&1 | grep "hooks/" | head -10`
Expected: zero new errors.

### Task 10: Tier 1 commit

- [ ] **Step 10.1: Commit**

Run:
```bash
cd /Users/arshiarahnavard/proslync-mobile-app-v1
git add -A
git diff --cached --stat | tail -3
git commit -m "$(cat <<'EOF'
Phase 2 Tier 1: athlete API surface + hooks

Adds athlete-shaped API modules ported from ios-final:
- lib/api/athlete-payouts.ts + _internal/athlete-payouts-impl.ts
- lib/api/disclosures.ts + _internal/disclosures-impl.ts
- lib/api/permission-grants.ts
- lib/api/nil-comps.ts + _internal/nil-comps-impl.ts
- lib/api/open-deals.ts

Plus thin React Query hooks: use-athlete-payouts, use-disclosures,
use-permission-grants, use-nil-comps, use-open-deals. All
re-exported from lib/api/index.ts and hooks/index.ts under
"Athlete (Phase 2)" section comments.

Live VPS routes used: /api/permissions, /api/applications (open-deals).
Fallback-to-mock for /api/athletes/:id/payouts, /api/disclosures/*,
/api/nil-comps (not on VPS per gap-analysis).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Tier 2 — Athlete screens (10)

The pattern for each screen is identical: copy verbatim → resolve imports → tsc-clean → register in `_layout.tsx`. We commit after each functional group (calendar, comparables, disclosures, opportunities, payouts, permissions, training-log) so each is debuggable independently.

### Task 11: Copy athlete/calendar + training-log + payouts

**Files:**
- Create: `app/athlete/calendar.tsx`, `app/athlete/payouts.tsx`, `app/athlete/training-log.tsx`
- Modify: `app/_layout.tsx`

- [ ] **Step 11.1: Copy + register**

Run:
```bash
mkdir -p /Users/arshiarahnavard/proslync-mobile-app-v1/app/athlete
cp /Users/arshiarahnavard/proslync-app-ios-final/app/athlete/calendar.tsx /Users/arshiarahnavard/proslync-mobile-app-v1/app/athlete/calendar.tsx
cp /Users/arshiarahnavard/proslync-app-ios-final/app/athlete/payouts.tsx /Users/arshiarahnavard/proslync-mobile-app-v1/app/athlete/payouts.tsx
cp /Users/arshiarahnavard/proslync-app-ios-final/app/athlete/training-log.tsx /Users/arshiarahnavard/proslync-mobile-app-v1/app/athlete/training-log.tsx
```

In `app/_layout.tsx`, add (near the other athlete-adjacent screens):
```tsx
<Stack.Screen name="athlete/calendar" />
<Stack.Screen name="athlete/payouts" />
<Stack.Screen name="athlete/training-log" />
```

- [ ] **Step 11.2: Resolve imports**

Grep imports across all three:
```bash
grep -h "^import\|from '@/" /Users/arshiarahnavard/proslync-mobile-app-v1/app/athlete/{calendar,payouts,training-log}.tsx | sort -u | head -30
```
Stub or repoint missing imports. tsc-clean before committing.

### Task 12: Copy athlete/disclosures + comparables

**Files:**
- Create: `app/athlete/disclosures/index.tsx`, `app/athlete/disclosures/[id].tsx`, `app/athlete/comparables/[dealId].tsx`
- Modify: `app/_layout.tsx`

- [ ] **Step 12.1: Copy + register**

Run:
```bash
mkdir -p /Users/arshiarahnavard/proslync-mobile-app-v1/app/athlete/disclosures /Users/arshiarahnavard/proslync-mobile-app-v1/app/athlete/comparables
cp /Users/arshiarahnavard/proslync-app-ios-final/app/athlete/disclosures/index.tsx /Users/arshiarahnavard/proslync-mobile-app-v1/app/athlete/disclosures/index.tsx
cp /Users/arshiarahnavard/proslync-app-ios-final/app/athlete/disclosures/\[id\].tsx /Users/arshiarahnavard/proslync-mobile-app-v1/app/athlete/disclosures/\[id\].tsx
cp /Users/arshiarahnavard/proslync-app-ios-final/app/athlete/comparables/\[dealId\].tsx /Users/arshiarahnavard/proslync-mobile-app-v1/app/athlete/comparables/\[dealId\].tsx
```

In `app/_layout.tsx` add:
```tsx
<Stack.Screen name="athlete/disclosures/index" />
<Stack.Screen name="athlete/disclosures/[id]" />
<Stack.Screen name="athlete/comparables/[dealId]" />
```

- [ ] **Step 12.2: Resolve imports + tsc**

Same pattern as Task 11. Iterate until tsc-clean.

### Task 13: Copy athlete/opportunities + permissions

**Files:**
- Create: `app/athlete/opportunities/index.tsx`, `app/athlete/opportunities/[id].tsx`, `app/athlete/permissions/index.tsx`, `app/athlete/permissions/[id].tsx`
- Modify: `app/_layout.tsx`

- [ ] **Step 13.1: Copy + register**

Run:
```bash
mkdir -p /Users/arshiarahnavard/proslync-mobile-app-v1/app/athlete/opportunities /Users/arshiarahnavard/proslync-mobile-app-v1/app/athlete/permissions
cp /Users/arshiarahnavard/proslync-app-ios-final/app/athlete/opportunities/index.tsx /Users/arshiarahnavard/proslync-mobile-app-v1/app/athlete/opportunities/index.tsx
cp /Users/arshiarahnavard/proslync-app-ios-final/app/athlete/opportunities/\[id\].tsx /Users/arshiarahnavard/proslync-mobile-app-v1/app/athlete/opportunities/\[id\].tsx
cp /Users/arshiarahnavard/proslync-app-ios-final/app/athlete/permissions/index.tsx /Users/arshiarahnavard/proslync-mobile-app-v1/app/athlete/permissions/index.tsx
cp /Users/arshiarahnavard/proslync-app-ios-final/app/athlete/permissions/\[id\].tsx /Users/arshiarahnavard/proslync-mobile-app-v1/app/athlete/permissions/\[id\].tsx
```

In `app/_layout.tsx`:
```tsx
<Stack.Screen name="athlete/opportunities/index" />
<Stack.Screen name="athlete/opportunities/[id]" />
<Stack.Screen name="athlete/permissions/index" />
<Stack.Screen name="athlete/permissions/[id]" />
```

- [ ] **Step 13.2: Resolve imports + tsc**

Same loop.

### Task 14: Tier 2 commit

- [ ] **Step 14.1: Final tsc**

Run: `cd /Users/arshiarahnavard/proslync-mobile-app-v1 && npx tsc --noEmit 2>&1 | grep -E "^(app|components|hooks|lib)/" | wc -l`
Goal: ≤ 75 (10 new screens may add 5-10 small typing issues if they touch v1's pre-existing problem areas). If significantly higher, audit before committing.

- [ ] **Step 14.2: Commit Tier 2**

```bash
git add -A
git commit -m "$(cat <<'EOF'
Phase 2 Tier 2: athlete screens (10)

Ports all athlete-role screens from ios-final verbatim:
- athlete/calendar.tsx (248 lines)
- athlete/payouts.tsx (484 lines)
- athlete/training-log.tsx (395 lines)
- athlete/disclosures/{index,[id]}.tsx
- athlete/comparables/[dealId].tsx
- athlete/opportunities/{index,[id]}.tsx
- athlete/permissions/{index,[id]}.tsx

All registered in app/_layout.tsx. Imports resolved against v1
counterparts or stubbed where Phase 2 ports haven't landed yet.

These screens read from athlete API hooks (Tier 1); live VPS where
routes exist (/api/permissions, /api/applications), fallback-to-mock
elsewhere per gap-analysis.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Tier 3 — Wire athlete role-view to new screens

### Task 15: Add navigation entries in athlete role-view

**Files:**
- Modify: the athlete role-view component (currently the player branch in `app/(tabs)/index.tsx` per recent commit log; verify before editing)

- [ ] **Step 15.1: Locate the athlete role-view**

Run: `grep -lrn "player\|athlete" /Users/arshiarahnavard/proslync-mobile-app-v1/app/\(tabs\)/index.tsx /Users/arshiarahnavard/proslync-mobile-app-v1/components/ | grep -E "view\.tsx|index\.tsx" | head -5`

Find the file that renders the athlete (default) role's home screen.

- [ ] **Step 15.2: Add a "Phase 2" section with navigation cards**

Inside that role-view's render, add a `<View>` with TouchableOpacity cards for:
- Opportunities → `router.push('/athlete/opportunities')`
- Disclosures → `router.push('/athlete/disclosures')`
- Permissions → `router.push('/athlete/permissions')`
- Payouts → `router.push('/athlete/payouts')`
- Calendar → `router.push('/athlete/calendar')`
- Training Log → `router.push('/athlete/training-log')`

Each card uses the existing GlassButton or GlassSurface from v1's component library. Match the visual style of existing cards in the role-view.

If the role-view already has a section like this with old donor links, replace just those links (don't refactor the whole layout).

### Task 16: Final sim verification + memory update

- [ ] **Step 16.1: Ask user to reload sim**

Tell the user: "Phase 2 athlete fully landed. Reload sim and:
1. Walk through the athlete (player) role's home. Confirm no red-screen.
2. Tap into each new screen via the nav cards: Opportunities, Disclosures, Permissions, Payouts, Calendar, Training Log.
3. For each, confirm it renders (live data or `[mock]` fallback both fine — just no red-screen).
4. Navigate to `/_dev/personas`, confirm it loads the seeded persona list from `/api/dev/users` and dev-login works.
5. Navigate to `/deal/[some-id]` (pick a deal id from /_dev/entities or guess `deal-1`), confirm deal detail renders.

Report any screen that red-screens or fails to load data."

Wait for user response. If anything red-screens, the implementer subagent for that specific screen gets re-dispatched with the error context.

- [ ] **Step 16.2: Update memory**

Edit `/Users/arshiarahnavard/.claude/projects/-Users-arshiarahnavard-proslync-mobile-app-v1/memory/project_four_stream_integration_plan.md`:

In the Status block, mark stream **D (athlete slice)** as in-progress / first-role-landed, with the three Phase 2 athlete commit hashes. Note that brand → school → coach → NIL manager → agent → fan plans get written next per the spec's role order.

- [ ] **Step 16.3: Announce next**

Tell the user: "Phase 2 athlete done. Want me to write the Phase 2 brand plan next, or pause to review?"

---

## Self-Review (executed during plan writing)

**Spec coverage:**
- Phase 2 athlete API files (5) → Task 8 ✓
- Phase 2 athlete hooks (5) → Task 9 ✓
- Phase 2 athlete screens (10) → Tasks 11–13 ✓
- Shared infra (personas, dev tools, role-tabs, deal/[id], actor-context, impersonation) → Tasks 1–6 ✓
- Athlete role-view wiring → Task 15 ✓
- VPS verification → Task 16 ✓

**Placeholder scan:** Tasks 4.3, 5.3, 6.3, 8.2, 11.2, 12.2, 13.2 all have "resolve imports + stub missing" steps that are intentional — they let the implementer adapt to per-screen import variance without bloating this plan with every possible missing-dep. Each stub gets a `TODO Phase 2: replace once <X> lands` comment so future work isn't blind.

**Type consistency:** `proslyncApi`, `apiClient`, `config.api.*` reused from Phase 1; new APIs follow the same envelope pattern (`ProslyncDataEnvelope<T>`, `ProslyncPage<T>` from `proslync-spines.ts`). Hook export names (`ATHLETE_PAYOUTS_KEY` etc.) follow the v1 convention from CLAUDE.md.

**Risk:** Tier 0's stubs (especially for the _dev tools which depend on ios-final's mock-registry / dev-datasets system that v1 doesn't have) might leave dev tools visually broken. That's acceptable — the dev tools are for developers, not the demo. Goal is tsc-clean and runtime-non-crashing, not pixel-parity.
