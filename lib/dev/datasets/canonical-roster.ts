// ── CANONICAL ROSTER ──────────────────────────────────────
// Single, top-level consolidation of every "user" the demo can render:
// the 8 backend seed users (1:1 phone match) mapped to a real identity,
// a real photo / local asset, a visual-assets entityId, and the
// completeness criteria that decide whether a row is shown.
//
// Existing primitives stay canonical for their narrower jobs:
//   * `lib/data/real-nil-deals.json`       — provenance NIL deal data
//   * `lib/data/photo-sources.json`        — provenance photo URLs
//   * `lib/dev/datasets/visual-assets.ts`  — SVG logo registry
//   * `lib/dev/datasets/athlete-catalog.ts`— featured-12 athlete shape
//   * `lib/dev/datasets/brand-catalog.ts`  — search-screen brand shape
//   * `lib/dev/datasets/school-catalog.ts` — search-screen school shape
//   * `lib/dev/dev-personas.ts`            — dev-login persona buttons
//   * `proslync-backend src/services/seed` — backend seed users (DB row)
//
// What this file adds: one cross-cut view that ties phone-number →
// real identity → photo → visual-asset → role spine, with completeness
// filtering so any consumer can ask "give me only complete rows" and
// trust that every row will render with a real name AND a real picture.

import realNilDeals from '@/lib/data/real-nil-deals.json';
import sources from '@/lib/data/photo-sources.json';
import * as mockRegistry from '../mock-registry';
import { ATHLETE_CATALOG, type AthleteItem } from './athlete-catalog';
import { BRAND_CATALOG, type BrandItem } from './brand-catalog';

// ── Types ────────────────────────────────────────────────

export type RosterRole =
  | 'player'
  | 'coach'
  | 'agent'
  | 'brand'
  | 'school'
  | 'nilManager'
  | 'fan'
  | 'admin';

/**
 * One unified row. Every field is required so consumers never have to
 * pick between "what if name is missing" vs "what if photo is missing".
 * Use `CANONICAL_ROSTER` for the curated set, or call
 * `hasCompleteRosterMember()` if you receive a candidate from elsewhere.
 */
export interface RosterMember {
  /** Stable id, matches `lib/dev/datasets/athlete-catalog.ts` ids where
   *  applicable so existing components don't need a remap layer. */
  id: string;
  /** Backend seed phoneNumber. The same string is set in
   *  `proslync-backend/src/services/seed.ts` and `dev-personas.ts`. */
  phoneNumber: string;
  /** Display name (e.g. "Kiyan Anthony"). Never blank. */
  displayName: string;
  /** Two-letter initials chip fallback. Never blank. */
  initials: string;
  /** Single accent hex matching the school / brand / role tone. */
  color: string;
  /** App role spine slot. */
  role: RosterRole;
  /** Short one-line subtitle for dev-login + persona pickers. */
  subtitle: string;
  /** Multi-line bio matching the backend seed bio for visual parity. */
  bio: string;
  /** Photo URL — Wikipedia thumb, brand mark, or local-asset path. */
  photoUrl?: string;
  /** Local require() module id when a curated PNG exists on disk.
   *  Resolved by `EntityAvatar` ahead of `photoUrl`. */
  localSource?: unknown;
  /** Visual-assets registry id (e.g. "brand-puma", "school-syracuse"). */
  visualAssetId?: string;
  /** Optional handle (e.g. "@kiyananthony"). */
  handle?: string;
  /** School / employer affiliation when meaningful. */
  affiliation?: string;
  /** Source URL or attribution note for the photo. */
  photoSource?: string;
}

// ── Photo lookup ─────────────────────────────────────────

type PhotoEntry = { name: string; url: string; source_page: string };
const athletePhotos = sources.athletes as Record<string, PhotoEntry>;
const agentPhotos = sources.agents as Record<string, PhotoEntry>;

function findAthletePhoto(name: string): PhotoEntry | undefined {
  for (const entry of Object.values(athletePhotos)) {
    if (entry.name === name) return entry;
  }
  return undefined;
}

// ── 12 featured athletes (delegates to ATHLETE_CATALOG) ──
//
// `ATHLETE_CATALOG` already filters `real-nil-deals.json` by
// `hasCompleteProfile()` and a FEATURED_ORDER list — re-use it
// directly so there is one source of truth for "who has a photo".

export const FEATURED_ATHLETES: readonly RosterMember[] =
  ATHLETE_CATALOG.map((a: AthleteItem): RosterMember => ({
    id: a.id,
    // No phone for athletes that aren't dev-login personas — surfaced
    // as empty string so the type stays narrow; real wire-up happens
    // through the dev-personas table below.
    phoneNumber: '',
    displayName: a.name,
    initials: a.initials,
    color: a.color,
    role: 'player',
    subtitle: a.rank ? `${a.school} · ${a.rank}` : `${a.school} · ${a.followers}`,
    bio: `${a.sport} · ${a.school}. ${a.classYear}.`,
    photoUrl: a.headshotUrl,
    handle: a.handle,
    affiliation: a.school,
    photoSource: a.headshotSource,
  }));

