# Proslync — Strategy & Operating Thesis

**Date:** 2026-06-14 · **Status:** Working strategy (research-validated) · **Audience:** founders, a future cofounder/hire, the backend/Trajan team, pilot & investor conversations.

This is the single source of truth for *why Proslync wins and how*. It synthesizes four deep research passes (competitive/moat, highest-leverage product, demo→real path, and the NIL ecosystem) run June 2026, plus the per-role research charter. Where a claim is load-bearing, the evidence is cited.

---

## 1. One-sentence thesis

**Proslync is the athlete's portable, cross-rail record of who owes them money and whether it cleared** — and the wedge to win the market is solving payment limbo (advancing athletes cash on deals that cleared but haven't paid), not building another deal marketplace.

---

## 2. The market in one paragraph (2026 reality)

Post–*House v. NCAA* (approved June 6, 2025), schools share revenue directly with athletes (cap $20.5M, +~4%/yr) and every third-party deal ≥$600 must be reported to the **NIL Go** clearinghouse (Deloitte-built) within 5 business days; deals ≥$2,500 get a fair-market "reasonable range" review. The **College Sports Commission (CSC)** enforces. The system is straining: ~$15M+ of deals rejected, payment *limbo* of months (Players Era athletes unpaid ~2.5 months post-event), **63% of cleared deal volume is booster/"associated-entity" money** (the CEO expected ~90% organic), and NIL Go's opaque FMV algorithm is under antitrust suit (Ili/Mirer v. NCAA). Translation: the rails are broken, trust is low, and no incumbent serves the athlete as the customer.

---

## 3. The moat (what's defensible vs. what just gets copied)

**Defensible — the athlete-owned, cross-rail payment-truth ledger.** Teamworks touches ~90% of D-I NIL deal flow, but every Teamworks product is *bought by the athletic department* and tied to a roster slot — when an athlete transfers or graduates, the record stays with the school. **No incumbent owns the athlete's lifetime, cross-school, cross-rail financial + compliance history.** That ledger is defensible for a *structural* reason: Teamworks' customer is the school and the collective — the exact parties an athlete files a non-payment dispute against. An athlete-advocacy ledger ("your collective is 60 days late on $4K") is a permanent channel conflict for them. The moat is **supply-side data gravity** — the hardest side to win and the stickiest.

**Not a moat (assume copied):** escrow, media kits, the pre-clearance copilot, supporter passes. They earn signups; they don't defend. Use the CSC copilot as *acquisition bait* (it's also legally fragile — NIL Go itself is under antitrust attack). Don't fight NIL Club head-on on fan subscriptions ($50M+ paid, 650K athletes) — reposition supporter receipts as **verified audience proof inside the media kit**, feeding the moat instead of competing.

**Window:** This is a 12–18 month lead, not a permanent advantage. Teamworks can copy the *features* in a quarter; they structurally won't copy the athlete-advocacy *position*. Win data gravity before the window closes.

---

## 4. The wedge: NIL Advance (flagship)

The #1 documented pain is **payment limbo, not deal-making.** Athletes deliver, clear NIL Go, and wait months for money. Proslync is uniquely positioned to advance cash on cleared-but-unpaid deals because the ledger + escrow + CSC scoring + the new FMV engine already produce the receivable-quality signal a factor needs to underwrite safely. It's the rare feature that is simultaneously a hair-on-fire need, a direct revenue line (advance fee ~1–5%/30 days), a retention hook (money beats a status badge), and defensible (rivals lack the cleared-deal data). Full spec: `docs/superpowers/specs/2026-06-14-nil-advance-spec.md`.

Supporting near-term builds (all real value, all built or buildable now): **contract red-flag review** (shipped), **FMV / will-this-clear predictor** (shipped), **tax automation** (1099 + quarterly estimates — 49% of athletes want it, 9% have a counselor).

---

## 5. The role architecture (the spine all roles share)

One spine: **the athlete's deal ledger.** Every other role is a derivative view of it. Full per-role IN/CUT lists live in durable memory (`project_role_charter.md`); the principle per role:

