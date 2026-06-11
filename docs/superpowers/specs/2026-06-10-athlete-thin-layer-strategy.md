# Athlete Section Strategy — The Thin Truth Layer

**Date:** 2026-06-10 · **Status:** Draft for Arshia review · Inputs: three research passes (athlete pains, dashboard behavior/app reviews, direction validation incl. competitive + rails-vs-tracker precedents)

## 1. The decision

The athlete section's job is NOT a dashboard athletes live in. Athletes open NIL apps **event-driven** — when a deal lands, a deadline nears, or money moves — and they come for three answers:

1. **"Did I get paid / when will I be?"**
2. **"What do I owe somebody?"** (deliverables + NIL Go disclosures)
3. ~~"Anything new for me?"~~ — cut from v1 (an offers feed without deal supply is an empty room; returns when marketplace supply exists)

We build a **thin truth layer**: a small always-visible strip on the existing athlete tabs + deep-linking notifications. No new hub screen (the "Today" command-center was built, reviewed, user-tested on device, and rejected — lesson recorded).

## 2. Why this direction is right (validated 2026-06-10)

- **Payment limbo is structural, not anecdotal.** Players Era payouts still unpaid 2.5+ months post-event, stuck in CSC review; active litigation; schools and agents publicly chasing money. A truthful per-deal payment state is materially useful *today*.
- **The disclosure clock is existential.** NIL Go: deals ≥$600 must be reported within 5 business days; failure → immediate ineligibility (2-day cure). 711 deals / $29.3M already not cleared. A countdown with reminders is eligibility insurance — the strongest problem/solution fit in the entire athlete space.
- **Tracking-first → rails-second is the proven sequence.** Shopify/Toast/Mindbody wedged with workflow and monetized payments later (now the majority of their revenue). Rails-first creator fintechs stagnated. The thin layer is the validated front door to Proslync escrow.
- **Demand caveat (honest):** the loudest "where's my money" voices on record are schools, agents, and plaintiffs' lawyers — not a grassroots athlete chorus. Athlete willingness-to-adopt is an assumption to test with the demo, not settled fact.

## 3. The Three-State Truth Rule (non-negotiable)

A tracker that doesn't own the payment rail may only assert what it can verify:

| State | Source | Truthful? |
|---|---|---|
| **Expected** | contract terms / athlete entry (amount, schedule) | Yes, labeled as expectation |
| **In CSC review** | NIL Go clearance state (submitted/under review/cleared/denied) | Yes — and it's the dominant cause of 2026 payment delays; nobody surfaces this to athletes |
| **Paid ✓** | bank-confirmed (Plaid link; known caveats: pending/posted lag, 90-day history on some banks) | Yes |

**Never** display payer intent ("arriving Friday") as fact. Self-reported pay-date trackers die of stale data (the NilBoard failure mode). "Overdue" renders as an **action** — "Nudge payer" / "Escalate" — never as a claim about the payer.

## 4. v1 scope (fixture-backed demo first, shapes mirror reality)

1. **NIL Go countdown chip** — per executed deal ≥$600 not yet disclosed: "Report to NIL Go · 3 days left" (red <24h, amber <72h — the app-wide thresholds). Tap → disclosure flow (existing screens). THE hero feature.
2. **Per-deal payment truth row** — expected → in CSC review → paid ✓; per deal in the Deals tab + aggregate in a thin strip on the athlete view's default tab (one line: `$2,400 expected · 1 in review · last paid Jun 2 ✓`).
3. **Deliverable deadlines** — date-stamped to-dos with reminders, from contract/deal records.
4. **Tax set-aside** — a number on every confirmed payment (est. SE+fed %, conservative), shown in Wallet. A number, not advice.
5. **Notifications** — each of the above emits one notification that deep-links directly to the item (event-driven usage is the reality; the notification IS the front door).

UI shape: a compact strip + status rows inside existing tabs (Stats default keeps its place; Deals and Wallet get the truth states). No new tab. Copper only on act-now elements. Tabular numerals on all money; money never animates.

## 5. Why it's defensible (only as a sequence)

The thin layer alone is **a feature, not a product** — NilBoard already ships a self-report version; Teamworks (≈90% of D-I NIL deal touchpoints post-Basepath) could bundle one. Durability comes from what the front door opens into:

- Every **"overdue"** → the escrow pitch: "Route the next deal through Proslync — funds locked before work, this can't happen." (Deal Engine, PRD phase D1.)
- Every **contract upload** → Deal Guardian red-flag review (buyout/perpetuity/agent-fee clauses vs benchmarks) — the unsolved athlete pain tracking can't touch.
- Every **cleared/denied outcome** → the FMV comparables database (the arbitration-grade comp oracle nobody owns).
- The same deal record powers the collective/AD Pre-Clearance Copilot — one audit-grade spine, four buyers.

## 6. Explicitly cut from v1

- Offers/marketplace feed (no supply yet) · valuation scores (athletes ignore them) · education modules (ignored) · the Today hub (rejected on device) · fabricated pay dates (three-state rule) · real Plaid integration (demo uses fixture "bank-confirmed" states; Plaid is the first real-data milestone).

## 7. Success test for the demo

Show an athlete (or play one): a deal executes → countdown chip appears → disclosure done → state flips to "in review" → "cleared" → "paid ✓" with tax set-aside shown — the whole story in under a minute on the phone. If that story doesn't feel indispensable, we learned it cheap.