// ── 8 brand-company rows (delegates to BRAND_CATALOG) ────

export const FEATURED_BRANDS: readonly RosterMember[] =
  BRAND_CATALOG.map((b: BrandItem): RosterMember => ({
    id: b.id,
    phoneNumber: '',
    displayName: b.name,
    initials: b.initials,
    color: b.color,
    role: 'brand',
    subtitle: `${b.category} · ${b.followers}`,
    bio: `${b.category} brand. ${b.followers} cross-platform followers.`,
    visualAssetId: b.logoAssetId,
    handle: b.handle,
    affiliation: b.category,
  }));

// ── 8 dev-login personas, fully resolved ────────────────
//
// One row per backend seed phone number, in seed order. Every row has
// a non-empty `displayName`, a photo or local asset, and a
// `visualAssetId` when no explicit photo exists so `EntityAvatar` always
// has *something* to render. The display identity reuses the backend
// seed firstName/lastName for parity — see
// `proslync-backend/src/services/seed.ts`.
//
// `player` is mapped to Kiyan Anthony so the on-disk avatar
// (`kiyan-avatar.png`), the visual-asset (`at-kiyan`), the dev-login
// subtitle, and the backend seed (`kiyan-anthony` @ +15555550101) all
// agree. Prior to this consolidation the subtitle was a hand-typed
// "Jordan Mitchell" placeholder.

const kiyanPhoto = findAthletePhoto('Kiyan Anthony');
const richPaulPhoto = agentPhotos['rich-paul'];

export const DEV_PERSONA_ROSTER: readonly RosterMember[] = [
  {
    id: 'persona-superuser',
    phoneNumber: '+15555550100',
    displayName: 'Dev Superuser',
    initials: 'DS',
    color: '#EB621A',
    role: 'admin',
    subtitle: 'Admin · cross-role unlock',
    bio: 'Platform admin with full access to all role surfaces. Used for testing cross-role flows.',
    localSource: '@/assets/images/brand/polished/proslync-flash.png',
    handle: '@dev-superuser',
    affiliation: 'Proslync HQ',
  },
  {
    id: 'persona-player',
    phoneNumber: '+15555550101',
    displayName: 'Kiyan Anthony',
    initials: 'KA',
    color: '#F76900',
    role: 'player',
    subtitle: 'Syracuse Guard · $1.1M NIL',
    bio: "Syracuse Guard · ACC Freshman of the Year watch · 612K followers · Signed with Nike Hoops, BODYARMOR, Beats by Dre.",
    photoUrl: kiyanPhoto?.url,
    localSource: '@/assets/images/kiyan-avatar.png',
    visualAssetId: 'at-kiyan',
    handle: '@kiyananthony',
    affiliation: 'Syracuse',
    photoSource: kiyanPhoto?.source_page,
  },
  {
    id: 'persona-brand',
    phoneNumber: '+15555550102',
    displayName: 'EliteGear Athletic',
    initials: 'EG',
    color: '#000000',
    role: 'brand',
    subtitle: 'NIL roster · $25K quarterly',
    bio: 'Performance apparel for college athletes. $25K quarterly NIL budget across ACC + SEC.',
    visualAssetId: 'brand-puma',
    handle: '@elitegear',
    affiliation: 'Austin, TX',
  },
  {
    id: 'persona-agent',
    phoneNumber: '+15555550103',
    displayName: 'Sarah Kim',
    initials: 'SK',
    color: '#6B656B',
    role: 'agent',
    subtitle: '12 athletes · ACC + SEC',
    bio: 'NIL agent representing 12 athletes across basketball, soccer, and football. Specializing in brand-athlete matching and compliance.',
    photoUrl: richPaulPhoto?.url,
    localSource: '@/assets/images/contact-rich-paul.png',
    handle: '@sarah-kim',
    affiliation: 'Los Angeles, CA',
    photoSource: richPaulPhoto?.source_page,
  },
  {
    id: 'persona-school',
    phoneNumber: '+15555550104',
    displayName: 'Margaret Wilson',
    initials: 'MW',
    color: '#001A57',
    role: 'school',
    subtitle: 'AD · University of Virginia',
    bio: 'Athletic Director, University of Virginia. Overseeing NIL compliance, revenue sharing, and athlete welfare programs.',
    visualAssetId: 'school-virginia',
    handle: '@ad-wilson',
    affiliation: 'University of Virginia',
  },
  {
    id: 'persona-nil-manager',
    phoneNumber: '+15555550105',
    displayName: 'Rachel Davis',
    initials: 'RD',
    color: '#3FA889',
    role: 'nilManager',
    subtitle: 'NIL Compliance · UVA',
    bio: 'NIL Compliance Manager at UVA. Reviewing disclosure packets, managing approval queues, and ensuring NCAA alignment.',
    localSource: '@/assets/images/brand/transparent/proslync-mark-256.png',
    handle: '@compliance-davis',
    affiliation: 'University of Virginia',
  },
  {
    id: 'persona-coach',
    phoneNumber: '+15555550106',
    displayName: 'Marcus Williams',
    initials: 'MW',
    color: '#001A57',
    role: 'coach',
    subtitle: 'HC Basketball · UVA',
    bio: 'Head Basketball Coach, University of Virginia. Monitoring team NIL activity and maintaining competitive balance.',
    localSource: '@/assets/images/coach-avatar.png',
    visualAssetId: 'school-virginia',
    handle: '@coach-williams',
    affiliation: 'University of Virginia',
  },
  {
    id: 'persona-fan',
    phoneNumber: '+15555550107',
    displayName: 'Alex Rivera',
    initials: 'AR',
    color: '#001A57',
    role: 'fan',
    subtitle: 'UVA superfan · 8 follows',
    bio: "UVA superfan since '22. Following 8 athletes. First to know about drops and exclusive content.",
    localSource: '@/assets/images/default-avatar.png',
    visualAssetId: 'school-virginia',
    handle: '@alex-fan',
    affiliation: 'Richmond, VA',
  },
];

