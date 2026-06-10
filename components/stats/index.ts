// ── STATS BARREL ──────────────────────────────────────────
// Dense mono-numeric data primitives. Use these instead of card-soup
// dashboards. See atlas/design/2026-04-15/stat-rail-library-2026-04-15.md.

export { StatRail } from './stat-rail';
export type { StatRailItem, StatRailProps, StatRailTone } from './stat-rail';

export { MonoKpi } from './mono-kpi';
export type {
  MonoKpiAlignment,
  MonoKpiProps,
  MonoKpiTone,
} from './mono-kpi';

export { DenseRow } from './dense-row';
export type {
  DenseRowProps,
  DenseRowStatus,
  DenseRowStatusTone,
  DenseRowValue,
} from './dense-row';

export { SectionRule } from './section-rule';
export type { SectionRuleProps, SectionRuleTone } from './section-rule';

export {
  BODY_FAMILY,
  MONO_FAMILY,
  Radius as StatsRadius,
  Spacing as StatsSpacing,
  StatsColors,
  StatusColors,
} from './tokens';
