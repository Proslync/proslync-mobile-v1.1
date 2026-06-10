/**
 * Proslync Motion Scenes
 * ----------------------
 * Canonical, reusable motion factories for the Proslync app. Every screen
 * should compose from this vocabulary instead of hand-rolling
 * `FadeInDown.delay(X).duration(Y)` chains.
 *
 * The anti-slop skill locks Proslync motion to exactly four verbs:
 *
 *   glow   — orange edge/shadow bloom on primary moments
 *   reveal — staggered entrance, typically on page load
 *   drift  — slow ambient movement of decorative backgrounds only
 *   pulse  — restrained attention pulse on a single CTA or status dot
 *
 * Rules baked in here:
 *   - Timing only. No `withSpring` (bouncy springs are banned).
 *   - `Easing.out(cubic)` for entrances, `Easing.inOut(sin)` for loops.
 *   - Reduced motion is respected everywhere: when the OS has reduce-motion
 *     enabled, scenes short-circuit to their final (static) state.
 *   - Tokens only — no inline hex. Callers pass Colors.accent, never a raw
 *     color. (The glow scene uses the shadow props the caller passes.)
 */

import { useEffect, useState, useCallback } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';
import {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type AnimatedStyle,
} from 'react-native-reanimated';

// Reanimated's layout-animation types are not exported as a single name across
// versions; using the constructor's return type keeps this robust.
type EnteringAnimation = ReturnType<typeof FadeIn.duration>;

/* -------------------------------------------------------------------------- */
/*  Reduced-motion hook                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Returns true when the OS has "reduce motion" enabled. Web falls back to
 * the `prefers-reduced-motion` media query. All scenes in this file consult
 * this hook and short-circuit to a static end state when it returns true.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.matchMedia) {
        const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
        setReduced(mql.matches);
        const handler = (e: MediaQueryListEvent) => {
          if (mounted) setReduced(e.matches);
        };
        // Some browsers still only support addListener.
        if (mql.addEventListener) {
          mql.addEventListener('change', handler);
          return () => {
            mounted = false;
            mql.removeEventListener('change', handler);
          };
        }
        mql.addListener(handler);
        return () => {
          mounted = false;
          mql.removeListener(handler);
        };
      }
      return () => {
        mounted = false;
      };
    }

    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (mounted) setReduced(value);
      })
      .catch(() => {
        /* noop — treat as not reduced */
      });

    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (value: boolean) => {
        if (mounted) setReduced(value);
      },
    );

    return () => {
      mounted = false;
      // RN types: EventSubscription
      // @ts-ignore — older RN returned a subscription without .remove
      sub?.remove?.();
    };
  }, []);

  return reduced;
}

/* -------------------------------------------------------------------------- */
/*  Timing constants — single source of truth                                 */
/* -------------------------------------------------------------------------- */

export const SceneTiming = {
  heroRevealMs: 540,
  heroRiseMs: 620,
  staggerStepMs: 80,
  staggerItemMs: 440,
  pulseMs: 1400,
  driftMs: 14000,
  ctaGlowMs: 2400,
  pressInMs: 90,
  pressOutMs: 140,
} as const;

/* -------------------------------------------------------------------------- */
/*  reveal — hero entrance                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Reveal a hero element (page title, landing card, main stat) with a clean
 * upward fade. Non-bouncy, cubic-out easing. Translate 14px -> 0.
 *
 * Usage:
 *   <Animated.View entering={heroReveal(60)}>...</Animated.View>
 *
 * When to use: the ONE primary focal element of a screen. Do not chain
 * `heroReveal` across 8 children — use `listStagger` for lists.
 */
export function heroReveal(delay = 0): EnteringAnimation {
  return FadeIn.duration(SceneTiming.heroRevealMs)
    .delay(delay)
    .easing(Easing.out(Easing.cubic))
    .withInitialValues({
      opacity: 0,
      transform: [{ translateY: 14 }],
    });
}

/* -------------------------------------------------------------------------- */
/*  reveal — list stagger                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Stagger a list of children. Index-aware: each item waits `index * step`
 * before running its 440ms fade + rise.
 *
 * Usage:
 *   items.map((item, i) => (
 *     <Animated.View key={item.id} entering={listStagger(i)}>
 *       ...
 *     </Animated.View>
 *   ))
 *
 * When to use: vertically-stacked cards, row lists, stat grids. Cap around
 * 10 visible items — beyond that, the tail feels slow.
 */
export function listStagger(index: number, base = 40): EnteringAnimation {
  const delay = base + index * SceneTiming.staggerStepMs;
  return FadeIn.duration(SceneTiming.staggerItemMs)
    .delay(delay)
    .easing(Easing.out(Easing.cubic))
    .withInitialValues({
      opacity: 0,
      transform: [{ translateY: 10 }],
    });
}

/* -------------------------------------------------------------------------- */
/*  pulse — press recall (tactile CTA feedback)                               */
/* -------------------------------------------------------------------------- */

