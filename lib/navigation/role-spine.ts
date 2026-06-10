import Ionicons from '@expo/vector-icons/Ionicons';

import type { ProfileRole } from '@/lib/providers/role-provider';

// ============================================================================
// PRO-MODE SPINE - 4 universal tabs
// ----------------------------------------------------------------------------
// The visible pro mobile contract is Home / Work / Triad / Account. Work is the
// role-specific cockpit. Triad keeps the route key `explore`, but absorbs the
// old top-level Deals/Network meanings into one shared proof, discovery, and
// action surface.
// ============================================================================
export const ROLE_SPINE_SLOT_ORDER = ['home', 'work', 'explore', 'account'] as const;
export type RoleSpineSlot = typeof ROLE_SPINE_SLOT_ORDER[number];

export const ROLE_SPINE_ROUTE_ORDER = ['index', 'activity', 'explore', 'profile'] as const;
export type RoleSpineRouteName = typeof ROLE_SPINE_ROUTE_ORDER[number];

export type RoleSpineIconName = keyof typeof Ionicons.glyphMap;

export interface RoleSpineItem {
  slot: RoleSpineSlot;
  routeName: RoleSpineRouteName;
  route: `/(tabs)/${RoleSpineRouteName}`;
  label: string;
  icon: RoleSpineIconName;
  selectedIcon: RoleSpineIconName;
  color: string;
  surface: string;
  objectEmphasis: string;
}

type RoleSpineTuple = readonly [
  RoleSpineItem,
  RoleSpineItem,
  RoleSpineItem,
  RoleSpineItem,
];

const SLOT_ROUTES: Record<RoleSpineSlot, RoleSpineRouteName> = {
  home: 'index',
  work: 'activity',
  explore: 'explore',
  account: 'profile',
};

const SLOT_VISUALS: Record<
  RoleSpineSlot,
  Pick<RoleSpineItem, 'icon' | 'selectedIcon' | 'color' | 'surface'>
> = {
  home: {
    icon: 'home-outline',
    selectedIcon: 'home',
    color: '#FF9B73',
    surface: 'rgba(255,111,60,0.18)',
  },
  work: {
    icon: 'grid-outline',
    selectedIcon: 'grid',
    color: '#DDF0E9',
    surface: 'rgba(221,240,233,0.14)',
  },
  explore: {
    icon: 'compass-outline',
    selectedIcon: 'compass',
    // Soft warm amber — role-agnostic exploration. Previously `#C8A2FF` /
    // `rgba(168,85,247,0.14)`, but that violet collided with the Fan
    // persona accent (`#A855F7`) on every non-fan surface that used the
    // explore slot.
    color: '#F2C94C',
    surface: 'rgba(242,201,76,0.14)',
  },
  account: {
    icon: 'person-outline',
    selectedIcon: 'person',
    color: '#E9DFF3',
    surface: 'rgba(233,223,243,0.14)',
  },
};

// Universal labels. Role-specific surface vocabulary lives inside each tab's
// content and floating chrome, never in the bar itself.
const SLOT_LABELS: Record<RoleSpineSlot, string> = {
  home: 'Home',
  work: 'Work',
  explore: 'Triad',
  account: 'Account',
};

