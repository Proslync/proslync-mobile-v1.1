// ── ROLE DASHBOARD CONFIGS ────────────────────────────────
// Per-role data shape for the home dashboard composition. Each config
// drives the same RoleDashboard component, parameterized by role. When
// real data sources arrive (Atlas/EMA wiring, profile context, deal feed),
// swap the static arrays here for live queries — the dashboard shape
// stays the same.
//
// The structure mirrors arshia's per-role home screens at the
// demo-ready-2026-04-15 tag (AthleteHomeScreen / RosterScreen /
// DiscoverScreen / AdminOverviewScreen) but consolidated into a single
// composable shape so coach / school / nilManager (which arshia didn't
// have navigators for) can plug in without bespoke screen files.
//
// Spec: atlas/design/2026-04-15/copy-editorial-pass-2026-04-15.md
//       atlas/design/2026-04-15/stat-rail-library-2026-04-15.md

import type { ActivityStreamItem, LiveSignalItem } from './index';
import type { StatRailItem } from '@/components/stats';
import type { ProfileRole } from '@/lib/providers/role-provider';

export interface RoleDashboardConfig {
  contextLabel: string;
  greeting: string;
  /** Display name. Hardcoded for now — replace with profile context. */
  name: string;
  liveSignals: LiveSignalItem[];
  statsLabel: string;
  stats: StatRailItem[];
  activityLabel: string;
  activity: ActivityStreamItem[];
}

