---
title: v1 ← iOS-final fusion + live VPS backend wiring
date: 2026-05-18
status: draft
owner: arshia
---

# v1 ← iOS-final fusion + live VPS backend wiring

## Goal

Bring `~/proslync-mobile-app-v1` (the `arshia` branch, currently the active line and what Metro serves to simulator) up to NIL-product parity with `~/proslync-app-ios-final`, wired to the live VPS backend at `http://209.142.66.121:3055`. v1 stays the active codebase; ios-final feeds in as the source of API surface, typed clients, missing screens, and asset library. `proslync-mobile-v1.1` (the iOS-final fork on Desktop) is **not** in scope and remains an alternative line not touched by this work.

Execution is continuous (no phase-approval gates) but ordered into a foundation phase plus per-role increments so each commit is independently debuggable.

## Non-goals

- Native `ios/` / `android/` directory restructure. v1's prebuild output stays.
- Production / TestFlight builds. Plain-HTTP VPS with `NSAllowsArbitraryLoads=true` is fine for sim/dev only.
- Web client work (lives in `proslync-web-v1.1`).
- Backend changes on the VPS (Trajan's repo).
- Test suite scaffolding. Verification is simulator-based.
- Forking, restructuring, or merging into `proslync-mobile-v1.1`.

## Verification model

- I write code; Arshia reloads the simulator and reports back. No autonomous sim driving.
- After every commit, `tsc --noEmit` clean (catches dangling imports from the residue deletion).
- Each phase / per-role increment has explicit exit criteria below.

## Architecture overview

Two phases. Phase 1 is one foundation landing; Phase 2 is seven per-role increments.

```
Phase 1 — Foundation (single landing)
  1a. Delete nightclub residue
  1b. Bulk-copy assets from ios-final
  1c. Diagnose + fix asset breakage (gray boxes, wrong-role avatars, red-screen crashes)
  1d. Replace lib/config.ts; drop in ios-final's API client foundation
  1e. Wire .env.local to VPS; verify via /api/health smoke screen

Phase 2 — Per-role increments (order: athlete → brand → school → coach → NIL manager → agent → fan)
  For each role:
    - Copy that role's API files from ios-final
    - Copy that role's hooks
    - Copy that role's screens
    - Wire screens to hooks against live VPS; fallback-to-mock where VPS lacks the route
    - Simulator verify; commit
  Shared infra (role-tab screens, _dev/*, deal/[id], new providers) lands with the first role that needs it.
```

## Phase 1 — Foundation

### 1a. Delete nightclub residue

**Why:** Donor-shape code blocks debugging — broken-asset errors will look identical to dangling-import errors otherwise. Arshia explicitly chose clean-slate.

**Routes deleted (`app/`):**

- `manage-event/*` (entire subtree)
- `manage-venue/*` (entire subtree)
- `event/*` (entire subtree)
- `create-event.tsx`, `edit-event.tsx`, `my-events.tsx`, `my-venues.tsx`
- `create-organization.tsx`
- `venue-profile/*`
- `text-blast-compose.tsx`
- `dashboard.tsx` (donor dashboard root), `dashboard/text-blast.tsx`, `dashboard/text-blast-confirm.tsx`, `dashboard/attendees.tsx`, `dashboard/payments.tsx`, `dashboard/revenue.tsx`, `dashboard/analytics.tsx` (the whole donor dashboard subtree — NIL dashboards live under role-specific paths)
- `wallet.tsx`, `qr-card.tsx`, `scan-qr.tsx`, `tap-to-pay.tsx`
- `admin/events.tsx`
- `live.tsx`
- `stripe-document-upload.tsx`, `stripe-onboarding.tsx` (re-added later only if a NIL screen needs them)

**API files deleted (`lib/api/`):**

`bar-orders.ts`, `bar-tabs.ts`, `events.ts`, `menu.ts`, `pricing.ts`, `tables.ts`, `team.ts`, `text-blasts.ts`, `tickets.ts`, `venues.ts`, `venue-contact-tags.ts`, `venue-schedule.ts`, `artists.ts`, `organizations.ts`, `dashboard.ts`.

**Providers deleted (`lib/providers/`):** `bar-socket-provider.tsx`, `terminal-provider.tsx`. Wallet/stripe providers held pending decision per remaining-imports check.

**Components deleted (`components/`):** `bar/`, `venue/`, `event/` (donor-shape subdirs), `wallet/`, `tables/`, plus any `membership-card`, `apple-wallet`, `google-wallet` components if no remaining importers.

**Hooks deleted:** any in `hooks/` that import a deleted API file. Re-exports in `hooks/index.ts` cleaned.

**Provider composition:** `app/_layout.tsx` cleaned of registrations for deleted providers and routes.

**Mock data deleted (`lib/data/`):** `messages-mock.ts` retained (still used by chat). `wallet-mock.ts` deleted. Other donor mocks reviewed file-by-file.

**Exit criteria:** `npx tsc --noEmit` clean. Simulator boots (may still have asset breakage — that's 1c).

### 1b. Bulk-copy assets from ios-final

**Why:** v1 only has Coach + Athlete (Kiyan) avatars; every other role falls back to `default-avatar.png`. iOS-final has the full brand/school library v1 needs.

**Copied verbatim from `~/proslync-app-ios-final/assets/images/`:**

- `brands/*` — 40 brand logos (`adidas.svg`, `nike.svg`, `jordan.svg`, `gatorade.svg`, `puma.svg`, `red-bull.svg`, …)
- `schools/*` — 7 school logos (`duke.png`, `lsu.png`, `notre-dame.png`, `rutgers.png`, `syracuse.png`, `texas.png`, `usc.png`)
- `brand/{circle,effects,light,mono,pattern,polished,rounded,transparent,watermark}/*` — generated brand variants

**Individual files diff:** any ios-final file newer than v1's wins. v1-only files (`splash-icon.png`, `icon.png`, `favicon.png`, `status_logo.png`, `stadium-iso.png`, `ncaab-bg.png`) preserved.

**Role avatars not in either repo (deferred to per-role port):** real photos for Brand / Fan / Agent / School / NIL Manager. For Phase 1, those roles continue to use `default-avatar.png` — fixing this is a Phase 2 per-role concern.

**Exit criteria:** `assets/images/brands/`, `assets/images/schools/`, `assets/images/brand/` exist with expected file counts. No broken `require()` calls in role-views.

### 1c. Fix asset breakage

**Why:** Arshia reports three symptoms in current sim: gray-box images, wrong-role avatars, red-screen crashes.

**Diagnosis path (executed after 1a + 1b land):**

1. Capture exact red-screen error from simulator on cold load.
2. `grep -rn "require\('@/assets/images/" app/ components/` and verify each path exists.
3. For each role-view, confirm the avatar source matches role identity (current state: Brand/Fan/Agent/School use `default-avatar.png`).
4. Wrap any `require()` of a runtime-derived asset path in a fallback (`try { require(path) } catch { require('default-avatar.png') }`).

**Fixes applied:**

- Each missing `require()` path either restored from ios-final or repointed to `default-avatar.png` as deliberate fallback.
- Wrong-role: Brand/Fan/Agent/School/NIL Manager role-view headers keep `default-avatar.png` for now (real role avatars are Phase 2 per-role work).
- Red-screen: rooted in the specific error captured in step 1. Likely a dangling-import surfaced by Phase 1a — fix at the source.

**Exit criteria:** simulator cold-boots, no red-screen, every role's home screen renders with either a real or fallback avatar.

### 1d. Replace `lib/config.ts` + drop in API client foundation

**Why:** v1's config hardcodes the legacy Cloud Run; the VPS needs the 3-mode env-driven switch ios-final already has.

**Files replaced in v1 with verbatim copies from ios-final:**

- `lib/config.ts` — adds `mode: 'mock' | 'fallback' | 'live'`, `EXPO_PUBLIC_PROSLYNC_API_BASE_URL`, `EXPO_PUBLIC_PROSLYNC_API_MODE`, `fanBaseUrl`, `proBaseUrl`, `networkEnabled`, `fallbackToMock`. Livekit/mapbox/stripe blocks merged from v1.
- `lib/api/client.ts` — adds the `request()` with try/catch + transparent mock-fallback. Domain-API mounting (`apiClient.athletePayouts`, etc.) deferred to per-role land.
- `lib/api/proslync.ts` — typed `proslyncApi` over `/api/health`, `/api/role-spine`, `/api/auth/*`, `/api/athletes`, `/api/brands`, `/api/deals`, `/api/campaigns`, `/api/applications`, `/api/wallet`, `/api/permissions`, `/api/compliance-reviews`, `/api/approval-queue`.
- `lib/api/proslync-spines.ts` — typed `proslyncSpinesApi` over `/api/role-spine/:role` and `/api/home/dashboard?role=`.
- `lib/api/errors.ts` — error class hierarchy.
- `lib/api/_internal/` — empty scaffold for the per-role impl files that arrive in Phase 2.
- `lib/api/index.ts` — re-exports updated.

**Files added:**

- `.env.local` (gitignored) with:
  ```
  EXPO_PUBLIC_PROSLYNC_API_BASE_URL=http://209.142.66.121:3055
  EXPO_PUBLIC_PROSLYNC_API_MODE=fallback
  EXPO_PUBLIC_PROSLYNC_FAN_API_BASE_URL=http://209.142.66.121:3055
  EXPO_PUBLIC_PROSLYNC_PRO_API_BASE_URL=http://209.142.66.121:3055
  ```
  Mode starts at `fallback` (not `live`) because gap-analysis shows 7+ critical routes aren't on VPS yet — `fallback` lets the demo keep working while surfacing real routes opportunistically.

**`app.json` confirmed:**

- `expo.ios.infoPlist.NSAppTransportSecurity.NSAllowsArbitraryLoads = true` (plain HTTP VPS).

**New file:**

- `app/_dev/health.tsx` — calls `proslyncApi.getBackendHealth()`, renders the contract manifest (service, version, roleSpine, endpoints[]). Registered in `app/_layout.tsx`. This is the end-to-end wiring proof.

**Exit criteria:** `tsc --noEmit` clean. Simulator boots. `/(_dev)/health` route loads and shows the live VPS manifest.

### 1e. Phase 1 exit gate

- Simulator cold-boots, no red-screen.
- `/(_dev)/health` shows 27 endpoints from VPS.
- All seven role-views render their home screen with at least a fallback avatar.
- `tsc --noEmit` clean.
- Single commit on `arshia` branch with message `Phase 1: residue cleanup + asset bulk-copy + VPS wiring`.

## Phase 2 — Per-role increments

For each role, the increment consists of: API files, hooks, screens, UI wiring, simulator verify, commit. Increments land in this order so shared infra naturally accumulates with the earliest role that needs it.

### Order: athlete → brand → school → coach → NIL manager → agent → fan

Order rationale: athlete brings the most shared infra (deal/[id], _dev/personas for testing other roles, the role-tabs screens). Fan goes last because the parallel `(fan-tabs)` group is structurally distinct and benefits from everything else being stable first.

### Per-role checklist

For each role X:

1. Copy `lib/api/<role-files>.ts` from ios-final.
2. Copy hooks that depend on those API files.
3. Copy screens under `app/<role>/*` from ios-final.
4. Wire screen-level React Query usage to hooks. Live routes hit VPS; missing routes return ios-final fixtures via `fallbackToMock`.
5. Copy role-specific assets if any (real role avatars, etc.).
6. Update `app/_layout.tsx` route registrations.
7. Mount any new domain APIs on `apiClient` (`apiClient.<role>`).
8. Simulator: Arshia loads role's home screen + 2-3 sub-screens; reports red-screen or visual issues.
9. Commit with message `Phase 2/<role>: <summary>`.

### Athlete (first — also brings shared infra)

- **API:** `athlete-payouts.ts`, `disclosures.ts`, `permission-grants.ts`, `nil-comps.ts`, `open-deals.ts`, `_internal/*-impl.ts` for these.
- **Screens:** `app/athlete/{calendar,comparables/[dealId],disclosures/[id],disclosures/index,opportunities/[id],opportunities/index,payouts,permissions/[id],permissions/index,training-log}.tsx`
- **Shared infra landing with athlete:**
  - `app/(tabs)/{ad,athlete,brand,deals,nil,role}.tsx` — role-tab screens.
  - `app/deal/[id].tsx` — deal detail.
  - `app/_dev/{cache,entities,flags,index,personas,sockets,_layout}.tsx` — persona switcher needed for testing other roles.
  - `lib/providers/{actor-context-provider,impersonation-provider}.tsx`.
- **VPS routes used live:** `/api/athletes`, `/api/permissions`, `/api/applications`, `/api/auth/me`, `/api/dev/login`.
- **Fallback to mock:** `/api/disclosures/*`, `/api/files/presigned-url`, athlete-payouts (no `/api/athletes/:id/payouts` on VPS yet per gap-analysis).
- **Exit criteria:** Persona switcher loads. Athlete home renders live athlete data from VPS. `disclosures/index` renders fixture data with a `[mock]` badge or similar tell.

### Brand

- **API:** `brand.ts`, `brand-companies.ts`, `brand-contracts.ts`, `brand-calendar.ts`.
- **Screens:** `app/brand/{athlete/[id],calendar,casting,checklist,open-deals/[id],profile,search}.tsx`.
- **VPS routes used live:** `/api/brands`, `/api/deals`.
- **Fallback to mock:** `/api/brand-contracts/*`, `/api/brand-companies/*`.
- **Exit criteria:** Brand home shows the 3 seeded brands from VPS. Brand `open-deals/[id]` renders a deal.

### School

- **API:** `school.ts`, `approval-queue.ts`, `compliance-export.ts`, `rev-share.ts`, `risk-reports.ts`.
- **Screens:** `app/school/{approval-queue,compliance-room,rev-share,risk-report}.tsx`.
- **VPS routes used live:** `/api/approval-queue` (GET only), `/api/compliance-reviews`.
- **Fallback to mock:** `/api/rev-share/*` (entire surface missing on VPS — CRITICAL gap), `/api/risk-reports/*` (entire surface missing — CRITICAL gap), `POST /api/approval-queue/:id/{approve,reject,flag}` (mutations not exposed).
- **Exit criteria:** School approval-queue shows live items from VPS. Rev-share and risk-report screens render fixture data with `[mock]` badges. Compliance-room shows live compliance reviews.

### Coach

- **API:** `coach-roster.ts`.
- **Screens:** `app/coach/{nil-watch,practice-plan}.tsx`.
- **VPS routes used live:** `/api/athletes` (filtered by school server-side or client-side).
- **Exit criteria:** Coach roster shows live athletes; nil-watch renders.

### NIL Manager

- **API:** `nil-manager.ts`.
- **Screens:** `app/nil-manager/closing-room.tsx` (v1 already has `nil-manager/athlete/[id].tsx`).
- **VPS routes used live:** `/api/deals`, `/api/approval-queue`.
- **Exit criteria:** Closing-room shows live deals.

### Agent

- **API:** `agent.ts`, `agent-assistant.ts`.
- **Screens:** `app/agent/pipeline.tsx` (v1 already has `agent/athlete/[id].tsx`).
- **VPS routes used live:** `/api/athletes`, `/api/deals`.
- **Exit criteria:** Agent pipeline shows live athlete + deal data.

### Fan (last — structurally distinct)

- **API:** `fan/*` (subdir), `feed.ts`, `social-reach.ts`, `ncaa-api.ts`.
- **Screens:** `app/(fan-tabs)/{dashboard,explore,index,profile}.tsx`, `app/fan/{gameday,link-pro/index,signin/{code,handle,phone}}.tsx`.
- **Providers added:** `fan-auth-provider.tsx`.
- **VPS routes used live:** `/api/feed/foryou?role=fan`, `/api/home/dashboard?role=fan`, `/api/auth/{request-otp,verify-otp}`.
- **Fallback to mock:** `/api/notifications/*` (entire surface missing on VPS).
- **`app/_layout.tsx`:** parallel tab-group `(fan-tabs)` registered alongside `(tabs)`.
- **Exit criteria:** Fan home loads with live VPS feed. Fan OTP signin flow round-trips against VPS.

## Data flow

```
RN screen
  ↓ uses
React Query hook (hooks/use-*.ts)
  ↓ calls
Typed domain API (lib/api/<domain>.ts) or apiClient.<domain>.method()
  ↓ delegates to
apiClient.request<T>(path, opts)
  ↓ branches on config.api.mode
    live      → fetch(`${baseUrl}${path}`) → on success: T; on error: throw
    fallback  → fetch first; on network error or 404 → mockResponse(path) returning fixture
    mock      → never fetches; only mockResponse()
  ↓ on response
Returns ProslyncDataEnvelope<T> | ProslyncPage<T> | ProslyncCollectionEnvelope<T>
  ↓
Hook unwraps `data`, exposes to screen with `isLoading` / `error`
```

## Error handling

- **`apiClient.request()`** retains ios-final's try/catch + fallback. No new try/catch added at screen level for transport errors.
- **Screens** display loading and error states from React Query. No silent failures.
- **Asset `require()`** wrapped in render-time guards where the path is runtime-derived (the current crash class likely comes from a brittle `require()`).
- **Auth refresh** uses ios-final's refresh-token flow; expired tokens trigger one refresh attempt then logout.
- **Mock-fallback tells**: every screen rendering fallback data displays a small `[mock]` badge (top-right corner) so the demo viewer knows what's live vs fixture. Removed automatically when the route goes live on VPS.

## Auth

- Dev-login bypass: `POST /api/dev/login` + `GET /api/dev/users` for the seeded persona picker. Wired into `app/_dev/personas.tsx`. This is the primary sim-testing path.
- Real OTP: `/api/auth/request-otp` → `/api/auth/verify-otp` → bearer token. Stored via `secureTokens` (lib/storage/secure-tokens.ts; copied from ios-final if not in v1). Used by the fan signin flow in Phase 2.
- Token attached to all `apiClient` requests via `Authorization: Bearer <token>` header.

## Testing

No new test infrastructure. Verification is sim-based per the agreed loop:

- Arshia reloads simulator after each commit.
- I report what to tap through; Arshia reports back what worked / what red-screened.
- `tsc --noEmit` after every commit (catches the dangling-import class).
- Phase 1e and per-role exit criteria are the binary pass/fail gates.

## Risks

1. **VPS contract gaps are wide.** 7+ critical routes not on VPS yet (rev-share, risk-reports, disclosures mutations, approval-queue mutations, files/presigned-url, notifications, stripe-connect). Phase 2/school in particular renders mostly fixture data — labeled as `[mock]` to keep the demo honest. Mitigation: explicit `[mock]` badge on every fallback render.
2. **Red-screen root cause unknown.** Won't know until Phase 1a/1b lands and we cold-boot. Plan accommodates capture-and-fix at step 1c.
3. **Managed-vs-prebuild divergence.** v1 has native `ios/` / `android/` dirs; ios-final is managed-Expo-only. Not touching native dirs here; if a copied ios-final screen requires a config-plugin v1 doesn't have, that's a per-role surprise.
4. **TLS posture.** VPS is plain HTTP. `NSAllowsArbitraryLoads=true` is acceptable for sim only — flagged as production-blocker, out of scope.
5. **Residue deletion may hit unexpected imports.** Mitigation: `tsc --noEmit` after each deletion batch.

## File-level inventory (reference)

### Phase 1a — Deletions

**Routes (33 files):** all of `app/manage-event/`, `app/manage-venue/`, `app/event/`, plus `create-event.tsx`, `edit-event.tsx`, `my-events.tsx`, `my-venues.tsx`, `create-organization.tsx`, `venue-profile/[venueId].tsx`, `text-blast-compose.tsx`, `dashboard/text-blast.tsx`, `dashboard/text-blast-confirm.tsx`, `dashboard/attendees.tsx`, `dashboard/payments.tsx`, `wallet.tsx`, `qr-card.tsx`, `scan-qr.tsx`, `tap-to-pay.tsx`, `admin/events.tsx`, `live.tsx`.

**API (15 files):** `bar-orders.ts`, `bar-tabs.ts`, `events.ts`, `menu.ts`, `pricing.ts`, `tables.ts`, `team.ts`, `text-blasts.ts`, `tickets.ts`, `venues.ts`, `venue-contact-tags.ts`, `venue-schedule.ts`, `artists.ts`, `organizations.ts`, `dashboard.ts`.

**Providers (2 files):** `bar-socket-provider.tsx`, `terminal-provider.tsx`. Plus any unreferenced wallet/stripe providers.

### Phase 1b — Bulk-copy

`assets/images/brands/` (40 files), `assets/images/schools/` (7 files), `assets/images/brand/{circle,effects,light,mono,pattern,polished,rounded,transparent,watermark}/`.

### Phase 1d — API foundation copies (6 files)

`lib/config.ts`, `lib/api/client.ts`, `lib/api/proslync.ts`, `lib/api/proslync-spines.ts`, `lib/api/errors.ts`, `lib/api/index.ts` (re-exports). Plus `lib/api/_internal/` (empty dir).

### Phase 2 — API ports (22 files)

`athlete-payouts`, `disclosures`, `permission-grants`, `nil-comps`, `open-deals`, `brand`, `brand-companies`, `brand-contracts`, `brand-calendar`, `school`, `approval-queue`, `compliance-export`, `rev-share`, `risk-reports`, `coach-roster`, `nil-manager`, `agent`, `agent-assistant`, `feed`, `social-reach`, `ncaa-api`, `ai-review`. Plus `_internal/*-impl.ts` for each. Plus subdirs: `fan/`, `explore/`.

### Phase 2 — Screen ports (35 files)

Athlete (10), Brand (7), School (4), Coach (2), NIL Manager (1), Agent (1), Fan (8), shared (role-tabs 6, deal 1, _dev 7).

## Memory note

After spec lands and Phase 1 completes, update `project-v1-vs-ios-final` memory to reflect that v1 is now post-fusion and the divergence is closed. Existing `project-v1-arshia-branch-reality` and `project-four-stream-integration-plan` memories stay accurate.
