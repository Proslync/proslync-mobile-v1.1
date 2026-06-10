// ── STATS TOKENS ──────────────────────────────────────────
// ARGENT-QA-PASS-2026-05-12T06 [DUPLICATE] Conflicts with
// components/shared/ui-kit/tokens.ts: CARD_BG=0.055 here vs 0.05 there.
// Pick one. Recommend: ui-kit/tokens.ts is canonical; stats/tokens.ts
// re-exports. See also §5e.1 intent-enum migration (StatsColors.accent
// becomes intent='attention').
// Self-contained tokens for the stats primitives. Kept colocated (same
// pattern as components/shared/ui-kit/tokens.ts) so this module has no
// theme-provider dependency — these primitives are flat, dark-first, and
// borrow from the brand's copper accent only.
//
// Values mirror the dark palette from the 2026-04-15 pastel-professional
// lock. See atlas/design/2026-04-15/stat-rail-library-2026-04-15.md.

import { Platform } from 'react-native';

import { Brand } from '@/constants/brand';

// Mono font family — used for labels, values, and hints. The original
// design specced JetBrains Mono; this build doesn't load custom mono
// fonts so we fall back to the platform system mono.
export const MONO_FAMILY = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
}) as string;

// Body family — Lato is the loaded brand font; falls back to system.
export const BODY_FAMILY = Platform.select({
  ios: 'Lato_400Regular',
  android: 'Lato_400Regular',
  default: 'System',
}) as string;

// 4pt grid spacing scale (matches the original demo-tag tokens).
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const Radius = {
  xs: 6,
  sm: 10,
  md: 14,
} as const;

// Dark-first color tokens. Stays faithful to the demo-tag palette so the
// "hairlines never shout" rule is preserved (border at 0.05 alpha).
export const StatsColors = {
  text: 'rgba(255,255,255,0.92)',
  textSecondary: 'rgba(255,255,255,0.60)',
  muted: 'rgba(255,255,255,0.32)',
  border: 'rgba(255,255,255,0.05)',
  divider: 'rgba(255,255,255,0.04)',
  accent: Brand.colors.copper,
} as const;

// Unified status palette — canonical values + muted alpha variants.
// Kept identical to the dark palette from the demo-tag colors.ts so any
// future consumer that referenced `Colors.status.*` translates cleanly.
export const StatusColors = {
  success: '#10B981',
  successMuted: 'rgba(16,185,129,0.12)',
  warning: '#F59E0B',
  warningMuted: 'rgba(245,158,11,0.12)',
  danger: '#EF4444',
  dangerMuted: 'rgba(239,68,68,0.12)',
  info: '#3B82F6',
  infoMuted: 'rgba(59,130,246,0.12)',
  neutral: 'rgba(255,255,255,0.55)',
  neutralMuted: 'rgba(138,138,154,0.12)',
} as const;
