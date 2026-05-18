# Phase 1 — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land Phase 1 of the v1 ← iOS-final fusion: delete nightclub residue, bulk-copy assets from ios-final, fix asset breakage in simulator, replace `lib/config.ts` with ios-final's 3-mode version, drop in the `proslyncApi` client foundation, and prove end-to-end VPS wiring via a `/api/health` smoke screen.

**Architecture:** Five logical landings (residue deletion → asset bulk-copy → asset breakage fix → API foundation + VPS env → smoke screen), each terminated by a `tsc --noEmit` pass and a focused commit on the `arshia` branch. No tests added (verification is simulator-based per spec; user reloads sim and reports back).

**Tech Stack:** React Native 0.81 + Expo SDK 54 + TypeScript + expo-router + React Query. VPS backend at `http://209.142.66.121:3055` (plain HTTP, ATS exception via `NSAllowsArbitraryLoads=true`).

**Spec:** `docs/superpowers/specs/2026-05-18-v1-ios-final-fusion-design.md`

**Repo paths used by this plan:**
- `V1 = /Users/arshiarahnavard/proslync-mobile-app-v1` (the active branch `arshia`)
- `IF = /Users/arshiarahnavard/proslync-app-ios-final` (read-only source)

---

## File Structure (what this plan creates / modifies / deletes)

### Deletions (Task 1–5)

**Routes (`app/`):** `manage-event/` (subtree), `manage-venue/` (subtree), `event/` (subtree), `create-event.tsx`, `edit-event.tsx`, `my-events.tsx`, `my-venues.tsx`, `create-organization.tsx`, `venue-profile/` (subtree), `text-blast-compose.tsx`, `dashboard.tsx`, `dashboard/` (subtree), `wallet.tsx`, `qr-card.tsx`, `scan-qr.tsx`, `tap-to-pay.tsx`, `admin/events.tsx`, `live.tsx`, `stripe-document-upload.tsx`, `stripe-onboarding.tsx`.

**API (`lib/api/`):** `bar-orders.ts`, `bar-tabs.ts`, `events.ts`, `menu.ts`, `pricing.ts`, `tables.ts`, `team.ts`, `text-blasts.ts`, `tickets.ts`, `venues.ts`, `venue-contact-tags.ts`, `venue-schedule.ts`, `artists.ts`, `organizations.ts`, `dashboard.ts`.

**Providers (`lib/providers/`):** `bar-socket-provider.tsx`, `terminal-provider.tsx`, `wallet-provider.tsx`.

**Components (`components/`):** `bar/`, `event/`, `event-form/`, `tables/`, `tickets/`, `wallet/`, `pricing/`, `scanner/`, `dashboard/`, `team/`, `artists/`, `check-ins/`, `stripe-onboarding/`.

**Hooks (`hooks/`):** `use-bar-orders.ts`, `use-bar-tabs.ts`, `use-events-query.ts`, `use-event-mutations.ts`, `use-event-form.ts`, `use-event-artists.ts`, `use-event-attendees.ts`, `use-event-permissions.ts`, `use-event-socket.ts`, `use-dashboard.ts`, `use-dashboard-query.ts`, `use-venues-query.ts`, `use-venue-followers.ts`, `use-venue-menu.ts`, `use-venue-query.ts`, `use-venue-schedule.ts`, `use-venue-tables.ts`, `use-venue-contact-tags.ts`, `use-team-mutations.ts`, `use-team-queries.ts`, `use-pricing-mutations.ts`, `use-promo-code.ts`, `use-text-blasts.ts`, `use-cross-event-text-blasts.ts`, `use-ticket-tiers.ts`, `use-my-tickets.ts`, `use-membership-card.ts`, `use-wallet-queries.ts`, `use-revenue-analytics.ts`, `use-payment-intent.ts`, `use-all-attendees.ts`.

**Mock data (`lib/data/`):** `wallet-mock.ts`.

### Modifications (Task 5, 18)

- `app/_layout.tsx` — remove provider wrappers + `Stack.Screen` entries for deleted routes (Task 5); register `_dev/health` (Task 18).
- `hooks/index.ts` — remove re-exports for deleted hooks (Task 4).
- `lib/providers/index.ts` — remove re-exports for deleted providers (Task 3).
- `app.json` — confirm `NSAppTransportSecurity.NSAllowsArbitraryLoads = true` (Task 16).

### Creations (Task 7–9, 14–17)

- `assets/images/brands/` — 40 brand logo files (Task 7).
- `assets/images/schools/` — 7 school PNGs (Task 8).
- `assets/images/brand/{circle,effects,light,mono,pattern,polished,rounded,transparent,watermark}/` — brand variant subdirs (Task 9).
- `lib/config.ts` — replaced wholesale (Task 14).
- `lib/api/client.ts` — replaced wholesale (Task 15).
- `lib/api/proslync.ts`, `lib/api/proslync-spines.ts`, `lib/api/errors.ts` — copied from ios-final (Task 15).
- `lib/api/_internal/` — empty scaffold dir with a `.gitkeep` (Task 15).
- `.env.local` — gitignored, VPS URL + mode (Task 16).
- `app/_dev/_layout.tsx`, `app/_dev/health.tsx` — smoke screen (Task 17).

