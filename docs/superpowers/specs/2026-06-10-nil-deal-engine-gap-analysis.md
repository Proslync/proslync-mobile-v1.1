# NIL Deal Management PRD v1.0 — Gap Analysis, Domain Critique & Execution Plan

**Date:** 2026-06-10 · Inputs: PRD v1.0 (May 2026), full codebase deep-dive, fresh domain research (CSC/NIL Go/competitors/regulatory, mid-2026)

## A. Does the app carry the PRD functionality today?

| PRD area | Coverage | What exists | What's missing |
|---|---|---|---|
| 3.1 Contract engine + e-signature | ~10% | `BrandContractTerm` type (deliverables, payout schedule, clauses); deal stage enums (draft→sent→negotiation→signed→live) | No template library, no template versioning, no drafting UI, no e-signature capture, no plain-language summary, no Deal ID format |
| 3.2 Milestone escrow + disbursement | ~70% modeled / ~15% functional | `RevShareLedger` three-way split fully typed (platform/school/athlete, House-cap-aware); athlete payouts screen w/ projected/pending/paid/held; closing-room UI has an escrow step + "Release escrow" button (non-functional); tiered platform fee (7/5/4%) in fixtures | No milestone registry/achievement tracking, no 72h auto-approve timer, no funding-before-countersign gate, no refund math, button does nothing |
| 3.3 CSC audit trail + disclosure export + NIL Go | ~60% | `ComplianceDisclosure` modeled on the NIL Go exemplar with append-only `actionHistory` (created→…→csc-submitted), three-track review (NCAA/school/ethics), export-packet builder + receipt API (simulated), AD compliance room with SLA pills | No PDF generation, no real submission flow, SLA timers are fixture text, no Associated-Entity flagging logic, no institution-level date-range export |
| 5. Dispute resolution | ~5% | `disputed` enum states on deals and ledger entries | No dispute case object, no 72h/48h ladder, no admin determination, no appeal |
| 2. Roles & permissions | ~85% | Six roles incl. NIL Manager; `PermissionGrant` w/ scopes, levels, audit, expiry; per-role deal "lens" views | Field-level redaction (already planned as future) |
| Notifications/status workflow | ~20% | Stage enums; disclosure action history | No deal-event notification types, no transition triggers |

**Verdict: the data models are remarkably PRD-shaped — the verbs are missing.** The app can *show* nearly everything the PRD describes and *do* almost none of it. Strongest extension points: RevShareLedger, ComplianceDisclosure+actionHistory, PermissionGrant, deal lenses.

## B. Is the product smart? (domain critique, sourced in research)

**Smart and differentiated:**
1. **Escrow is the real wedge.** No incumbent (Opendorse, Teamworks/INFLCR, Basepath, Athliance, Icon Source) offers funds-secured-before-work; post-House reneging by collectives is a documented pain. This is the hero feature.
2. **Audit-trail-first design** matches where the market is going: CSC has rejected 711 deals / $29.3M (through Feb 2026); rejected deals go to arbitration — an "arbitration-ready evidence pack" is cheap for us and unique.
3. **The disclosure module already mirrors the NIL Go exemplar** — ahead of most competitors' athlete-side UX.

