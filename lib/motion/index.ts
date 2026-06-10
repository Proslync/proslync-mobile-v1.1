// ── MOTION BARREL ─────────────────────────────────────────
// Canonical motion vocabulary for the Proslync app. The four-verb library
// (glow / reveal / drift / pulse) lives in `scenes.ts`; the small low-level
// hooks (count-up, shimmer, spring-press, success-haptic) re-export here
// for convenient import.
//
// Spec: atlas/design/2026-04-15/motion-choreography-2026-04-15.md

export {
  SceneTiming,
  heroReveal,
  listStagger,
  useAmbientDrift,
  usePressRecall,
  usePrimaryCtaGlow,
  useReducedMotion,
  useStatPulse,
} from './scenes';

export { useCountUp } from './use-count-up';
export { useShimmer } from './use-shimmer';
export { useSpringPress } from './use-spring-press';
export {
  useLightHaptic,
  useMediumHaptic,
  useSuccessHaptic,
} from './use-success-haptic';