---

## Pre-flight

### Task 0: Capture current simulator state

**Files:** none.

**Why:** Phase 1c needs the exact red-screen error from before deletions, so we can tell which crashes Phase 1a/1b incidentally fixes vs which need a targeted fix.

- [ ] **Step 0.1: Confirm Metro is running**

Run: `lsof -iTCP:8081 -sTCP:LISTEN -n -P`
Expected: a `node` PID listening on 8081. If none, ask the user to start Metro (`npx expo start --ios` from `V1`).

- [ ] **Step 0.2: Ask user to capture the cold-boot error**

Tell the user: "Cold-reload the iOS simulator (Cmd+R in sim, or shake → Reload). When the red screen appears, screenshot it or paste the top of the error message into chat. Also note any role's home screen that shows gray-box images or the wrong avatar. I need this baseline before deleting anything."

Wait for user response before proceeding. Save the captured error verbatim into a scratch note at `docs/superpowers/plans/_phase-1-sim-baseline.md` (gitignored work file; commit suppressed).

- [ ] **Step 0.3: Snapshot git state**

Run: `git -C /Users/arshiarahnavard/proslync-mobile-app-v1 status --short && git -C /Users/arshiarahnavard/proslync-mobile-app-v1 rev-parse HEAD`
Expected: clean WT except for the pre-existing dirty files noted in memory (`app/(tabs)/index.tsx`, `app/_layout.tsx`, `components/coach/coach-view.tsx`, `lib/data/mock-coach-data.ts`) and untracked `app/section/`. HEAD at `5f9ccfd` (post-spec-commit).

If anything else is dirty, stop and ask the user before proceeding.

---

## Phase 1a — Residue deletion

### Task 1: Delete nightclub routes

**Files:** see Deletions list above (Routes section).

- [ ] **Step 1.1: Verify ios-final has no equivalents we'd want to keep**

Run:
```bash
diff <(ls /Users/arshiarahnavard/proslync-mobile-app-v1/app/manage-event/ 2>/dev/null) <(ls /Users/arshiarahnavard/proslync-app-ios-final/app/manage-event/ 2>/dev/null) || true
```
Expected: ios-final dir doesn't exist (`No such file or directory`). Confirms manage-event is purely donor.

- [ ] **Step 1.2: Delete route files and subtrees**

Run:
```bash
cd /Users/arshiarahnavard/proslync-mobile-app-v1
git rm -r app/manage-event app/manage-venue app/event app/venue-profile app/dashboard app/dashboard.tsx app/create-event.tsx app/edit-event.tsx app/my-events.tsx app/my-venues.tsx app/create-organization.tsx app/text-blast-compose.tsx app/wallet.tsx app/qr-card.tsx app/scan-qr.tsx app/tap-to-pay.tsx app/admin/events.tsx app/live.tsx app/stripe-document-upload.tsx app/stripe-onboarding.tsx
```
Expected: each path deleted with a `rm` line. No "did not match any files" errors. If a path is missing, note it and continue (already gone is fine).

- [ ] **Step 1.3: Verify routes gone**

Run: `ls /Users/arshiarahnavard/proslync-mobile-app-v1/app/ | grep -E 'manage-event|manage-venue|event/|venue-profile|^dashboard|create-event|edit-event|my-events|my-venues|create-organization|text-blast-compose|wallet\.tsx|qr-card|scan-qr|tap-to-pay|^live\.tsx' || echo "all deleted"`
Expected: `all deleted`

### Task 2: Delete nightclub API files

**Files:** see Deletions list above (API section).

- [ ] **Step 2.1: Delete API files**

Run:
```bash
cd /Users/arshiarahnavard/proslync-mobile-app-v1
git rm lib/api/bar-orders.ts lib/api/bar-tabs.ts lib/api/events.ts lib/api/menu.ts lib/api/pricing.ts lib/api/tables.ts lib/api/team.ts lib/api/text-blasts.ts lib/api/tickets.ts lib/api/venues.ts lib/api/venue-contact-tags.ts lib/api/venue-schedule.ts lib/api/artists.ts lib/api/organizations.ts lib/api/dashboard.ts
```
Expected: 15 files removed.

- [ ] **Step 2.2: Strip re-exports from `lib/api/index.ts`**

Read `lib/api/index.ts`. For each of the 15 deleted files, remove the `export * from './<name>'` (or `export { ... } from './<name>'`) line.

If the file uses a barrel export pattern (`export * from './bar-orders'`), the matching line is straightforward. If it re-exports specific symbols, remove those lines. Run `git diff lib/api/index.ts` to confirm only deletion lines.

### Task 3: Delete nightclub providers + components

**Files:** see Deletions list above (Providers + Components sections).

- [ ] **Step 3.1: Delete provider files**

Run:
```bash
cd /Users/arshiarahnavard/proslync-mobile-app-v1
git rm lib/providers/bar-socket-provider.tsx lib/providers/terminal-provider.tsx lib/providers/wallet-provider.tsx
```
Expected: 3 files removed.

- [ ] **Step 3.2: Strip re-exports from `lib/providers/index.ts`**

