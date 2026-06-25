// lib/demo/personas.ts
// ── CANONICAL PER-ROLE DEMO IDENTITY ─────────────────────────────────────
// Each role gets a DISTINCT visual identity: name, handle, accent, gradient
// banner colors, tagline, and initials.
//
// Usage:
//   import { personaFor, ROLE_PERSONA } from '@/lib/demo/personas';
//   const p = personaFor('coach'); // → RolePersona

import type { ProfileRole } from '@/lib/providers/role-provider';

export interface RolePersona {
  role: ProfileRole;
  displayName: string;
  handle: string;
  initials: string;
  /** Primary accent hex — used for chips, borders, tab icon tint. */
  accent: string;
  tagline: string;
  /** LinearGradient start/end colors for the gradient banner. */
  bannerColors: [string, string];
  /**
   * When true, the player's real photo should be used instead of initials.
   * All other roles use the initials avatar + gradient banner.
   */
  usePhoto?: boolean;
}

export const ROLE_PERSONA: Record<ProfileRole, RolePersona> = {
  player: {
    role: 'player',
    displayName: 'Kiyan Anthony',
    handle: '@kiyananthony',
    initials: 'KA',
    accent: '#EB621A',
    tagline: "Guard · Syracuse · '28",
    bannerColors: ['#3D1A00', '#1A0900'],
    usePhoto: true,
  },
  coach: {
    role: 'coach',
    displayName: 'Glenn Farello',
    handle: '@coachfarello',
    initials: 'GF',
    accent: '#3B82F6',
    tagline: 'Head Coach · Paul VI',
    bannerColors: ['#0A1929', '#0D2137'],
  },
  agent: {
    role: 'agent',
    displayName: 'Marcus Webb',
    handle: '@marcuswebb',
    initials: 'MW',
    accent: '#8B5CF6',
    tagline: 'NIL Agent · Verified rep',
    bannerColors: ['#1A0A2E', '#120820'],
  },
  brand: {
    role: 'brand',
    displayName: 'Nike Hoops',
    handle: '@nikehoops',
    initials: 'NH',
    accent: '#00C6B0',
    tagline: 'Performance apparel · NIL partner',
    bannerColors: ['#06201C', '#0A2E28'],
  },
  fan: {
    role: 'fan',
    displayName: 'Jordan Ellis',
    handle: '@jellis',
    initials: 'JE',
    accent: '#F59E0B',
    tagline: 'Supporter · Insider tier',
    bannerColors: ['#1F1200', '#2A1800'],
  },
  school: {
    role: 'school',
    displayName: 'Syracuse Athletics',
    handle: '@cuse',
    initials: 'SA',
    accent: '#F76900',
    tagline: 'Athletic Department',
    bannerColors: ['#2A1400', '#1A0C00'],
  },
  collective: {
    role: 'collective',
    displayName: 'Orange Collective',
    handle: '@orangecollective',
    initials: 'OC',
    accent: '#EB621A',
    tagline: 'Fan-funded · AE-documented',
    bannerColors: ['#1F0D00', '#2D1200'],
  },
};

/**
 * Returns the canonical RolePersona for a given role.
 * Defaults to player if an unrecognised role is passed.
 */
export function personaFor(role: ProfileRole | string): RolePersona {
  return (ROLE_PERSONA as Record<string, RolePersona>)[role] ?? ROLE_PERSONA.player;
}