export const ROLE_DASHBOARD_CONFIGS: Record<ProfileRole, RoleDashboardConfig> = {
  // ARGENT-QA-PASS-2026-05-12T06 [CLARITY] `name:` is now a *cold-start
  // fallback only* (role-dashboard.tsx reads user.firstName first). Each
  // role's `name` is the generic role label, NOT a hardcoded persona — the
  // 5 prior persona names ("Marcus Hayes" / "Sarah Wilson" / "Nike NIL
  // Team" / "Coach Williams" / "Texas A&M Athletics" / "Compliance Desk")
  // caused persona drift (cockpit greeting locked to mock regardless of
  // login). See cross-cuts/persona-name-audit.md for canonicalization map.
  //
  // ── ATHLETE ────────────────────────────────────────────────
  player: {
    contextLabel: 'ATHLETE',
    greeting: 'Welcome back,',
    name: 'Athlete',
    liveSignals: [
      { icon: 'flame',             label: 'Momentum',   value: '+18%',    tone: 'success' },
      { icon: 'shield-checkmark',  label: 'Compliance', value: 'Clear',   tone: 'success' },
      { icon: 'flash',             label: 'Focus',      value: '3 today', tone: 'accent' },
    ],
    statsLabel: 'THIS WEEK',
    stats: [
      { label: 'Earned',     value: '$12.4K', hint: 'YTD' },
      { label: 'Views',      value: '184K',   hint: '+22%',  tone: 'success' },
      { label: 'Live Deals', value: '4',                     tone: 'accent'  },
    ],
    activityLabel: 'RECENT ACTIVITY',
    activity: [
      { id: 'a1', time: '2m',  icon: 'document-text',   title: 'Nike brief delivered',  subtitle: 'Acceptance pending',     tone: 'accent'  },
      { id: 'a2', time: '14m', icon: 'people',          title: 'Agent shared an offer', subtitle: 'Gatorade · $4.5K',        tone: 'success' },
      { id: 'a3', time: '1h',  icon: 'shield-checkmark', title: 'Compliance cleared',                                        tone: 'success' },
      { id: 'a4', time: '3h',  icon: 'eye',             title: 'Game film reached 12K views',                                tone: 'accent'  },
    ],
  },

  // ── AGENT ──────────────────────────────────────────────────
  agent: {
    contextLabel: 'AGENT',
    greeting: 'Roster pulse,',
    name: 'Agent',
    liveSignals: [
      { icon: 'people',  label: 'Roster',  value: '14 active',  tone: 'accent'  },
      { icon: 'flash',   label: 'Offers',  value: '6 inbound',  tone: 'success' },
      { icon: 'warning', label: 'Risk',    value: '1 review',   tone: 'warning' },
    ],
    statsLabel: 'PIPELINE',
    stats: [
      { label: 'Pipeline',    value: '$84K',   hint: 'QTD' },
      { label: 'Commissions', value: '$8.4K',                tone: 'success' },
      { label: 'Closed',      value: '12',     hint: 'deals' },
    ],
    activityLabel: 'INBOX',
    activity: [
      { id: 'a1', time: '4m',  icon: 'document-text', title: 'New offer from Adidas',  subtitle: 'Marcus Hayes · $6K',                tone: 'success' },
      { id: 'a2', time: '22m', icon: 'people',        title: 'Athlete acceptance',     subtitle: 'Compass deal',                       tone: 'success' },
      { id: 'a3', time: '1h',  icon: 'warning',       title: 'Exclusivity flag',       subtitle: 'Underwriter · review needed',        tone: 'warning' },
      { id: 'a4', time: '2h',  icon: 'analytics',     title: 'Q3 roster report ready', subtitle: 'Tap to review distribution',          tone: 'accent'  },
    ],
  },

  // ── BRAND HQ ───────────────────────────────────────────────
  brand: {
    contextLabel: 'BRAND HQ',
    greeting: 'HQ snapshot,',
    name: 'Brand',
    liveSignals: [
      { icon: 'megaphone', label: 'Campaigns', value: '3 live',    tone: 'accent'  },
      { icon: 'people',    label: 'Athletes',  value: '42 active', tone: 'success' },
      { icon: 'flash',     label: 'Pending',   value: '8 reviews', tone: 'warning' },
    ],
    statsLabel: 'QUARTER',
    stats: [
      { label: 'Spend',  value: '$148K', hint: 'QTD' },
      { label: 'Reach',  value: '2.1M',  hint: '+12%', tone: 'success' },
      { label: 'ROI',    value: '3.2x',                tone: 'accent'  },
    ],
    activityLabel: 'CAMPAIGN PULSE',
    activity: [
      { id: 'a1', time: '6m',  icon: 'document-text', title: 'New campaign brief',     subtitle: 'Fall NIL push',                  tone: 'accent'  },
      { id: 'a2', time: '18m', icon: 'people',        title: '4 athletes accepted',    subtitle: 'Fall NIL push' },
      { id: 'a3', time: '1h',  icon: 'analytics',     title: 'Q3 report ready',        subtitle: 'Reach +12%, engagement +8%',     tone: 'success' },
      { id: 'a4', time: '4h',  icon: 'warning',       title: 'Compliance review',      subtitle: 'Compass brief pending sign-off', tone: 'warning' },
    ],
  },

  // ── COACH ──────────────────────────────────────────────────
  coach: {
    contextLabel: 'COACH',
    greeting: 'Team pulse,',
    name: 'Coach',
    liveSignals: [
      { icon: 'people',  label: 'Roster',    value: '32 active', tone: 'success' },
      { icon: 'fitness', label: 'Practice',  value: '6PM',       tone: 'accent'  },
      { icon: 'warning', label: 'NIL Watch', value: '2 flags',   tone: 'warning' },
    ],
    statsLabel: 'PROGRAM',
    stats: [
      { label: 'In NIL',      value: '14',  hint: 'wk +3',  tone: 'accent'  },
      { label: 'Compliance',  value: '100%',                tone: 'success' },
      { label: 'Film grade',  value: '87%', hint: 'season' },
    ],
    activityLabel: "WHAT'S MOVING",
    activity: [
      { id: 'a1', time: '8m',  icon: 'fitness',       title: 'Practice plan reviewed',  subtitle: 'Tomorrow · 6PM',                tone: 'success' },
      { id: 'a2', time: '22m', icon: 'document-text', title: 'New deal disclosed',      subtitle: 'Marcus Hayes · Nike · cleared', tone: 'success' },
      { id: 'a3', time: '40m', icon: 'eye',           title: 'Film clip uploaded',      subtitle: 'Sat game · 47 plays',            tone: 'accent'  },
      { id: 'a4', time: '2h',  icon: 'warning',       title: 'NIL Watch alert',         subtitle: 'Sponsor proximity · review',     tone: 'warning' },
    ],
  },

  // ── SCHOOL / AD ────────────────────────────────────────────
  school: {
    contextLabel: 'ATHLETIC DIRECTOR',
    greeting: 'AD desk,',
    name: 'Athletic Director',
    liveSignals: [
      { icon: 'shield-checkmark', label: 'Audit posture', value: 'Defensible', tone: 'success' },
      { icon: 'document-attach',  label: 'Disclosures',   value: '47 logged',  tone: 'accent'  },
      { icon: 'warning',          label: 'Open risks',    value: '2',          tone: 'warning' },
    ],
    statsLabel: 'SEASON',
    stats: [
      { label: 'Disclosed',  value: '128',    hint: 'deals' },
      { label: 'Rev-share',  value: '$94K',   hint: 'YTD',   tone: 'accent'  },
      { label: 'Compliance', value: '98.4%',                  tone: 'success' },
    ],
    activityLabel: 'AUDIT LOG',
    activity: [
      { id: 'a1', time: '12m', icon: 'document-attach', title: 'Disclosure submitted', subtitle: 'Track · Adidas · $2K',           tone: 'success' },
      { id: 'a2', time: '34m', icon: 'warning',         title: 'Exclusivity overlap',  subtitle: 'Football · Nike vs. Under Armour', tone: 'warning' },
      { id: 'a3', time: '2h',  icon: 'trending-up',     title: 'Q3 revenue settled',   subtitle: '$94K rev-share posted',           tone: 'success' },
      { id: 'a4', time: '5h',  icon: 'people',          title: 'New athlete in NIL',   subtitle: 'Soccer · routine onboarding' },
    ],
  },

  // ── NIL MANAGER ────────────────────────────────────────────
  nilManager: {
    contextLabel: 'NIL MANAGER',
    greeting: 'Compliance queue,',
    name: 'NIL Manager',
    liveSignals: [
      // L2.check3 fix (loop 2026-05-12-r1): "Cleared today" drops the
      // success tone. The rubric is one secondary hue per semantic
      // context; green is reserved for the activity-stream "Auto-approved"
      // chip (a positive state change). A daily throughput count is
      // neutral, not a success state.
      { icon: 'list',             label: 'Queue',          value: '23 pending', tone: 'accent'  },
      { icon: 'warning',          label: 'Aged > 48h',     value: '4',          tone: 'warning' },
      { icon: 'shield-checkmark', label: 'Cleared today',  value: '8' },
    ],
    statsLabel: 'THIS MONTH',
    stats: [
      { label: 'Reviewed',   value: '142'                                           },
      { label: 'Cleared',    value: '98%',                          tone: 'success' },
      { label: 'Escalated',  value: '4'                                             },
    ],
    activityLabel: 'QUEUE',
    activity: [
      { id: 'a1', time: '3m',  icon: 'document-text',   title: 'New disclosure',         subtitle: 'Football · Marcus Hayes · $5K',         tone: 'accent'  },
      { id: 'a2', time: '18m', icon: 'shield-checkmark', title: 'Auto-approved',         subtitle: 'Soccer · Adidas · routine',              tone: 'success' },
      { id: 'a3', time: '34m', icon: 'warning',         title: 'Escalation required',    subtitle: 'Gymnastics · jurisdictional conflict',   tone: 'warning' },
      { id: 'a4', time: '1h',  icon: 'trending-up',     title: 'Weekly throughput',      subtitle: '142 reviewed · trending up' },
    ],
  },

  // ── FAN ────────────────────────────────────────────────────
  // Fan-mode routes through (fan-tabs)/ via useMode()==='fan', so this
  // config is rarely the one rendered by (tabs)/index.tsx. Keep it
  // sensible in case mode bifurcation is disabled or a fan user lands
  // here during impersonation.
  fan: {
    contextLabel: 'FAN',
    greeting: 'Tonight,',
    name: 'You',
    liveSignals: [
      { icon: 'flame',  label: 'Live games',  value: '7 now',       tone: 'success' },
      { icon: 'people', label: 'Following',   value: '42 athletes', tone: 'accent'  },
      { icon: 'gift',   label: 'Drops',       value: '3 new',       tone: 'warning' },
    ],
    statsLabel: 'YOUR FEED',
    stats: [
      { label: 'Watched',     value: '14',  hint: 'this wk' },
      { label: 'Predictions', value: '8',   hint: '+2',     tone: 'accent' },
      { label: 'Tips sent',   value: '$28', hint: 'YTD' },
    ],
    activityLabel: 'JUST IN',
    activity: [
      { id: 'a1', time: '4m',  icon: 'flame', title: 'Marcus Hayes scored', subtitle: 'TXAM vs OU · 2nd quarter',  tone: 'accent'  },
      { id: 'a2', time: '12m', icon: 'gift',  title: 'New drop available',  subtitle: 'Limited Compass jersey',     tone: 'warning' },
      { id: 'a3', time: '40m', icon: 'eye',   title: 'Live game starting',  subtitle: 'OU @ Texas · ESPN',           tone: 'success' },
    ],
  },
};