Read `lib/providers/index.ts`. Remove lines re-exporting `BarSocketProvider`, `TerminalProvider`, `WalletProvider`, and matching hooks `useBarSocket`, `useTerminal`, `useWallet`. Run `git diff lib/providers/index.ts` to verify only deletions.

- [ ] **Step 3.3: Delete component subtrees**

Run:
```bash
cd /Users/arshiarahnavard/proslync-mobile-app-v1
git rm -r components/bar components/event components/event-form components/tables components/tickets components/wallet components/pricing components/scanner components/dashboard components/team components/artists components/check-ins components/stripe-onboarding
```
Expected: each dir gone. Any missing-path errors → note and continue.

### Task 4: Delete nightclub hooks + mock data

**Files:** see Deletions list above (Hooks + Mock data sections).

- [ ] **Step 4.1: Delete hook files**

Run:
```bash
cd /Users/arshiarahnavard/proslync-mobile-app-v1
git rm hooks/use-bar-orders.ts hooks/use-bar-tabs.ts hooks/use-events-query.ts hooks/use-event-mutations.ts hooks/use-event-form.ts hooks/use-event-artists.ts hooks/use-event-attendees.ts hooks/use-event-permissions.ts hooks/use-event-socket.ts hooks/use-dashboard.ts hooks/use-dashboard-query.ts hooks/use-venues-query.ts hooks/use-venue-followers.ts hooks/use-venue-menu.ts hooks/use-venue-query.ts hooks/use-venue-schedule.ts hooks/use-venue-tables.ts hooks/use-venue-contact-tags.ts hooks/use-team-mutations.ts hooks/use-team-queries.ts hooks/use-pricing-mutations.ts hooks/use-promo-code.ts hooks/use-text-blasts.ts hooks/use-cross-event-text-blasts.ts hooks/use-ticket-tiers.ts hooks/use-my-tickets.ts hooks/use-membership-card.ts hooks/use-wallet-queries.ts hooks/use-revenue-analytics.ts hooks/use-payment-intent.ts hooks/use-all-attendees.ts
```
Expected: 31 files removed.

- [ ] **Step 4.2: Strip re-exports from `hooks/index.ts`**

Read `hooks/index.ts`. For each deleted hook, remove its `export * from './<name>'` or `export { useX } from './<name>'` line. If hook re-exports are grouped under section comments (e.g., `// Events`), remove the section comment if all of its hooks are gone. Run `git diff hooks/index.ts` to verify only deletions.

- [ ] **Step 4.3: Delete mock data**

Run:
```bash
cd /Users/arshiarahnavard/proslync-mobile-app-v1
git rm lib/data/wallet-mock.ts
```

### Task 5: Clean `app/_layout.tsx`

**Files:**
- Modify: `app/_layout.tsx`

- [ ] **Step 5.1: Remove imports for deleted providers**

Edit `app/_layout.tsx`. Remove these import lines:
```
import { WalletProvider } from "@/lib/providers/wallet-provider";
// StripeTerminal removed for free-signing build (needs paid proximity-reader entitlement)
// import { TerminalProvider } from "@/lib/providers/terminal-provider";
import { BarSocketProvider } from "@/lib/providers/bar-socket-provider";
```

- [ ] **Step 5.2: Remove provider wrappers**

In the JSX tree returned by `RootLayout()`, remove the `<BarSocketProvider>...</BarSocketProvider>` wrapper (around `<CallProvider>`) and the `<WalletProvider>...</WalletProvider>` wrapper (around `<BottomSheetModalProvider>`). The resulting nesting becomes:

```tsx
<AuthProvider>
  <RoleProvider>
    <ChatSocketProvider>
      <ChannelsSocketProvider>
        <CallProvider>
          <LiveLocationProvider>
            <TabNavigationProvider>
              <TabBarSheetProvider>
                <BottomSheetModalProvider>
                  <RootLayoutNav />
                </BottomSheetModalProvider>
              </TabBarSheetProvider>
            </TabNavigationProvider>
          </LiveLocationProvider>
        </CallProvider>
      </ChannelsSocketProvider>
    </ChatSocketProvider>
  </RoleProvider>
</AuthProvider>
```

- [ ] **Step 5.3: Remove `<Stack.Screen>` entries for deleted routes**

In `RootLayoutNav()`, remove these lines:

```tsx
<Stack.Screen name="text-blast-compose" />
<Stack.Screen name="event/[id]" />
<Stack.Screen name="event/my-tab" />
<Stack.Screen name="dashboard" />
<Stack.Screen name="create-event" />
<Stack.Screen name="my-events" />
<Stack.Screen name="manage-event/[id]" />
<Stack.Screen name="manage-venue/[id]" />
<Stack.Screen
  name="scan-qr"
  options={{
    presentation: "fullScreenModal",
    animation: "slide_from_bottom",
    fullScreenGestureEnabled: false,
  }}
/>
<Stack.Screen
  name="qr-card"
  options={{
    presentation: "fullScreenModal",
    animation: "slide_from_bottom",
    fullScreenGestureEnabled: false,
  }}
/>
<Stack.Screen name="tap-to-pay" />
<Stack.Screen
  name="wallet"
  options={{ animation: "none", gestureEnabled: false }}
/>
```

### Task 6: TypeScript verification + commit residue deletion