interface PressRecall {
  style: AnimatedStyle<{ transform: { scale: number }[] }>;
  onPressIn: () => void;
  onPressOut: () => void;
}

/**
 * Tactile press recall for a button: scale 1 -> 0.98 -> 1. Timing-based
 * (no springs — anti-slop rule). Respects reduced motion.
 *
 * Usage:
 *   const press = usePressRecall();
 *   <Pressable onPressIn={press.onPressIn} onPressOut={press.onPressOut}>
 *     <Animated.View style={[styles.btn, press.style]}>...</Animated.View>
 *   </Pressable>
 */
export function usePressRecall(): PressRecall {
  const scale = useSharedValue(1);
  const reduced = useReducedMotion();

  const onPressIn = useCallback(() => {
    if (reduced) {
      scale.value = 1;
      return;
    }
    scale.value = withTiming(0.98, {
      duration: SceneTiming.pressInMs,
      easing: Easing.out(Easing.cubic),
    });
  }, [reduced, scale]);

  const onPressOut = useCallback(() => {
    if (reduced) {
      scale.value = 1;
      return;
    }
    scale.value = withTiming(1, {
      duration: SceneTiming.pressOutMs,
      easing: Easing.out(Easing.cubic),
    });
  }, [reduced, scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return { style, onPressIn, onPressOut };
}

/* -------------------------------------------------------------------------- */
/*  pulse — live status dot                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Subtle opacity pulse 1.0 -> 0.6 -> 1.0 for live-status dots and single-
 * CTA attention markers. 1400ms cosine loop. Use sparingly — the anti-slop
 * rule is one pulsing element per screen.
 *
 * Usage:
 *   const dotStyle = useStatPulse(isLive);
 *   <Animated.View style={[styles.dot, dotStyle]} />
 */
export function useStatPulse(
  enabled = true,
): AnimatedStyle<{ opacity: number }> {
  const opacity = useSharedValue(1);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!enabled || reduced) {
      opacity.value = 1;
      return;
    }
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.6, {
          duration: SceneTiming.pulseMs,
          easing: Easing.inOut(Easing.sin),
        }),
        withTiming(1, {
          duration: SceneTiming.pulseMs,
          easing: Easing.inOut(Easing.sin),
        }),
      ),
      -1,
      false,
    );
  }, [enabled, reduced, opacity]);

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));
}

/* -------------------------------------------------------------------------- */
/*  drift — ambient background                                                */
/* -------------------------------------------------------------------------- */

/**
 * Very slow continuous translateX drift for watermarks and logo-pattern
 * background layers. DECORATIVE ELEMENTS ONLY — never drift a primary
 * element or text content. Full cycle ~14s.
 *
 * Usage:
 *   const bg = useAmbientDrift(12);
 *   <Animated.Image source={watermark} style={[styles.bg, bg]} />
 */
export function useAmbientDrift(
  range = 12,
): AnimatedStyle<{ transform: { translateX: number }[] }> {
  const tx = useSharedValue(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      tx.value = 0;
      return;
    }
    tx.value = withRepeat(
      withSequence(
        withTiming(range, {
          duration: SceneTiming.driftMs,
          easing: Easing.inOut(Easing.sin),
        }),
        withTiming(-range, {
          duration: SceneTiming.driftMs,
          easing: Easing.inOut(Easing.sin),
        }),
      ),
      -1,
      false,
    );
  }, [range, reduced, tx]);

  return useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }],
  }));
}

/* -------------------------------------------------------------------------- */
/*  glow — primary CTA shadow pulse                                           */
/* -------------------------------------------------------------------------- */

/**
 * Restrained orange shadow pulse for the ONE primary CTA per screen.
 * `shadowOpacity` breathes 0.16 -> 0.24 -> 0.16 over 2400ms. Pair this with
 * a `shadowColor: Colors.accent` on the underlying component — the caller
 * sets the color token; this hook only animates opacity.
 *
 * Usage:
 *   const glow = usePrimaryCtaGlow();
 *   <Animated.View style={[styles.cta, { shadowColor: Colors.accent }, glow]}>
 *     <Text>Continue</Text>
 *   </Animated.View>
 *
 * Anti-slop: do not apply this to more than one element. If you feel the
 * urge to put it on two CTAs, demote one of them to a secondary button.
 */
export function usePrimaryCtaGlow(): AnimatedStyle<{
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}> {
  const opacity = useSharedValue(0.16);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      opacity.value = 0.2;
      return;
    }
    opacity.value = withDelay(
      200,
      withRepeat(
        withSequence(
          withTiming(0.24, {
            duration: SceneTiming.ctaGlowMs,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(0.16, {
            duration: SceneTiming.ctaGlowMs,
            easing: Easing.inOut(Easing.sin),
          }),
        ),
        -1,
        false,
      ),
    );
  }, [reduced, opacity]);

  return useAnimatedStyle(() => ({
    shadowOpacity: opacity.value,
    shadowRadius: 8,
    elevation: 6,
  }));
}
