// School logo registry — maps display names (and common variants) onto
// bundled asset sources. Used by:
//   • GameCard team rows (components/explore/sections/games-rail.tsx)
//   • SchoolRow in DiscoveryBlock (components/explore/sections/discovery-block.tsx)
//
// When a name doesn't resolve, callers should fall back to a styled
// placeholder (initials tile or Ionicons "school" badge). To add more
// logos, drop the asset under assets/images/schools/<slug>.png and add
// the require() + name variants below.

import type { ImageSourcePropType } from 'react-native';

const DUKE = require('@/assets/images/schools/duke.png');
const LSU = require('@/assets/images/schools/lsu.png');
const NOTRE_DAME = require('@/assets/images/schools/notre-dame.png');
const RUTGERS = require('@/assets/images/schools/rutgers.png');
const SYRACUSE = require('@/assets/images/schools/syracuse.png');
const TEXAS = require('@/assets/images/schools/texas.png');
const USC = require('@/assets/images/schools/usc.png');

/**
 * School-name → image-source lookup. Keys are matched case-insensitively
 * and ignore leading/trailing whitespace. Variants exist for nicknames
 * (e.g. "Cuse" → Syracuse) and shortened forms (e.g. "ND" → Notre Dame).
 */
const REGISTRY: Record<string, ImageSourcePropType> = {
  duke: DUKE,
  'duke university': DUKE,
  'duke blue devils': DUKE,
  lsu: LSU,
  'louisiana state': LSU,
  'lsu tigers': LSU,
  'notre dame': NOTRE_DAME,
  nd: NOTRE_DAME,
  'fighting irish': NOTRE_DAME,
  rutgers: RUTGERS,
  'rutgers scarlet knights': RUTGERS,
  syracuse: SYRACUSE,
  'syracuse orange': SYRACUSE,
  cuse: SYRACUSE,
  'cuse lockdown': SYRACUSE,
  texas: TEXAS,
  'texas longhorns': TEXAS,
  'university of texas': TEXAS,
  usc: USC,
  'usc trojans': USC,
  'southern california': USC,
};

/**
 * Resolve a school logo by name. Returns undefined when no logo is
 * bundled — callers render a fallback (initials tile or Ionicon).
 */
export function getSchoolLogo(name: string | undefined | null): ImageSourcePropType | undefined {
  if (!name) return undefined;
  return REGISTRY[name.trim().toLowerCase()];
}
