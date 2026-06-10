// ── INTENT TOKENS ─────────────────────────────────────────
// PLAN.md §5e.1 — closed semantic-intent enum for the three shared
// stat primitives (StatPill / KpiTile / StatRail). Replaces the open
// `tint?: string` / `tone?: KpiTileTone` props that admit any hex.
//
// Rationale: round-1 cockpit audit found ~30 caller sites improvising
// color per metric position rather than per state. Two cockpits used
// the same "green" for both throughput counts AND positive events —
// L2.check3 fail. This module locks color → intent at the token layer,
// so callers can only express *what the metric means*, not *what color
// it should be*.
//
// Migration path: callers add `intent` prop; old `tint` / `tone` props
// stay alive (marked @deprecated) until the cockpit-slice migration
// (PLAN.md §5e E2) drives the rest of the call sites off them. Then a
// future round removes the deprecated props entirely.
//
// Intent vocabulary:
//   - neutral    → no state significance; just a number to read
//   - positive   → outcome confirmed (compliance clear, deal closed)
//   - attention  → user action wanted (overdue, pending review)
//   - critical   → blocking / risk (rejected, escalated, regulatory)

import { Brand } from '@/constants/brand';

export type Intent = 'neutral' | 'positive' | 'attention' | 'critical';

const INTENT_COLOR: Record<Intent, string> = {
  // White for neutral keeps the cockpit quiet by default. Color is the
  // exception, not the rule — only intentional state earns hue.
  neutral: '#FFFFFF',
  // Emerald-400; matches the green Auto-approved chip on activity stream.
  positive: '#34D399',
  // Copper is the brand attention hue. Reserved for "needs the user now"
  // states (pending review, overdue, action required).
  attention: Brand.colors.copper,
  // iOS systemRed for blocking states. Use sparingly — if everything is
  // critical, nothing is. Reviewer must reach for `attention` first.
  critical: '#FF453A',
};

export function intentColor(intent: Intent | undefined): string {
  return INTENT_COLOR[intent ?? 'neutral'];
}

/**
 * Helper for primitive components migrating from open `tint` to closed
 * `intent`. Returns the resolved color: explicit `tint` wins (deprecated
 * escape hatch), else `intent` maps to its color, else neutral white.
 */
export function resolveIntentColor(
  intent: Intent | undefined,
  tintOverride: string | undefined,
): string {
  if (tintOverride) return tintOverride;
  return intentColor(intent);
}