const ROLE_OBJECTS: Record<ProfileRole, Record<RoleSpineSlot, string>> = {
  player: {
    home: 'Athlete dashboard and match snapshot',
    work: 'OpenDeal opportunities and applications',
    explore: 'Deal proof, opportunities, and shared discovery',
    account: 'Athlete profile and permissions',
  },
  brand: {
    home: 'Brand HQ command state',
    work: 'OpenDeal pipeline and applicant review',
    explore: 'Campaign proof, applicant discovery, and shared market context',
    account: 'Brand organization profile',
  },
  agent: {
    home: 'Represented athlete roster',
    work: 'Inbound offers and review queue',
    explore: 'Deal lifecycle, offer proof, messages, and shared discovery',
    account: 'Agent identity and settings',
  },
  coach: {
    home: 'Team roster and team pulse',
    work: 'Practice, film, and development plan',
    explore: 'NIL watch context, calendar signals, and shared discovery',
    account: 'Coach profile and settings',
  },
  fan: {
    home: 'Fan home and athlete signal',
    work: 'Athlete follows and discovery',
    explore: 'Drops, community, games, and shared discovery',
    account: 'Fan profile and settings',
  },
  school: {
    home: 'AD audit-defense cockpit',
    work: 'Roster and school-side deal visibility',
    explore: 'Compliance proof, rev-share context, and shared discovery',
    account: 'School profile and controls',
  },
  nilManager: {
    home: 'Compliance queue',
    work: 'Disclosure intake and consent state',
    explore: 'Evidence packets, disclosure context, and shared discovery',
    account: 'NIL Manager profile and controls',
  },
};

function buildItem(role: ProfileRole, slot: RoleSpineSlot): RoleSpineItem {
  const routeName = SLOT_ROUTES[slot];
  return {
    slot,
    routeName,
    route: `/(tabs)/${routeName}`,
    label: SLOT_LABELS[slot],
    objectEmphasis: ROLE_OBJECTS[role][slot],
    ...SLOT_VISUALS[slot],
  };
}

export const ROLE_SPINES: Record<ProfileRole, RoleSpineTuple> = {
  player: ROLE_SPINE_SLOT_ORDER.map((slot) => buildItem('player', slot)) as unknown as RoleSpineTuple,
  coach: ROLE_SPINE_SLOT_ORDER.map((slot) => buildItem('coach', slot)) as unknown as RoleSpineTuple,
  agent: ROLE_SPINE_SLOT_ORDER.map((slot) => buildItem('agent', slot)) as unknown as RoleSpineTuple,
  brand: ROLE_SPINE_SLOT_ORDER.map((slot) => buildItem('brand', slot)) as unknown as RoleSpineTuple,
  fan: ROLE_SPINE_SLOT_ORDER.map((slot) => buildItem('fan', slot)) as unknown as RoleSpineTuple,
  school: ROLE_SPINE_SLOT_ORDER.map((slot) => buildItem('school', slot)) as unknown as RoleSpineTuple,
  nilManager: ROLE_SPINE_SLOT_ORDER.map((slot) => buildItem('nilManager', slot)) as unknown as RoleSpineTuple,
};

export function getRoleSpine(role: ProfileRole): RoleSpineTuple {
  return ROLE_SPINES[role];
}

export function getRoleSpineItem(role: ProfileRole, slot: RoleSpineSlot): RoleSpineItem {
  const item = ROLE_SPINES[role].find((candidate) => candidate.slot === slot);
  if (!item) {
    throw new Error(`Missing role spine item for ${role}:${slot}`);
  }
  return item;
}

export function getRoleSpineItemByRoute(
  role: ProfileRole,
  routeName: RoleSpineRouteName,
): RoleSpineItem {
  const item = ROLE_SPINES[role].find((candidate) => candidate.routeName === routeName);
  if (!item) {
    throw new Error(`Missing role spine route for ${role}:${routeName}`);
  }
  return item;
}

export function getRouteForRoleSlot(role: ProfileRole, slot: RoleSpineSlot): string {
  return getRoleSpineItem(role, slot).route;
}

// ============================================================================
// Fan-mode spine — Phase 1 Slice A
// ----------------------------------------------------------------------------
// Fan-mode is bifurcated into its own 4-tab bottom nav (Home / Explore /
// Pickem / Account). It lives under `app/(fan-tabs)/` and is rendered by the
// `<PastelTabBar />`. Pro mode uses NativeTabs, so `useMode()` decides which
// shell renders before this route vocabulary is consumed.
//
// The fan spine is intentionally NOT keyed by ProfileRole — when the user
// is in fan mode there is only one role (fan), so a single record of slots
// suffices.
// ============================================================================

