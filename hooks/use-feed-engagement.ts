import * as React from 'react';
import { AppState } from 'react-native';
import {
  engagementApi,
  type EngagementSignal,
} from '@/lib/api/engagement';
import type { FeedItem } from '@/lib/types/feed.types';
import type { FeedTab } from '@/lib/types/feed.types';

const FLUSH_INTERVAL_MS = 15_000; // Send batch every 15 seconds
const SCROLL_PAST_THRESHOLD_MS = 1000; // <1s dwell = scroll-past

interface ActiveItemState {
  item: FeedItem;
  index: number;
  startTime: number;
}

/**
 * Tracks feed engagement signals (dwell time, scroll-past, video watch, etc.)
 * and batches them to the backend every 15 seconds.
 *
 * Instagram's #1 ranking signal is dwell time — how long a user looks at content.
 * This hook captures that signal for every feed item the user views.
 */
export function useFeedEngagement(feedType: FeedTab) {
  const signalQueue = React.useRef<EngagementSignal[]>([]);
  const activeItem = React.useRef<ActiveItemState | null>(null);
  const flushTimer = React.useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  // Flush queued signals to backend
  const flush = React.useCallback(() => {
    if (signalQueue.current.length === 0) return;

    const signals = [...signalQueue.current];
    signalQueue.current = [];

    engagementApi
      .trackEngagement({ feedType, signals })
      .catch(() => {}); // Fire-and-forget
  }, [feedType]);

  // Record signal for the item that just became inactive
  const recordSignal = React.useCallback(
    (
      item: FeedItem,
      index: number,
      dwellTimeMs: number,
      extras?: Partial<EngagementSignal>,
    ) => {
      if (!item.userId) return;

      const postId = parseInt(item.id, 10);
      const authorId = parseInt(item.userId, 10);
      if (isNaN(postId) || isNaN(authorId)) return;

      signalQueue.current.push({
        postId,
        authorId,
        dwellTimeMs: Math.round(dwellTimeMs),
        didScrollPast: dwellTimeMs < SCROLL_PAST_THRESHOLD_MS,
        feedPosition: index,
        ...extras,
      });
    },
    [],
  );

  /**
   * Called when the active feed item changes.
   * Records dwell time for the previous item and starts tracking the new one.
   */
  const onActiveItemChange = React.useCallback(
    (item: FeedItem | null, index: number) => {
      // Finalize the previous item
      if (activeItem.current) {
        const dwellTime = Date.now() - activeItem.current.startTime;
        recordSignal(activeItem.current.item, activeItem.current.index, dwellTime);
      }

      // Start tracking the new item
      if (item) {
        activeItem.current = {
          item,
          index,
          startTime: Date.now(),
        };
      } else {
        activeItem.current = null;
      }
    },
    [recordSignal],
  );

  /**
   * Record that the user liked a post from the feed.
   */
  const recordLike = React.useCallback(
    (item: FeedItem, index: number) => {
      recordSignal(item, index, 0, { didLike: true });
    },
    [recordSignal],
  );

  /**
   * Record that the user commented on a post from the feed.
   */
  const recordComment = React.useCallback(
    (item: FeedItem, index: number) => {
      recordSignal(item, index, 0, { didComment: true });
    },
    [recordSignal],
  );

  /**
   * Record that the user shared a post from the feed.
   */
  const recordShare = React.useCallback(
    (item: FeedItem, index: number) => {
      recordSignal(item, index, 0, { didShare: true });
    },
    [recordSignal],
  );

  /**
   * Record that the user tapped to view the author's profile.
   */
  const recordProfileView = React.useCallback(
    (item: FeedItem, index: number) => {
      recordSignal(item, index, 0, { didViewProfile: true });
    },
    [recordSignal],
  );

  /**
   * Record video watch percentage when video playback ends or item changes.
   */
  const recordVideoWatch = React.useCallback(
    (item: FeedItem, index: number, watchPercent: number) => {
      recordSignal(item, index, 0, {
        videoWatchPercent: Math.round(Math.min(watchPercent, 100)),
      });
    },
    [recordSignal],
  );

  // Set up flush interval and app state listener
  React.useEffect(() => {
    flushTimer.current = setInterval(flush, FLUSH_INTERVAL_MS);

    // Flush on app background
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        // Finalize current active item before background
        if (activeItem.current) {
          const dwellTime = Date.now() - activeItem.current.startTime;
          recordSignal(
            activeItem.current.item,
            activeItem.current.index,
            dwellTime,
          );
          activeItem.current = null;
        }
        flush();
      }
    });

    return () => {
      if (flushTimer.current) clearInterval(flushTimer.current);
      subscription.remove();

      // Finalize and flush on unmount
      if (activeItem.current) {
        const dwellTime = Date.now() - activeItem.current.startTime;
        recordSignal(
          activeItem.current.item,
          activeItem.current.index,
          dwellTime,
        );
      }
      flush();
    };
  }, [flush, recordSignal]);

  return {
    onActiveItemChange,
    recordLike,
    recordComment,
    recordShare,
    recordProfileView,
    recordVideoWatch,
  };
}