**Files:** none modified — verification only.

- [ ] **Step 6.1: Run `tsc --noEmit`**

Run: `cd /Users/arshiarahnavard/proslync-mobile-app-v1 && npx tsc --noEmit 2>&1 | head -80`
Expected: zero errors. If errors appear, they're dangling imports from deletions. For each error:
- If the importer is itself a donor file we missed → delete it.
- If the importer is a NIL file Arshia wants to keep → replace the broken import with a stub (`const stub = {} as any;`) and add a `// TODO: phase 2 — replace stub when <X> is ported` comment.
Do NOT proceed to Step 6.2 until `tsc --noEmit` is clean.

- [ ] **Step 6.2: Commit residue deletion**

Run:
```bash
cd /Users/arshiarahnavard/proslync-mobile-app-v1
git add -A
git diff --cached --stat | tail -1
```
Verify the stat shows roughly: ~80–120 files changed, almost all deletions.

```bash
git commit -m "$(cat <<'EOF'
Phase 1a: delete nightclub residue

Removes donor-shape routes (manage-event/, manage-venue/, event/,
dashboard donor subtree, wallet/qr/tap-to-pay), API files (bar*,
events, venues, tickets, text-blasts, pricing, tables, team, menu,
dashboard, organizations, artists, venue-*), providers (bar-socket,
terminal, wallet), and matching components/hooks/mock-data.

Clears the way for ios-final API surface and asset library in
subsequent Phase 1 landings.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 6.3: Ask user to reload simulator**

Tell the user: "Phase 1a committed. Reload the simulator. Expected outcome: any role-views that still imported from deleted modules will now red-screen. Capture the new error (it should be different from the pre-Phase-1 baseline). Most likely it's just the simulator surviving with the same broken-asset symptoms from before; if so we proceed to Phase 1b."

Wait for user report before continuing.

---

## Phase 1b — Asset bulk-copy

### Task 7: Bulk-copy brand SVGs

**Files:**
- Create: `assets/images/brands/*` (40 files)

- [ ] **Step 7.1: Copy `brands/` directory verbatim**

Run:
```bash
cp -R /Users/arshiarahnavard/proslync-app-ios-final/assets/images/brands /Users/arshiarahnavard/proslync-mobile-app-v1/assets/images/brands
```
Expected: directory created, no errors.

- [ ] **Step 7.2: Verify file count**

Run: `ls /Users/arshiarahnavard/proslync-mobile-app-v1/assets/images/brands/ | wc -l`
Expected: `30` (a count of files; the actual list is in the spec's Phase 1b section). If 0, copy failed — investigate.

### Task 8: Bulk-copy school PNGs

**Files:**
- Create: `assets/images/schools/*` (7 files)

- [ ] **Step 8.1: Copy `schools/` directory verbatim**

Run:
```bash
cp -R /Users/arshiarahnavard/proslync-app-ios-final/assets/images/schools /Users/arshiarahnavard/proslync-mobile-app-v1/assets/images/schools
```

- [ ] **Step 8.2: Verify**

Run: `ls /Users/arshiarahnavard/proslync-mobile-app-v1/assets/images/schools/`
Expected output:
```
duke.png
lsu.png
notre-dame.png
rutgers.png
syracuse.png
texas.png
usc.png
```

### Task 9: Bulk-copy brand variant subdirs

**Files:**
- Create: `assets/images/brand/{circle,effects,light,mono,pattern,polished,rounded,transparent,watermark}/`

- [ ] **Step 9.1: Copy `brand/` (with subdirs) verbatim**

Run:
```bash
cp -R /Users/arshiarahnavard/proslync-app-ios-final/assets/images/brand /Users/arshiarahnavard/proslync-mobile-app-v1/assets/images/brand
```

- [ ] **Step 9.2: Verify subdir presence**

Run: `ls /Users/arshiarahnavard/proslync-mobile-app-v1/assets/images/brand/`
Expected: `_generate.py circle effects light mono pattern polished rounded transparent watermark`

### Task 10: Commit asset bulk-copy

**Files:** none new — just stage the copied dirs.

- [ ] **Step 10.1: Add and commit**

Run:
```bash
cd /Users/arshiarahnavard/proslync-mobile-app-v1
git add assets/images/brands assets/images/schools assets/images/brand
git status --short | head -5
```
Verify only new asset files in the staging area.

```bash
git commit -m "$(cat <<'EOF'
Phase 1b: bulk-copy assets from ios-final

Adds assets/images/brands/ (40 brand logos: adidas, nike, jordan,
gatorade, puma, …), assets/images/schools/ (7 schools: duke, lsu,
notre-dame, rutgers, syracuse, texas, usc), and brand variant
subdirs (circle, effects, light, mono, pattern, polished, rounded,
transparent, watermark) for per-role views in Phase 2.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 1c — Fix asset breakage

### Task 11: Diagnose simulator state after deletions + asset copy

**Files:** none — diagnosis only.

- [ ] **Step 11.1: Ask user to reload sim and report**

Tell the user: "Reload the simulator. Tell me what you see for each role view (Coach, Athlete/Player, Brand, Fan, Agent, School, NIL Manager): does the home screen render? Does the avatar show a real image, default gray placeholder, or blank? Any red-screen?"

Wait for user report. Record symptoms per role.

- [ ] **Step 11.2: Audit `require()` paths in role views**

Run:
```bash
cd /Users/arshiarahnavard/proslync-mobile-app-v1
grep -rn "require('@/assets/images" components/ app/ --include='*.tsx' --include='*.ts'
```
For each `require('@/assets/images/<path>')`, verify the file exists at `assets/images/<path>`. Build a list of broken paths.

- [ ] **Step 11.3: For each broken path, decide the fix**

For every broken `require()`:
- If the role has a real asset in ios-final we haven't copied — copy it.
- If no asset exists in either repo — repoint the `require()` to `@/assets/images/default-avatar.png`.

Compile a fix list (path → resolution). Show the list to the user; wait for "go" before applying.

### Task 12: Apply asset breakage fixes

**Files:** modify per-role view files per Step 11.3 fix list. Typical files: `components/brand/brand-view.tsx`, `components/fan/fan-view.tsx`, `components/agent/agent-view.tsx`, `components/school/school-view.tsx`, `components/nil-manager/nil-manager-view.tsx`, `components/coach/coach-view.tsx`.

- [ ] **Step 12.1: Apply each fix from Step 11.3 via Edit tool**

For each entry on the fix list, use the Edit tool to change the `require(...)` path. Group edits by file. Example:

```tsx
// before
<Image source={require('@/assets/images/default-avatar.png')} style={styles.headerPillAvatar} />
// after — if we now have brand/transparent/nike.svg
<Image source={require('@/assets/images/brand/transparent/nike.svg')} style={styles.headerPillAvatar} />
```

- [ ] **Step 12.2: If red-screen cause was identified in Task 0, fix it now**

Apply the targeted fix for the red-screen error captured in Step 0.2. This may be a missing import, a bad provider reference, or an asset path. Describe the fix to the user before committing.

- [ ] **Step 12.3: Run `tsc --noEmit`**

Run: `cd /Users/arshiarahnavard/proslync-mobile-app-v1 && npx tsc --noEmit 2>&1 | head -40`
Expected: zero errors.

### Task 13: Commit asset fixes

- [ ] **Step 13.1: Commit**

Run:
```bash
cd /Users/arshiarahnavard/proslync-mobile-app-v1
git add -A
git commit -m "$(cat <<'EOF'
Phase 1c: fix asset breakage in simulator

Repoints broken require() paths in role-views and resolves red-screen
crash captured pre-deletion. Roles without dedicated avatars fall
back to default-avatar.png (real avatars land per-role in Phase 2).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 13.2: Ask user to reload and confirm**

Tell the user: "Reload sim. Expected: no red-screen, each role's home screen renders with either a real or fallback avatar. Walk through all 7 roles. Report any remaining breakage."

If user reports persistent breakage, loop back to Task 11. Don't proceed to Phase 1d until sim is stable.

---

## Phase 1d — API foundation + VPS env

### Task 14: Replace `lib/config.ts`

**Files:**
- Modify: `lib/config.ts`

- [ ] **Step 14.1: Inspect ios-final's `lib/config.ts`**

Run: `cat /Users/arshiarahnavard/proslync-app-ios-final/lib/config.ts`
Expected: the 3-mode `mock`/`fallback`/`live` switch already documented in the spec.

- [ ] **Step 14.2: Replace v1's config wholesale, merging back v1's livekit/mapbox/stripe blocks**

Write `/Users/arshiarahnavard/proslync-mobile-app-v1/lib/config.ts` with the following content:

```ts
// Environment-based configuration
// All public env vars must be prefixed with EXPO_PUBLIC_

type ApiMode = "mock" | "fallback" | "live";

const explicitApiBaseUrl =
  process.env.EXPO_PUBLIC_PROSLYNC_API_BASE_URL ||
  process.env.EXPO_PUBLIC_API_URL ||
  "";
const requestedApiMode = process.env.EXPO_PUBLIC_PROSLYNC_API_MODE?.toLowerCase();
const localApiBaseUrl = "http://localhost:3020";
const shouldUseLocalBackend = requestedApiMode === "local";
const apiMode: ApiMode =
  requestedApiMode === "live"
    ? "live"
    : requestedApiMode === "fallback" || shouldUseLocalBackend || explicitApiBaseUrl
      ? "fallback"
      : "mock";

const PROD_API_URL =
  explicitApiBaseUrl ||
  (shouldUseLocalBackend ? localApiBaseUrl : "https://status-social-api-dev-699705646196.us-east4.run.app");
const PROD_WS_URL =
  process.env.EXPO_PUBLIC_WS_URL ||
  "wss://status-social-api-dev-699705646196.us-east4.run.app";

const explicitFanBaseUrl =
  process.env.EXPO_PUBLIC_PROSLYNC_FAN_API_BASE_URL || "";
const fanBaseUrl = explicitFanBaseUrl || localApiBaseUrl;

const explicitProBaseUrl =
  process.env.EXPO_PUBLIC_PROSLYNC_PRO_API_BASE_URL || "";
const proBaseUrl = explicitProBaseUrl || localApiBaseUrl;

export const features = {
  channels: apiMode !== "mock",
};

export const config = {
  api: {
    baseUrl: PROD_API_URL,
    fanBaseUrl,
    proBaseUrl,
    timeout: 10000,
    mode: apiMode,
    networkEnabled: apiMode !== "mock",
    fallbackToMock: apiMode !== "live",
  },
  websocket: {
    url: shouldUseLocalBackend ? "ws://localhost:3020" : PROD_WS_URL,
    enabled: false,
  },
  auth: {
    tokenKey: "accessToken",
    refreshTokenKey: "refreshToken",
  },
  stripe: {
    publishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
  },
  mapbox: {
    accessToken: process.env.EXPO_PUBLIC_MAPBOX_TOKEN || "",
  },
  livekit: {
    serverUrl: process.env.EXPO_PUBLIC_LIVEKIT_URL || "wss://status-test-c1ki6pp2.livekit.cloud",
  },
} as const;

export type Config = typeof config;
```

- [ ] **Step 14.3: `tsc --noEmit` clean**

Run: `cd /Users/arshiarahnavard/proslync-mobile-app-v1 && npx tsc --noEmit 2>&1 | head -40`
Expected: zero errors. The added `config.api.mode`, `fanBaseUrl`, `proBaseUrl`, `networkEnabled`, `fallbackToMock` properties are additive — no existing v1 code reads them, so no breakage.

### Task 15: Drop in proslync API client foundation

**Files:**
- Create: `lib/api/proslync.ts` (copy from ios-final)
- Create: `lib/api/proslync-spines.ts` (copy from ios-final)
- Create: `lib/api/errors.ts` (REPLACE v1's existing one with ios-final's)
- Modify: `lib/api/client.ts` (REPLACE v1's with ios-final's, then re-merge any v1-only domain mounting)
- Create: `lib/api/_internal/.gitkeep`

- [ ] **Step 15.1: Audit v1's existing `client.ts` and `errors.ts` for unique additions**

Run:
```bash
diff /Users/arshiarahnavard/proslync-mobile-app-v1/lib/api/client.ts /Users/arshiarahnavard/proslync-app-ios-final/lib/api/client.ts | head -80
diff /Users/arshiarahnavard/proslync-mobile-app-v1/lib/api/errors.ts /Users/arshiarahnavard/proslync-app-ios-final/lib/api/errors.ts | head -40
```
Note any v1-only methods on the `ApiClient` class (e.g., `setRefreshHandler`, token-refresh queue, retry logic). These need to be preserved when replacing.

- [ ] **Step 15.2: Copy ios-final's foundation files into v1**

Run:
```bash
cp /Users/arshiarahnavard/proslync-app-ios-final/lib/api/proslync.ts /Users/arshiarahnavard/proslync-mobile-app-v1/lib/api/proslync.ts
cp /Users/arshiarahnavard/proslync-app-ios-final/lib/api/proslync-spines.ts /Users/arshiarahnavard/proslync-mobile-app-v1/lib/api/proslync-spines.ts
cp /Users/arshiarahnavard/proslync-app-ios-final/lib/api/errors.ts /Users/arshiarahnavard/proslync-mobile-app-v1/lib/api/errors.ts
cp /Users/arshiarahnavard/proslync-app-ios-final/lib/api/client.ts /Users/arshiarahnavard/proslync-mobile-app-v1/lib/api/client.ts
mkdir -p /Users/arshiarahnavard/proslync-mobile-app-v1/lib/api/_internal
touch /Users/arshiarahnavard/proslync-mobile-app-v1/lib/api/_internal/.gitkeep
```

- [ ] **Step 15.3: If v1's `client.ts` had unique additions per Step 15.1, manually port them**

Open `lib/api/client.ts` (now ios-final's version). For each v1-unique method noted in Step 15.1, add it back to the class. If the method's role is duplicated by ios-final code (e.g., both have token refresh), keep ios-final's — it's the canonical pattern. If unique (e.g., a v1 retry-with-backoff helper not in ios-final), append.

- [ ] **Step 15.4: Fix downstream import shape**

The remaining v1 domain APIs (`lib/api/auth.ts`, `analytics.ts`, `chat.ts`, `notifications.ts`, `posts.ts`, `users.ts`, `wallet.ts`, `payments.ts`, `search.ts`, `engagement.ts`, `feed`(?), `channels.ts`, `files.ts`, `follows.ts`, `locations.ts`, `apple-messages.ts`, `admin.ts`, `calls.ts`, `spotify.ts`, `preferences.ts`) import `apiClient` from `./client`. ios-final's `client.ts` exports a default `apiClient` instance with the same name. Verify:

Run: `grep -l "from ['\"]./client['\"]" /Users/arshiarahnavard/proslync-mobile-app-v1/lib/api/*.ts | xargs head -3 | grep -B1 "from"`

If imports break, fix them with Edit. Most likely they continue working — ios-final's contract is intentionally compatible.

- [ ] **Step 15.5: Update `lib/api/index.ts` to also export proslyncApi**

Add to `lib/api/index.ts`:
```ts
export { proslyncApi } from './proslync';
export { proslyncSpinesApi } from './proslync-spines';
```

- [ ] **Step 15.6: `tsc --noEmit` clean**

Run: `cd /Users/arshiarahnavard/proslync-mobile-app-v1 && npx tsc --noEmit 2>&1 | head -80`
Expected: zero errors. If errors, the most likely cause is a method signature mismatch on `apiClient` — fix by updating the calling site (a v1 domain API) to match ios-final's signature.

### Task 16: Create `.env.local` + verify ATS

**Files:**
- Create: `.env.local`
- Modify (if needed): `app.json`

- [ ] **Step 16.1: Verify `.env.local` is gitignored**

Run: `cd /Users/arshiarahnavard/proslync-mobile-app-v1 && grep -E '^\.env(\.local)?$' .gitignore`
Expected: at least `.env.local` or `.env*` matched. If not, append `.env.local` to `.gitignore` and commit separately.

- [ ] **Step 16.2: Write `.env.local`**

Create `/Users/arshiarahnavard/proslync-mobile-app-v1/.env.local` with:

```
EXPO_PUBLIC_PROSLYNC_API_BASE_URL=http://209.142.66.121:3055
EXPO_PUBLIC_PROSLYNC_API_MODE=fallback
EXPO_PUBLIC_PROSLYNC_FAN_API_BASE_URL=http://209.142.66.121:3055
EXPO_PUBLIC_PROSLYNC_PRO_API_BASE_URL=http://209.142.66.121:3055
```

`fallback` mode (not `live`) is deliberate: VPS gap-analysis shows 7+ critical routes missing, and `fallback` lets the demo keep working with `[mock]` data while real routes hit live.

- [ ] **Step 16.3: Verify ATS exception in `app.json`**

Run: `grep -A3 NSAllowsArbitraryLoads /Users/arshiarahnavard/proslync-mobile-app-v1/app.json`
Expected: `"NSAllowsArbitraryLoads": true` present. If missing, edit `app.json` and add under `expo.ios.infoPlist.NSAppTransportSecurity`:
```json
"NSAppTransportSecurity": {
  "NSAllowsArbitraryLoads": true
}
```

### Task 17: Create `_dev/health.tsx` smoke screen

**Files:**
- Create: `app/_dev/_layout.tsx`
- Create: `app/_dev/health.tsx`

- [ ] **Step 17.1: Create `_dev/_layout.tsx`**

Write `/Users/arshiarahnavard/proslync-mobile-app-v1/app/_dev/_layout.tsx`:

```tsx
import { Stack } from "expo-router";

export default function DevLayout() {
  return (
    <Stack screenOptions={{ headerShown: true, headerTintColor: "#fff", headerStyle: { backgroundColor: "#000" } }}>
      <Stack.Screen name="health" options={{ title: "VPS Health" }} />
    </Stack>
  );
}
```

- [ ] **Step 17.2: Create `_dev/health.tsx`**

Write `/Users/arshiarahnavard/proslync-mobile-app-v1/app/_dev/health.tsx`:

```tsx
import { useEffect, useState } from "react";
import { ScrollView, Text, View, StyleSheet, ActivityIndicator } from "react-native";
import { DarkGradientBg } from "@/components/shared/dark-gradient-bg";
import { proslyncApi } from "@/lib/api/proslync";
import { config } from "@/lib/config";

export default function HealthScreen() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await proslyncApi.getBackendHealth();
        if (!cancelled) setData(result);
      } catch (err: any) {
        if (!cancelled) setError(err?.message ?? String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <View style={styles.container}>
      <DarkGradientBg />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.h1}>VPS Health</Text>
        <Text style={styles.dim}>Mode: {config.api.mode}</Text>
        <Text style={styles.dim}>Base URL: {config.api.baseUrl}</Text>
        {loading && <ActivityIndicator color="#fff" style={{ marginTop: 24 }} />}
        {error && (
          <View style={styles.errBox}>
            <Text style={styles.errText}>Error: {error}</Text>
          </View>
        )}
        {data && (
          <View style={{ marginTop: 16 }}>
            <Text style={styles.kv}>service: {data.service}</Text>
            <Text style={styles.kv}>version: {data.version}</Text>
            <Text style={styles.kv}>mode: {data.mode}</Text>
            <Text style={styles.kv}>endpoints: {Array.isArray(data.endpoints) ? data.endpoints.length : "?"}</Text>
            {Array.isArray(data.endpoints) && data.endpoints.map((ep: any, i: number) => (
              <Text key={i} style={styles.ep}>• {typeof ep === "string" ? ep : `${ep.method ?? ""} ${ep.path ?? JSON.stringify(ep)}`}</Text>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  scroll: { padding: 16, paddingBottom: 64 },
  h1: { color: "#fff", fontSize: 22, fontWeight: "700", marginBottom: 8 },
  dim: { color: "#888", fontSize: 13, marginBottom: 2 },
  kv: { color: "#fff", fontSize: 14, marginVertical: 1 },
  ep: { color: "#bbb", fontSize: 12, marginLeft: 8, marginVertical: 1 },
  errBox: { backgroundColor: "rgba(255,80,80,0.15)", borderWidth: 1, borderColor: "rgba(255,80,80,0.4)", padding: 12, borderRadius: 8, marginTop: 16 },
  errText: { color: "#ff9b9b", fontSize: 13 },
});
```

- [ ] **Step 17.3: Confirm `proslyncApi.getBackendHealth` exists**

Run: `grep -n "getBackendHealth" /Users/arshiarahnavard/proslync-mobile-app-v1/lib/api/proslync.ts`
Expected: a method definition. If missing, the ios-final copy was incomplete — re-run Task 15.2.

### Task 18: Register `_dev/health` in `app/_layout.tsx`

**Files:**
- Modify: `app/_layout.tsx`

- [ ] **Step 18.1: Add Stack.Screen entry**

In `RootLayoutNav()`, just before `<Stack.Screen name="modal" .../>`, insert:

```tsx
<Stack.Screen name="_dev/health" options={{ headerShown: true, title: "VPS Health" }} />
```

(Or use the route group form `<Stack.Screen name="_dev" />` — expo-router will pick up the nested `_layout.tsx`. Either works; the nested-group form is preferred since we'll add more _dev screens in Phase 2.)

```tsx
<Stack.Screen name="_dev" />
```

### Task 19: `tsc --noEmit` clean + commit API foundation

- [ ] **Step 19.1: `tsc --noEmit`**

Run: `cd /Users/arshiarahnavard/proslync-mobile-app-v1 && npx tsc --noEmit 2>&1 | head -40`
Expected: zero errors.

- [ ] **Step 19.2: Commit**

Run:
```bash
cd /Users/arshiarahnavard/proslync-mobile-app-v1
git add -A
git status --short | head -10
```
Verify modified: `lib/config.ts`, `lib/api/client.ts`, `lib/api/errors.ts`, `lib/api/index.ts`, `app/_layout.tsx`; new: `lib/api/proslync.ts`, `lib/api/proslync-spines.ts`, `lib/api/_internal/.gitkeep`, `app/_dev/_layout.tsx`, `app/_dev/health.tsx`. `.env.local` should NOT appear (gitignored).

```bash
git commit -m "$(cat <<'EOF'
Phase 1d: API foundation + VPS env

Replaces lib/config.ts with ios-final's 3-mode mock/fallback/live
switch. Adds proslyncApi + proslyncSpinesApi typed clients with the
canonical ApiClient. Wires .env.local (gitignored) to the live VPS
at 209.142.66.121:3055 in fallback mode. Adds _dev/health smoke
screen rendering the VPS contract manifest as end-to-end proof.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 1e — Exit gate

### Task 20: Simulator verification + Phase 1 sign-off

**Files:** none.

- [ ] **Step 20.1: Ask user to verify VPS reachability**

Tell the user: "Reload sim. Navigate to `/_dev/health` (you may need to type the URL manually in expo-router's dev URL bar, or temporarily add a button on a home screen). Expected: the screen shows `service: proslync-core-api`, `version: 0.1.0`, `mode: product-core`, and a list of ~27 endpoints (matches what's in memory). If you see an error, paste the error message back."

Wait for user confirmation.

- [ ] **Step 20.2: Verify simulator still cold-boots clean**

Tell the user: "Force-quit and re-launch the app from the simulator's home screen (not just reload). Walk through each role's home screen one more time. Confirm: no red-screen, no crash on cold-boot, avatars render."

- [ ] **Step 20.3: Mark Phase 1 complete**

Once Steps 20.1 and 20.2 pass, update the memory:

Edit `/Users/arshiarahnavard/.claude/projects/-Users-arshiarahnavard-proslync-mobile-app-v1/memory/project_four_stream_integration_plan.md`:
- Mark streams A, B, C as complete (date: today).
- Note Phase 1 commit range and that Phase 2 per-role plans get written next.

Tell the user: "Phase 1 complete. Ready to write Phase 2 plans. Order will be athlete → brand → school → coach → NIL manager → agent → fan (per spec). Want me to write the athlete-role plan now, or pause?"

---

## Self-Review (executed during plan writing)

**Spec coverage:**
- Phase 1a (residue deletion) → Tasks 1–6 ✓
- Phase 1b (asset bulk-copy) → Tasks 7–10 ✓
- Phase 1c (asset breakage fix) → Tasks 11–13 ✓
- Phase 1d (config rewrite + API client foundation + .env.local + ATS + health screen) → Tasks 14–19 ✓
- Phase 1e (exit gate) → Task 20 ✓
- Phase 2 (per-role increments) → not in this plan, deferred to per-role plans written after Phase 1 lands.

**Placeholder scan:** the only intentional deferrals are (1) per-role real avatars (handled in Phase 2 per spec) and (2) the exact red-screen fix in Step 12.2, which depends on user-captured baseline from Step 0.2 — this is necessarily an unknown until the sim reports it. Documented as such, not a placeholder.

**Type consistency:** `apiClient`, `proslyncApi`, `proslyncSpinesApi`, `config.api.mode`, `config.api.baseUrl` used consistently. `getBackendHealth` is referenced once in Task 17.2 and verified to exist in Step 17.3.

**Risk:** Step 15.1's diff check is the riskiest moment — if v1's `client.ts` has accumulated unique logic and Step 15.3 misses re-porting it, downstream domain APIs may break silently. Mitigation: `tsc --noEmit` after every step catches signature mismatches.
