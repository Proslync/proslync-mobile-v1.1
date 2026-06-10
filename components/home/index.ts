// ── HOME BARREL ───────────────────────────────────────────
// Per-role home dashboard primitives. The trio below composes a
// quiet, editorial-feeling role dashboard:
//
//   <RoleHeroGreeting />        // greeting + profile chip
//   <LiveSignalRail   />        // 3 status beads
//   <StatRail         />        // 3-5 numeric KPIs (from components/stats)
//   <SectionRule label="…" />   // mono-caps divider (from components/stats)
//   <ActivityStream   />        // recent events list
//
// Per-role dashboards live under `components/home/role-dashboards/*` and
// compose these primitives with role-specific data.

export { ActivityStream } from './activity-stream';
export type {
  ActivityStreamItem,
  ActivityStreamItemTone,
  ActivityStreamProps,
} from './activity-stream';

export { LiveSignalRail } from './live-signal-rail';
export type {
  LiveSignalItem,
  LiveSignalRailProps,
  LiveSignalTone,
} from './live-signal-rail';

export { RoleHeroGreeting } from './role-hero-greeting';
export type { RoleHeroGreetingProps } from './role-hero-greeting';
