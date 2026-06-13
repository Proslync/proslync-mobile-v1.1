// ── ROLE ACCENT HELPER ────────────────────────────────────
// Bridge ProfileRole → hex string for surface tinting.
// RoleAccent in constants/brand.ts is keyed on the brand-asset vocabulary
// (athlete / admin); ProfileRole in role-provider uses runtime keys
// (player / nilManager). This mapper hides the drift.
//
// Single source of truth for "what color is this role?" across the
// top app bar, surface pill bar, role hero greeting, and any future
// role-aware surface chrome.

import { Brand, RoleAccent } from '@/constants/brand';
import type { ProfileRole } from '@/lib/providers/role-provider';

const PROFILE_TO_ACCENT_KEY: Record<ProfileRole, keyof typeof RoleAccent> = {
  player: 'athlete',
  coach: 'coach',
  agent: 'agent',
  brand: 'brand',
  fan: 'fan',
  school: 'school',
  nilManager: 'admin',
  // collective is the money seat — maps to brand (payer side) accent
  collective: 'brand',
};

export function getRoleAccent(role: ProfileRole): string {
  const key = PROFILE_TO_ACCENT_KEY[role];
  return RoleAccent[key] ?? Brand.colors.copper;
}
