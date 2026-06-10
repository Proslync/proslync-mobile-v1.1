import { Easing } from 'react-native';

export const Duration = {
  instant: 120,
  fast: 200,
  normal: 300,
  slow: 500,
} as const;

export type DurationToken = keyof typeof Duration;

export const Spring = {
  gentle: { damping: 18, stiffness: 120, mass: 0.9 },
  snappy: { damping: 14, stiffness: 220, mass: 0.7 },
  sheet:  { damping: 28, stiffness: 280, mass: 1.0 },
} as const;

export type SpringToken = keyof typeof Spring;

export const Curve = {
  default:  Easing.bezier(0.32, 0.72, 0, 1),
  standard: Easing.bezier(0.2, 0, 0, 1),
  emphasized: Easing.bezier(0.05, 0.7, 0.1, 1),
} as const;
