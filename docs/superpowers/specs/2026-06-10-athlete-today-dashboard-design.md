# Athlete "Today" Dashboard — Broadcast-Hybrid Design (Approved)

**Date:** 2026-06-10 · **Status:** Approved by Arshia · Produced by 3-concept design tournament (videogame / fintech / broadcast) + adversarial judge. Recipe: **broadcast shell, fintech spine, videogame thresholds as rules only.**

## Placement

The middle bottom-tab (`activity` → `AthleteView` for role=player) gains a **Today** segment as the FIRST and DEFAULT tab in its existing segmented pill (Today · Stats · Team · Schedule · Deals · Wallet). New screen: `components/athlete/athlete-today.tsx`. Every zone deep-links into the existing tabs.

## Zones (top → bottom, single scroll)

1. **Masthead + status strip.** Row 1: "PROSLYNC" condensed caps eyebrow left, date (`MON · JUN 9`) right, small. Row 2 (the 10-second answer): one-line copper status strip, e.g. `2 URGENT · $2,400 PENDING · WINDOW CLOSES FRI` — derived live from the urgency model + wallet; tappable → scrolls to Needs Attention. All-caps 11px, letter-spaced.
2. **Score-bug money zone.** Card (CARD_BG, hairline border, 16 radius). Left: jersey number in ~56px ultra-condensed, copper **outline** text (fixture: 7; fallback: initials). Right: `TOTAL EARNED` 9px caps muted; the dollar figure is **the biggest text on the screen** (~40px, tabular, white, plain — never animated); under it three micro-pills: `PENDING $X · ESCROW $X · TAX SET-ASIDE $X` (stat-pill sm); a small 30-day sparkline bottom-right (the ONLY entrance animation: one 300ms draw). Tap → Wallet tab.
3. **Needs Attention.** Lower-third header (4px copper left bar + `NEEDS ATTENTION` caps). Static rows (NO ticker/motion), hard cap 3: 4px urgency stripe (red ≤24h, amber ≤72h, blue = awaiting-you), icon, two-line label, right-side verb CTA chip (`DISCLOSE` / `SUBMIT` / `RESPOND`) in copper. 45° copper corner-notch top-left of each row (clip or small triangle overlay). Empty state: muted `✓ ALL CLEAR — nothing due this week`, no manufactured urgency. Data: derived from offers/contracts/disclosure fixtures with deadline fields (synthesize a small `useAthleteUrgency` selector; fixture fallback acceptable).
4. **Pipeline matchup strip.** One horizontal bar segmented `OFFERS · NEGOTIATING · ACTIVE · AWAITING PMT` with counts; segment widths proportional to counts (min width floor); ACTIVE segment gets a faint copper ambient pulse (opacity delta ≤0.15, the only ambient animation). Tap segment → Deals tab.
5. **This Week.** Lower-third header. Max 4 plain rows: 24-28px condensed day abbreviation left, event title middle, right pill (`GAME` copper / `DELIVERABLE` white / countdown amber if <72h). Merge schedule fixture + deliverable deadlines. Tap → Schedule tab.
6. **Your Market.** Lower-third header `YOUR MARKET`. Box-score table (data-row pairs, copper separators, NO chart): `EST. ANNUAL NIL  $42–68K` (range, never a point), `POSITION RANK  Top 34% · G · ACC`, `REACH  128K (↑2.1K wk)`. Collapsible. Tap → Stats tab / comparables screen.
7. **Masonry feed (below fold).** 2-col masonry (reuse home's geometry, GUTTER 6/MARGIN 8) of existing cards adapted small: deal cards (brand, $, stage bar), comps evidence card, social reach card, growth sparkline card. This is the 0-deals empty-state insurance: with no deals it fills with comps/reach/agenda content.

## Laws (non-negotiable)

- **Tabular numerals for ALL money; zero layout shift.** Plain type; money never animates.
- **Copper budget above the fold: exactly 2 objects** — jersey outline + the single most-urgent CTA chip. Everything else white/hairline/muted. Status-strip text counts as muted-copper allowed exception only in row 2 of masthead.
- **Animation budget: 2 total.** Sparkline draw (once) + ACTIVE segment pulse. Nothing else moves.
- **Urgency honesty:** countdown chips only on real deadlines from data; cap 3; no marketing nudges.
- **Thin-data first:** every zone must render sensibly with 0 deals / empty wallet (design the empty states explicitly).
- Game chrome (XP, OVR, tiers) does NOT ship. Red ≤24h / amber ≤72h thresholds are global law.
- Existing ui-kit + tokens (`CARD_BG`, `CARD_BORDER`, TONE_COLOR, stat-pill, status-pill, data-row, sparkline, kpi-tile) are the building blocks; copper = `#EB621A`.

## Out of scope (v1)

Season track (profile-page flourish later), home-screen widgets, OVR/ratings, real disclosure flows behind the CTAs (chips navigate to existing screens: disclosures/deal detail/offer inbox).
