# NIL Advance — Flagship Feature Spec

**Date:** 2026-06-14 · **Status:** Spec (pre-build; requires payment rails — Phase 2) · **Companion:** `docs/strategy/2026-06-14-proslync-strategy.md`

## 1. What it is, in one line

Advance an athlete most of a deal's value the moment it **clears NIL Go** but before the payor actually pays — for a small time-based fee — because Proslync is the only system that *knows which receivables are real*.

## 2. Why this is the flagship

- **The #1 pain is payment limbo, not deal-making.** Players Era athletes were unpaid ~2.5 months post-event; collectives bypass NIL Go partly over payment delays; "where's my money" is the loudest recurring complaint.
- **Proslync uniquely can underwrite it.** The ledger (`lib/money/`) + escrow/delayed-payout state + CSC pre-clearance + the FMV engine (`lib/fmv/`) already produce the receivable-quality signal a factor needs: is the deal cleared, is the amount in-range, is the payor reliable, is the deliverable done.
- **It's the rare feature that is need + revenue + retention + moat at once:** hair-on-fire need; direct fee revenue; money-in-hand retention beats any status badge; defensible because rivals lack the cleared-deal data.
- It converts the "ledger" from a passive record into the thing athletes *open the app for*.

## 3. How it works (athlete flow)

1. A deal in the athlete's ledger reaches state **`cleared`** (NIL Go cleared, attested) with a deliverable marked **done**, but payment state is still **`in-review`/`expected`** (payor hasn't remitted).
2. Proslync surfaces an **"Advance available"** offer on that deal: *"Get $X now instead of waiting for [payor]. Fee $Y. You keep the rest when they pay."*
3. Athlete accepts → receives the advance to their linked account (Stripe Connect payout / wallet). Proslync becomes the payee of record for that receivable (assignment of the cleared payment).
4. When the payor pays, the funds settle to Proslync; the athlete already has their money; Proslync nets its fee. If the payor never pays within the window, the loss sits with Proslync (priced into the fee) — never clawed back from the athlete beyond the advance terms.

## 4. Underwriting model (rides on what's already built)

Compute an **Advance Score** per cleared deal from signals we already have:

| Signal | Source (today) | Weight |
|---|---|---|
| Clearance state = cleared (attested) | `lib/money` payment events / attested clearance | hard gate (must be cleared) |
| Deliverable completed + proof captured | deal-engine milestones | hard gate |
| Amount within FMV range | `lib/fmv/fmv-engine` (band = likely) | high |
| Payor payment-reliability (history: % paid, median days-to-pay, escrow-funded-before-work) | brand/collective payment-truth ledger | high |
| Payor type (associated-entity = higher risk/slower) | preclearance `payerEntityType` | medium |
| Deal age / days since cleared | ledger event timestamps | medium |

- **Advance ceiling:** e.g. 80–95% of `amountCents`, scaled by score. Low score → lower % or no offer.
- **Fee:** time-based (factoring-style, ~1–5% per 30 days), shown as a flat dollar figure up front (never an APR surprise). Benchmark: mainstream factoring ~2.5%/30d.
- **The FMV "likely-clear" band and the payor reliability badge are the core underwriting inputs** — this is why FMV + payment-truth were built first.

## 5. What makes it legal/safe (non-negotiable)

- **This is purchasing a receivable (factoring), not lending.** Frame and structure as advance-against-cleared-receivable, with counsel sign-off; avoid constructs that read as a consumer loan (usury/lending-license exposure).
- **Rails are rented:** money movement via Stripe Connect (or BaaS later) — Proslync never holds its own MTL. The advance is a payout from a funded source; the repayment is the assigned receivable settling back.
- **Never claw back from the athlete** beyond the agreed advance/fee; payor non-payment risk is Proslync's (priced in). This keeps Proslync the athlete's advocate, not another party that can dun them.
- **Disclosure:** clear, plain-language terms (amount, fee in dollars, what happens if the payor is late/never pays). Not legal/financial advice boilerplate where required.
- **Eligibility/minors:** gate under-18 athletes (guardian consent); respect state NIL/lending law variance.

## 6. Dependencies (why it's Phase 2, not now)

1. **Real payment rails** (Stripe Connect delayed-payouts + payout API) — must move real money.
2. **Plaid `settled` confirmation** — to know the payor actually paid (close out the advance) and to detect non-payment.
3. **Real cleared-deal data** — the underwriting needs true NIL Go clearance + payor history, not fixtures. Requires the pilot.
4. **Capital source** — the float to fund advances (founder capital, a credit facility, or a factoring partner). This is a business decision, not a build.
5. **Legal sign-off** — receivable-purchase structure, state-by-state.

## 7. What we CAN build now (fixture demo of the flagship)

To make it demoable to a pilot school/collective/investor without rails:
- An **"Advance available"** card on cleared+delivered deals in the athlete ledger, computing the Advance Score + offer (amount, fee) from the existing FMV + payment-truth + milestone fixtures.
- An **accept flow** that simulates the payout and updates the ledger to show the advance event + the later payor settlement netting the fee — all on the event-sourced money model (a "DEMO — payments not enabled" pill, same honesty bar as the rest of the app).
- This proves the loop end-to-end and is the single most compelling thing to show a pilot partner. Build it when we want the demo to *close* a pilot conversation.

## 8. Success test

Show a pilot partner: a deal clears → "$3,800 available now, $95 fee, paid to your account today" → athlete accepts → money lands → weeks later the collective pays and Proslync nets $95 — *the athlete never waited.* If that doesn't make a compliance officer or collective lean in, we learned it cheap.

## 9. Build order when greenlit

1. Fixture demo of the advance loop (above) — to close the pilot.
2. Pilot rails (Stripe Connect payout + Plaid settle + KYC) — Phase 1 infra reused.
3. Underwriting from real cleared-deal + payor-history data.
4. Capital source + legal structure.
5. Live advances, small caps, one cohort.
