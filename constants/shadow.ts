import { DesignCeilings } from './brand';

const ceilings = DesignCeilings.shadow;

/**
 * Shadow presets — read directly by components instead of reaching into DesignCeilings.
 * `cta` is the single allowed "bloom" per screen (per design ceilings).
 */
export const Shadow = {
  none: {
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  default: {
    shadowColor: '#000',
    shadowOpacity: ceilings.defaultOpacity,
    shadowRadius: ceilings.defaultRadius,
    shadowOffset: { width: 0, height: 2 },
    elevation: ceilings.defaultElevation,
  },
  cta: {
    shadowColor: '#000',
    shadowOpacity: ceilings.ctaOpacity,
    shadowRadius: ceilings.ctaRadius,
    shadowOffset: { width: 0, height: 3 },
    elevation: ceilings.ctaElevation,
  },
} as const;

export type ShadowToken = keyof typeof Shadow;