export const FAN_MODE_SLOT_ORDER = ['home', 'dashboard', 'explore', 'account'] as const;
export type FanModeSlot = typeof FAN_MODE_SLOT_ORDER[number];

export const FAN_MODE_ROUTE_ORDER = ['index', 'dashboard', 'explore', 'profile'] as const;
export type FanModeRouteName = typeof FAN_MODE_ROUTE_ORDER[number];

export interface FanModeSpineItem {
  slot: FanModeSlot;
  routeName: FanModeRouteName;
  route: `/(fan-tabs)/${FanModeRouteName}`;
  label: string;
  icon: RoleSpineIconName;
  selectedIcon: RoleSpineIconName;
  color: string;
  surface: string;
  objectEmphasis: string;
}

const FAN_SLOT_ROUTES: Record<FanModeSlot, FanModeRouteName> = {
  home: 'index',
  dashboard: 'dashboard',
  explore: 'explore',
  account: 'profile',
};

// Visuals reuse the existing SLOT_VISUALS aesthetic. The slot-2 work/grid
// icon is shared with the pro-side `SLOT_VISUALS.work` so the square-icon
// vocabulary reads consistently across fan and pro shells; the prior
// trophy-outline custom pairing was retired during fan-dashboard-remix-
// 2026-05-12 (Pickem is no longer a top-level fan tab — it's a section
// inside Dashboard).
const FAN_SLOT_VISUALS: Record<
  FanModeSlot,
  Pick<FanModeSpineItem, 'icon' | 'selectedIcon' | 'color' | 'surface'>
> = {
  home: SLOT_VISUALS.home,
  dashboard: SLOT_VISUALS.work,
  explore: SLOT_VISUALS.explore,
  account: SLOT_VISUALS.account,
};

const FAN_SLOT_LABELS: Record<FanModeSlot, string> = {
  home: 'Home',
  dashboard: 'Fan Hub',
  explore: 'Explore',
  account: 'Account',
};

const FAN_SLOT_OBJECTS: Record<FanModeSlot, string> = {
  home: 'Fan HQ — tier, score, leaderboard, live athletes, picks & perks',
  dashboard: 'Fan Hub — social feed of posts, highlights, and athlete updates',
  explore: 'Live games, school directory, and discovery (unauth-friendly)',
  account: 'Fan profile, settings, and mode switcher',
};

function buildFanItem(slot: FanModeSlot): FanModeSpineItem {
  const routeName = FAN_SLOT_ROUTES[slot];
  return {
    slot,
    routeName,
    route: `/(fan-tabs)/${routeName}`,
    label: FAN_SLOT_LABELS[slot],
    objectEmphasis: FAN_SLOT_OBJECTS[slot],
    ...FAN_SLOT_VISUALS[slot],
  };
}

type FanModeSpineTuple = readonly [
  FanModeSpineItem,
  FanModeSpineItem,
  FanModeSpineItem,
  FanModeSpineItem,
];

export const FAN_MODE_SPINE: FanModeSpineTuple = FAN_MODE_SLOT_ORDER.map((slot) =>
  buildFanItem(slot),
) as unknown as FanModeSpineTuple;

export function getFanRouteSpineItem(routeName: FanModeRouteName): FanModeSpineItem {
  const item = FAN_MODE_SPINE.find((candidate) => candidate.routeName === routeName);
  if (!item) {
    throw new Error(`Missing fan-mode spine route for ${routeName}`);
  }
  return item;
}

export function getFanSpineItem(slot: FanModeSlot): FanModeSpineItem {
  const item = FAN_MODE_SPINE.find((candidate) => candidate.slot === slot);
  if (!item) {
    throw new Error(`Missing fan-mode spine slot for ${slot}`);
  }
  return item;
}
