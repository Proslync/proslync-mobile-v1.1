import { useCallback, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api/analytics';

const TRACK_PREFIX = 'evt_view_';
const TRACK_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * In-memory cache to avoid hitting AsyncStorage on every render.
 * Populated on first check, persisted to AsyncStorage on track.
 */
const checkedThisSession = new Set<number>();

/**
 * Check if this event was already tracked within the last 24 hours
 */
async function wasRecentlyTracked(eventId: number): Promise<boolean> {
  if (checkedThisSession.has(eventId)) return true;

  try {
    const stored = await AsyncStorage.getItem(`${TRACK_PREFIX}${eventId}`);
    if (!stored) return false;

    const timestamp = parseInt(stored, 10);
    if (Date.now() - timestamp < TRACK_TTL_MS) {
      checkedThisSession.add(eventId);
      return true;
    }

    // Expired — clean up
    await AsyncStorage.removeItem(`${TRACK_PREFIX}${eventId}`);
    return false;
  } catch {
    return false;
  }
}

/**
 * Clear all tracking cache (in-memory + AsyncStorage).
 * Call this when resetting analytics data.
 */
export async function clearTrackingCache(): Promise<void> {
  checkedThisSession.clear();
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const trackKeys = allKeys.filter((k) => k.startsWith(TRACK_PREFIX));
    if (trackKeys.length > 0) {
      await AsyncStorage.multiRemove(trackKeys);
    }
  } catch {
    // Non-critical
  }
}

/**
 * Mark this event as tracked
 */
async function markTracked(eventId: number): Promise<void> {
  checkedThisSession.add(eventId);
  try {
    await AsyncStorage.setItem(
      `${TRACK_PREFIX}${eventId}`,
      String(Date.now()),
    );
  } catch {
    // Non-critical — in-memory cache still works
  }
}

/**
 * Hook to track event page view on mobile
 *
 * Dedup strategy (3 layers):
 * 1. In-memory Set — instant check, no I/O (per app process)
 * 2. AsyncStorage with 24h TTL — survives app kills, max 1 view/day/event
 * 3. Backend 30s rate limit + unique constraints — final safety net
 *
 * The backend's uniqueVisitors metric (DISTINCT user_id/ip) is the
 * true dedup for analytics — frontend dedup just reduces API noise.
 */
export function useTrackEventView(eventId: number | undefined) {
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasTrackedRef = useRef(false);

  const trackMutation = useMutation({
    mutationFn: (id: number) => analyticsApi.trackEventView(id, 'mobile'),
    onError: () => {
      // Silent fail — tracking errors should never affect UX
    },
  });

  const trackView = useCallback(() => {
    if (!eventId || eventId <= 0 || hasTrackedRef.current) return;

    // Clear any pending debounce
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce 1.5s — if user navigates away quickly, we don't count it
    debounceTimerRef.current = setTimeout(async () => {
      const alreadyTracked = await wasRecentlyTracked(eventId);
      if (alreadyTracked) {
        hasTrackedRef.current = true;
        return;
      }

      trackMutation.mutate(eventId, {
        onSuccess: () => {
          markTracked(eventId);
          hasTrackedRef.current = true;
        },
      });
    }, 1500);
  }, [eventId, trackMutation]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return { trackView };
}