// ── Completeness check + filtered exports ────────────────

/**
 * A row is "complete" if it has a real display name AND at least one
 * way to render an avatar (photoUrl OR localSource OR visualAssetId).
 * Rows that fail this drop out of `COMPLETE_ROSTER`.
 */
export function hasCompleteRosterMember(row: RosterMember): boolean {
  if (!row.displayName || row.displayName.trim().length === 0) return false;
  if (!row.initials || row.initials.trim().length === 0) return false;
  const hasAvatar = Boolean(row.photoUrl || row.localSource || row.visualAssetId);
  return hasAvatar;
}

/** Full roster across athletes + brands + dev-login personas. */
export const FULL_ROSTER: readonly RosterMember[] = [
  ...FEATURED_ATHLETES,
  ...FEATURED_BRANDS,
  ...DEV_PERSONA_ROSTER,
];

/** Only rows that pass `hasCompleteRosterMember`. Use this by default. */
export const COMPLETE_ROSTER: readonly RosterMember[] = FULL_ROSTER.filter(
  hasCompleteRosterMember,
);

// ── Lookup helpers ───────────────────────────────────────

const ROSTER_BY_PHONE = new Map<string, RosterMember>(
  DEV_PERSONA_ROSTER.filter((r) => r.phoneNumber).map((r) => [r.phoneNumber, r]),
);
const ROSTER_BY_ID = new Map<string, RosterMember>(
  FULL_ROSTER.map((r) => [r.id, r]),
);
const ROSTER_BY_ROLE = new Map<RosterRole, RosterMember>(
  DEV_PERSONA_ROSTER.map((r) => [r.role, r]),
);

/** Resolve by backend phoneNumber (matches dev-login + backend seed). */
export function getRosterByPhone(phoneNumber: string): RosterMember | undefined {
  return ROSTER_BY_PHONE.get(phoneNumber);
}

/** Resolve by row id (e.g. "at-kiyan", "br-puma", "persona-coach"). */
export function getRosterById(id: string): RosterMember | undefined {
  return ROSTER_BY_ID.get(id);
}

/** Resolve the curated demo persona for a role spine slot. */
export function getRosterForRole(role: RosterRole): RosterMember | undefined {
  return ROSTER_BY_ROLE.get(role);
}

// ── Provenance + mock-registry hook ──────────────────────

const _meta = {
  description:
    'Canonical roster — single source of truth for athlete/brand/dev-persona identity, photo, and visual-asset across the demo. Filters out any row missing a name or any avatar shape so consumers never have to handle incompletes.',
  athletesSource: '@/lib/data/real-nil-deals.json (filtered by hasCompleteProfile in ATHLETE_CATALOG)',
  brandsSource: '@/lib/dev/datasets/brand-catalog.ts',
  photosSource: '@/lib/data/photo-sources.json',
  visualAssetsSource: '@/lib/dev/datasets/visual-assets.ts',
  backendSeedSource: 'proslync-backend/src/services/seed.ts',
  fullCount: FULL_ROSTER.length,
  completeCount: COMPLETE_ROSTER.length,
  realNilDealsTotal: (realNilDeals as { athletes: unknown[] }).athletes.length,
} as const;

export const CANONICAL_ROSTER_META = _meta;

mockRegistry.register({
  id: 'canonical-roster',
  description:
    'Unified athlete + brand + dev-persona roster with completeness filter (no incomplete rows leak through)',
  load: () => ({
    meta: _meta,
    rows: COMPLETE_ROSTER,
  }),
});