- **Athlete** — owner-home (money truth → tasks due → deal status). The hub.
- **Coach** — time-not-money. The dollar-blindness wall *is* the product (athletes won't log if coaches see amounts — Illinois: $9,100 disclosed vs $145K market avg when watched).
- **Agent** — every capability downstream of an athlete-initiated grant (anti-street-agent by design; FTC SPARTA inquiry is live).
- **Brand** — sell packaged outcomes, not search; discovery is last. Payment-reliability badge from the ledger.
- **Fan** — receipts + belonging, not leaderboards; paying-supporter count becomes brand-facing fraud-proof audience evidence.
- **School/AD** — derivative-state consumer (clocks, flags, receipts, exports — never the ledger; what they never hold can't be FOIA'd).
- **Collective** — the money-side payer; VBP packet builder + clearance pipeline; AE-honest.

**Cross-role build order:** (1) proof-of-delivery flywheel (athlete↔brand receipts), (2) compliance exhaust (athlete↔AD — ADs *require* the app to keep athletes out of the rejection pile → mandated installs flood the data spine), (3) fan-receipts→brand-evidence.

---

## 6. Go-to-market: supply-side first, narrow

Win **athletes first** (harder, stickier, un-owned); brands follow liquidity. Beachhead where Teamworks is weakest and pain is highest: **women's / Olympic / mid-major sports** — many small brand + fan deals, no GM managing them, acute non-payment + scam pain. Avoid P4 football first (incumbent home turf). Be useful at **N=1** (free ledger + copilot + contract check + dispute log work for one athlete with zero network). Prefer a state whose NIL law conflicts with the CSC — those athletes distrust the school-bought stack most.

---

## 7. Path from demo → real (everything is fixture-backed today)

The liberating finding: **almost everything dangerous is rentable. Build the ledger, the UX, and the compliance state-machine; rent the rest.**

- **Payments/escrow → Stripe Connect; "escrow" = delayed payouts.** Do NOT pursue a money-transmitter license ($250k–$1M+, 40+ states, 9–18 months). Ride Stripe's licenses. Stripe doesn't do legal escrow → implement holds as delayed payouts (up to 90 days). This is Teamworks Wallet's own blueprint (Priority Technology + sponsor banks, no charter). Graduate to Unit/Increase only when stored-balance wallets are needed.
- **"Paid ✓" → Plaid `settled` webhook** (never client-set), with a reversal path (ACH returns up to 60 days).
- **NIL Go is blocked — no public API.** Manual Deloitte portal. Workaround: pre-fill the disclosure packet, run the 5-business-day reminder, track returned status as an *attested* field. Facilitate; never promise "auto-cleared."
- **Stay a facilitator, never an "agent."** 42 states regulate athlete agents; facilitating+disclosing is safe, negotiating/soliciting on an athlete's behalf is not.
- **Phase 0 (done):** the data models were reshaped to the real event-sourced, cents-based, attested-clearance, ledger state-machine shape so wiring a backend appends events instead of re-architecting. See `lib/money/`.

**Phasing:** Phase 0 demo (done) → Phase 1 pilot (1 school/collective, ~2–4 months, Stripe Connect + Plaid + provider KYC/1099 + manual NIL Go) → Phase 2 real (stored-balance wallet, NIL Advance, 50-state compliance).

---

## 8. Biggest threat + how to blunt it

**Teamworks bundles an athlete payment-ledger view into Wallet in a quarter.** They have the data and distribution. They *structurally won't* surface non-payment against their own buyers. Blunt it: (a) be explicitly **athlete-owned and portable** across the transfer portal; (b) race to **data gravity** (cross-school history they can't retroactively grant); (c) stay **neutral/cross-rail** (ingest collective + NIL Club + brand + rev-share alike).

---

## 9. The honest constraints (say these out loud)

1. Athlete willingness-to-adopt is an *assumption to test*, not proven — the loudest "where's my money" voices on record are schools/agents/lawyers, not a grassroots athlete chorus. The pilot must validate athlete pull.
2. Everything is a fixture demo; the product becomes real only with rails + a pilot + legal sign-off — decisions that need the founder, not more code.
3. Legal landscape is moving fast (House, NIL Go, antitrust suits, RealPage settlement). Get NIL/sports counsel sign-off before shipping money movement and the FMV "fair value" framing.

---

## 10. The next decision that needs a human

**Who is the first pilot conversation with** — one school's compliance office, one collective, or one sport's athlete cohort. Everything built until then makes the demo more convincing to that person. That call is the unlock; the code is ready to follow it.