**Where the PRD is wrong or dangerous (fix before anyone external sees it):**
1. **The 3% institution fee is the most dangerous line in the document.** It risks state-law bans on schools taking NIL cuts, strengthens Associated-Entity characterization ("directed or requested" test, CSC Apr 2026 guidance), and raises Title IX allocation issues. Replace with school-side SaaS licensing.
2. **A 12% athlete-side haircut loses the marketing war.** Opendorse charges brands 30% and advertises "athletes keep 100%"; INFLCR is 0%. Charge the brand side (10–15%), let athletes keep 100%.
3. **"FDIC-insured accounts" + holding funds = money transmission licensing in 49 states.** The viable v1 is an FBO structure via a licensed partner (Stripe Treasury/Connect): "FDIC pass-through eligible," never touching funds. Rewrite §3.2.1 and §4 Compliance accordingly.
4. **NIL Go has no public API** — period (portal-only; ~5 compliance seats per school; athletes self-submit). §3.3.3 Phase 2 "automated API submission" should become "pre-filled submission packet + 5-business-day deadline tracking + status logging," with API integration contingent and unpromised.
5. **Don't conflate the $600s.** CSC reporting floor = $600/5 business days (true). But the 1099-NEC threshold moved to **$2,000** for 2026 payments (OBBBA, July 2025) — and "tax out of scope" is untenable once you run the payout rail (Basepath bundles 1099s).
6. **"CSC-compliant" must be a versioned rules engine, not constants.** The Associated-Entity definition is in live litigation (Apr 2026 motion; Nebraska–Playfly arbitration decided for CSC June 2026; 17-state class action; Trump EO demanding new guardrails by Aug 2026). The PRD itself flags this; the architecture must too.
7. **Market shape:** median NIL deal ≈ $60 (below the CSC floor); 78% of cleared *value* is Associated-Entity money. Tier the product: zero-friction path for micro-deals, full escrow+compliance rail for ≥$600, enhanced AE workflow for collective-scale deals.
8. **72h auto-approve is defensible** (Fiverr 3d; Upwork 14d) for post-type deliverables; longevity deliverables ("post stays live 30 days") need milestone definitions that outlive the timer.
9. **Minors:** 41 states allow HS NIL; contracts voidable, parental co-sign required — at minimum model a co-signer in the e-sign flow.
10. **Biggest product opportunity not in the PRD: pre-clearance.** NIL Go accepts pre-execution submission and clears 50% within 24h. A "will this clear?" check (business purpose, activation, comp-range benchmarks — exactly the three CSC tests, and exactly what the Nebraska ruling punished) that gates escrow funding turns the $29M-rejected problem into the product's front door.

## C. Execution plan (demo-app scope: visible on the phone, fixture-backed, VPS-ready shapes)

Phased so each lands on the device independently. All flows fixture-driven like the rest of the app; types mirror PRD so the real backend can adopt them.

**Phase D1 — Deal Engine spine (the wow demo): contract → sign → escrow → milestones → payout, one continuous flow**
- `lib/types/deal-engine.types.ts`: `ContractTemplate` (5 PRD types, versioned), `DealContract` (Deal ID `PSY-YYYY-XXXXXXXX`, required fields per §3.1.1), `EscrowAccount` (funded/held/released, FBO language), `Milestone` (description, due, deliverable type, verification method, amount, status incl. 72h deadline), `DisputeCase` (§5 ladder), `DealEvent` (append-only audit feed per §3.3.1).
- New flow screens: `app/deal/new.tsx` (template pick → prefilled fields → plain-language summary → sign), native signature capture (draw-to-sign + typed name + timestamp/IP record into the audit feed), brand-side fund-escrow step (mock), milestone board on `app/deal/[id]` with submit-completion (athlete lens) / approve-dispute w/ live 72h countdown (brand lens), auto-approve when timer lapses, disbursement entry w/ fee math (brand-side fee model per §B; configurable constants).
- Audit trail tab on the deal: every event, append-only, with actor/timestamp/IP.

**Phase D2 — Compliance rail: pre-clearance + CSC packet**
- "Will this clear?" pre-check on deal creation: the three CSC tests as a scored checklist (valid business purpose, real activation, comp range vs `lib/data/mock-deal-comps.ts` benchmarks) + Associated-Entity flag (collective/booster/MMR partner entity types) with enhanced-review banner.
- Real PDF export via `expo-print` for the disclosure packet (replaces the simulated receipt), plus structured JSON; deadline tracker chip ("submit to NIL Go by <date>" = execution + 5 business days) on every ≥$600 deal; institution-level export entry in school compliance room.
- Versioned rules: `lib/compliance/rules-2026-06.ts` so AE-definition changes are a file, not a refactor.

**Phase D3 — Dispute resolution + notifications**
- DisputeCase workflow per §5 (brand dispute reason → athlete 48h response → admin determination → logged outcome) on the milestone board; NIL deal notification types (stage-change, milestone-due, escrow-funded, auto-approve-imminent, CSC-flagged) wired into the existing NotificationSheet.

**Phase D4 — PRD v1.1 edits** (document, not code): fee model rewrite, FBO language, NIL Go posture, $2,000 1099 note, minors/co-sign, pre-clearance feature, rules-engine requirement.

Estimated: D1 is the big one (new flow screens + types); D2/D3 build on it. Each phase ships to the phone via the existing dev-build loop and rides into TestFlight builds.
