import { useRouter } from 'expo-router';
import { useRef, useCallback, useMemo } from 'react';
import type { Router } from 'expo-router';

/**
 * Drop-in replacement for `useRouter()` that prevents duplicate pushes.
 *
 * Guards:
 * 1. Navigation lock — blocks pushes while a previous one is still settling.
 * 2. Rapid-tap debounce — ignores pushes within 250ms of the last one.
 */
export function useStableRouter(): Router {
  const router = useRouter();
  const lastPushTime = useRef(0);
  const isNavigating = useRef(false);

  const stablePush: Router['push'] = useCallback(
    (href: any) => {
      const now = Date.now();

      // Guard 1: block if currently navigating
      if (isNavigating.current) return;

      // Guard 2: debounce rapid taps (250ms)
      if (now - lastPushTime.current < 250) return;

      lastPushTime.current = now;
      isNavigating.current = true;

      // Unlock after navigation animation settles
      setTimeout(() => {
        isNavigating.current = false;
      }, 350);

      router.push(href);
    },
    [router],
  );

  const stableReplace: Router['replace'] = useCallback(
    (href: any) => {
      const now = Date.now();
      if (isNavigating.current) return;
      if (now - lastPushTime.current < 250) return;

      lastPushTime.current = now;
      isNavigating.current = true;
      setTimeout(() => { isNavigating.current = false; }, 350);

      router.replace(href);
    },
    [router],
  );

  return useMemo(
    () => ({
      ...router,
      push: stablePush,
      replace: stableReplace,
    }),
    [router, stablePush, stableReplace],
  );
}
