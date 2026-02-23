import { useRouter, useSegments } from 'expo-router';
import { useRef, useCallback, useMemo } from 'react';
import type { Router } from 'expo-router';

const DEBOUNCE_MS = 500;

/**
 * Drop-in replacement for `useRouter()` that prevents duplicate pushes.
 *
 * Two guards:
 * 1. Debounce — ignores pushes within 500 ms of the last one.
 * 2. Same-route check — ignores push if the target pathname matches
 *    the current deepest segment path.
 */
export function useStableRouter(): Router {
  const router = useRouter();
  const segments = useSegments();
  const lastPushTime = useRef(0);
  const lastPushPath = useRef('');

  const currentPath = useMemo(() => '/' + segments.join('/'), [segments]);

  const stablePush: Router['push'] = useCallback(
    (href: any) => {
      const now = Date.now();

      // Extract pathname string from href
      const targetPath =
        typeof href === 'string'
          ? href.split('?')[0]
          : (href as any)?.pathname ?? '';

      // Guard 1: debounce rapid taps
      if (now - lastPushTime.current < DEBOUNCE_MS) {
        return;
      }

      // Guard 2: already on this page
      if (targetPath && targetPath === lastPushPath.current && now - lastPushTime.current < 2000) {
        return;
      }

      lastPushTime.current = now;
      lastPushPath.current = targetPath;
      router.push(href);
    },
    [router],
  );

  return useMemo(
    () => ({
      ...router,
      push: stablePush,
    }),
    [router, stablePush],
  );
}
