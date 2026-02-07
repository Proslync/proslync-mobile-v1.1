import type { GradientConfig } from './types';

/**
 * Dark overlay gradient — used as the scrim behind feed items.
 * Pulled directly from feed-item.tsx.
 */
export const darkOverlay: GradientConfig = {
  colors: [
    'rgba(0, 0, 0, 0.35)',
    'rgba(0, 0, 0, 0.35)',
    'rgba(0, 0, 0, 0.6)',
    'rgba(0, 0, 0, 0.9)',
    '#000',
    '#000',
  ],
  locations: [0, 0.7, 0.8, 0.88, 0.93, 1],
};

/**
 * Shimmer sweep — horizontal highlight used in skeleton loaders.
 * Pulled directly from feed-skeleton.tsx.
 */
export const shimmerSweep: GradientConfig = {
  colors: [
    'transparent',
    'rgba(255, 255, 255, 0.08)',
    'rgba(255, 255, 255, 0.15)',
    'rgba(255, 255, 255, 0.08)',
    'transparent',
  ],
  start: { x: 0, y: 0.5 },
  end: { x: 1, y: 0.5 },
};

/**
 * Ambient accent — subtle blue-to-transparent glow.
 */
export const ambientAccent: GradientConfig = {
  colors: [
    'rgba(0, 149, 246, 0.15)',
    'rgba(0, 149, 246, 0.05)',
    'transparent',
  ],
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
};

/**
 * Corner accent — top-left corner highlight for cards.
 */
export const cornerAccent: GradientConfig = {
  colors: [
    'rgba(255, 255, 255, 0.12)',
    'rgba(255, 255, 255, 0.04)',
    'transparent',
  ],
  locations: [0, 0.4, 1],
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
};
