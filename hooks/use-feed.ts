import * as React from 'react';
import type { Feed } from '@stream-io/feeds-react-native-sdk';
import { useStream } from '@/lib/providers/stream-provider';
import { mapActivityToFeedItem, getEventIdFromActivity, type FeedActivity } from '@/lib/api/feed';
import { eventsApi } from '@/lib/api/events';
import type { FeedItem, FeedTab } from '@/lib/types/feed.types';
import type { Event } from '@/lib/types/events.types';

interface UseFeedOptions {
  feedType: FeedTab;
  enabled?: boolean;
}

interface UseFeedReturn {
  items: FeedItem[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
}

const FEED_LIMIT = 20;

// ============================================================================
// GLOBAL SINGLETONS - Prevents multiple concurrent initializations
// These are module-level to persist across component mounts/unmounts
// ============================================================================
interface FeedCache {
  feed: Feed | null;
  userId: string | null;
  items: FeedItem[];
  hasMore: boolean;
  lastFetch: number;
}

const feedCaches: Map<FeedTab, FeedCache> = new Map();
let globalInitializingFeed: FeedTab | null = null;
let globalInitPromise: Promise<Feed | null> | null = null;

const EMPTY_CACHE: Omit<FeedCache, never> = { feed: null, userId: null, items: [], hasMore: true, lastFetch: 0 };

function getFeedCache(feedType: FeedTab): FeedCache {
  if (!feedCaches.has(feedType)) {
    feedCaches.set(feedType, { ...EMPTY_CACHE });
  }
  return feedCaches.get(feedType)!;
}

function clearFeedCache(feedType: FeedTab) {
  feedCaches.set(feedType, { ...EMPTY_CACHE });
  // Also clear the global init lock if it was for this feed type
  if (globalInitializingFeed === feedType) {
    globalInitializingFeed = null;
    globalInitPromise = null;
  }
}

function clearAllFeedCaches() {
  feedCaches.clear();
  globalInitializingFeed = null;
  globalInitPromise = null;
}

// ============================================================================

/**
 * Hook to fetch feed from GetStream using the React Native SDK
 * Uses Stream tokens from backend for authentication
 *
 * IMPORTANT: Uses module-level singletons to prevent duplicate initialization
 * even when multiple hook instances are created (e.g., during React.lazy remounts)
 */
export function useFeed({ feedType, enabled = true }: UseFeedOptions): UseFeedReturn {
  const { client, userId, isReady } = useStream();
  const [items, setItems] = React.useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isError, setIsError] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const [hasMore, setHasMore] = React.useState(true);

  const mountedRef = React.useRef(true);
  const lastUserIdRef = React.useRef<string | null>(null);
  const [fetchTrigger, setFetchTrigger] = React.useState(0);

  // Cleanup on unmount
  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Check for account switch and clear all caches
  React.useEffect(() => {
    if (!userId) return;

    // On actual account switch (not initial mount), clear everything and re-fetch
    if (lastUserIdRef.current !== null && lastUserIdRef.current !== userId) {
      console.log('[Feed] Account switched from', lastUserIdRef.current, 'to', userId, '- clearing all caches');
      clearAllFeedCaches();
      setItems([]);
      setHasMore(true);
      setIsLoading(true);
      setIsError(false);
      setError(null);
      // Bump trigger so the fetch effect re-runs after cache is cleared
      setFetchTrigger((n) => n + 1);
    }

    lastUserIdRef.current = userId;
  }, [userId]);

  /**
   * Initialize feed with global serialization guard
   * Prevents concurrent getOrCreate calls across all hook instances
   */
  const initializeFeed = React.useCallback(async (): Promise<Feed | null> => {
    if (!client || !userId || !isReady) {
      return null;
    }

    const cache = getFeedCache(feedType);

    // Already initialized for this user - return cached feed
    if (cache.feed && cache.userId === userId) {
      return cache.feed;
    }

    // Another initialization is in progress globally
    if (globalInitializingFeed === feedType && globalInitPromise) {
      console.log('[Feed] Waiting for existing initialization...');
      return globalInitPromise;
    }

    // Start initialization - set global lock
    globalInitializingFeed = feedType;

    const initPromise = (async (): Promise<Feed | null> => {
      try {
        const feedGroup = feedType === 'foryou' ? 'foryou' : 'timeline';
        console.log(`[Feed] Initializing ${feedGroup} feed for user ${userId}`);

        const feed = client.feed(feedGroup, userId);

        // Single getOrCreate call
        await feed.getOrCreate({
          limit: FEED_LIMIT,
          watch: true,
        });

        // Update cache
        const updatedCache = getFeedCache(feedType);
        updatedCache.feed = feed;
        updatedCache.userId = userId;

        console.log('[Feed] Feed initialized successfully');
        return feed;
      } catch (err) {
        console.error('[Feed] Failed to initialize feed:', err);
        throw err;
      } finally {
        globalInitializingFeed = null;
        globalInitPromise = null;
      }
    })();

    globalInitPromise = initPromise;
    return initPromise;
  }, [client, userId, isReady, feedType]);

  /**
   * Convert a backend Event to a FeedItem for display
   */
  const eventToFeedItem = (event: Event): FeedItem => {
    const flyerUrl = event.flyer?.url || event.imageUrl || `https://picsum.photos/seed/event-${event.id}/400/600`;
    return {
      id: `event-${event.id}`,
      username: event.venue?.name || 'You',
      userAvatar: event.venue?.imageUrl || '',
      description: event.description || '',
      likes: 0,
      comments: 0,
      shares: 0,
      mediaType: 'image',
      videoUrl: undefined,
      imageUrl: flyerUrl,
      thumbnail: flyerUrl,
      isEvent: true,
      eventId: event.id,
      eventTitle: event.name,
      eventDate: event.startDate,
      price: undefined,
      isPaid: event.isPaid,
      ticketsAvailableNow: event.ticketsAvailableNow,
      ticketsAvailableFrom: event.ticketsAvailableFrom,
      isPrivate: !event.isPublic,
      venueId: event.venue?.id,
      venueName: event.venue?.name,
      userId: event.ownerId?.toString(),
      isVenueActivity: !!event.venue?.id,
      isUserRegistered: event.isUserRegistered,
    };
  };

  /**
   * Fetch feed items from an already-initialized feed
   */
  const fetchFeedItems = React.useCallback(async (feed: Feed) => {
    try {
      // Get activities from feed state
      const feedState = (feed.state as any)?.getLatestValue?.() || (feed.state as any);
      const activities = (feedState?.activities || []) as unknown as FeedActivity[];

      console.log(`[Feed] Processing ${activities.length} activities`);

      // Extract unique eventIds
      const eventIds = activities
        .map(getEventIdFromActivity)
        .filter((id): id is number => id !== undefined);
      const uniqueEventIds = [...new Set(eventIds)];

      console.log(`[Feed] Found ${uniqueEventIds.length} unique eventIds`);

      // Fetch event details from backend
      let eventsMap: Map<number, Event> = new Map();
      if (uniqueEventIds.length > 0) {
        try {
          console.log('[Feed] Fetching event details from backend...');
          const events = await eventsApi.getEventsByIds(uniqueEventIds);
          console.log(`[Feed] Fetched ${events.length} events from backend`);

          events.forEach(event => {
            eventsMap.set(event.id, event);
          });
        } catch (eventError) {
          console.warn('[Feed] Failed to fetch event details:', eventError);
        }
      }

      // Map activities to feed items
      const now = new Date();
      const feedItems = activities
        .map(activity => mapActivityToFeedItem(activity, eventsMap))
        .filter((item): item is FeedItem => item !== null)
        // Filter out past events (keep non-events and future events)
        .filter(item => {
          if (!item.isEvent || !item.eventDate) return true;
          const eventDate = new Date(item.eventDate);
          return eventDate >= now;
        });

      console.log(`[Feed] Mapped ${feedItems.length} items with media (filtered past events)`);

      return feedItems;
    } catch (err) {
      console.error('[Feed] Error fetching feed items:', err);
      throw err;
    }
  }, []);

  /**
   * Main fetch function - initializes feed if needed, then fetches items
   */
  const fetchFeed = React.useCallback(async () => {
    if (!enabled || !isReady || !client || !userId) {
      setIsLoading(false);
      return;
    }

    const cache = getFeedCache(feedType);

    // If we have cached items for this user, use them immediately
    if (cache.userId === userId && cache.items.length > 0) {
      setItems(cache.items);
      setHasMore(cache.hasMore);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setIsError(false);
      setError(null);

      // Initialize feed (serialized - safe to call multiple times)
      const feed = await initializeFeed();

      if (!feed || !mountedRef.current) {
        setIsLoading(false);
        return;
      }

      // Fetch items from initialized feed
      const feedItems = await fetchFeedItems(feed);

      if (mountedRef.current) {
        // Update cache
        const updatedCache = getFeedCache(feedType);
        updatedCache.items = feedItems;
        updatedCache.lastFetch = Date.now();

        setItems(feedItems);

        // Check if there's a next page
        const feedState = (feed.state as any)?.getLatestValue?.() || (feed.state as any);
        const hasNextPage = !!feedState?.next;
        updatedCache.hasMore = hasNextPage;
        setHasMore(hasNextPage);
      }
    } catch (err: any) {
      console.error('[Feed] Error:', err);
      if (mountedRef.current) {
        setIsError(true);
        setError(err instanceof Error ? err : new Error('Failed to fetch feed'));
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [enabled, isReady, client, userId, feedType, initializeFeed, fetchFeedItems]);

  /**
   * Load more activities
   */
  const loadMore = React.useCallback(async () => {
    const cache = getFeedCache(feedType);
    const feed = cache.feed;

    if (!hasMore || isLoading || !feed) return;

    try {
      console.log('[Feed] Loading more activities...');

      const response = await feed.getNextPage();

      if (response && mountedRef.current) {
        const activities = (response.activities || []) as unknown as FeedActivity[];

        // Extract unique eventIds
        const eventIds = activities
          .map(getEventIdFromActivity)
          .filter((id): id is number => id !== undefined);
        const uniqueEventIds = [...new Set(eventIds)];

        // Fetch event details
        let eventsMap: Map<number, Event> = new Map();
        if (uniqueEventIds.length > 0) {
          try {
            const events = await eventsApi.getEventsByIds(uniqueEventIds);
            events.forEach(event => {
              eventsMap.set(event.id, event);
            });
          } catch (eventError) {
            console.warn('[Feed] Failed to fetch event details for loadMore:', eventError);
          }
        }

        const now = new Date();
        const newItems = activities
          .map(activity => mapActivityToFeedItem(activity, eventsMap))
          .filter((item): item is FeedItem => item !== null)
          // Filter out past events
          .filter(item => {
            if (!item.isEvent || !item.eventDate) return true;
            const eventDate = new Date(item.eventDate);
            return eventDate >= now;
          });

        const allItems = [...items, ...newItems];
        setItems(allItems);

        const nextHasMore = !!response.next;
        setHasMore(nextHasMore);

        // Update cache
        cache.items = allItems;
        cache.hasMore = nextHasMore;

        console.log(`[Feed] Loaded ${newItems.length} more activities`);
      } else if (mountedRef.current) {
        setHasMore(false);
        cache.hasMore = false;
      }
    } catch (err) {
      console.error('[Feed] Error loading more:', err);
    }
  }, [hasMore, isLoading, items, feedType]);

  /**
   * Initial fetch when Stream client is ready
   */
  React.useEffect(() => {
    if (!isReady || !enabled || !userId) {
      return;
    }

    const cache = getFeedCache(feedType);

    // Skip if already have data for this user
    if (cache.userId === userId && cache.items.length > 0) {
      setItems(cache.items);
      setHasMore(cache.hasMore);
      setIsLoading(false);
      return;
    }

    // Skip if already initializing
    if (globalInitializingFeed === feedType) {
      return;
    }

    fetchFeed();
  }, [feedType, enabled, isReady, userId, fetchTrigger]); // fetchTrigger forces re-fetch on account switch

  /**
   * Refetch function - clears cache and re-fetches
   */
  const refetch = React.useCallback(async () => {
    clearFeedCache(feedType);
    setHasMore(true);
    await fetchFeed();
  }, [feedType, fetchFeed]);

  return {
    items,
    isLoading,
    isError,
    error,
    refetch,
    loadMore,
    hasMore,
  };
}

/**
 * Hook to toggle like on a feed item
 * Uses GetStream reactions API
 */
export function useLike() {
  const [isLoading, setIsLoading] = React.useState(false);
  const { client, isReady } = useStream();

  const toggleLike = React.useCallback(async (activityId: string, isLiked: boolean) => {
    if (!isReady || !client) {
      console.warn('[Like] Stream client not ready');
      return !isLiked;
    }

    setIsLoading(true);
    try {
      if (isLiked) {
        await client.deleteActivityReaction({
          activity_id: activityId,
          type: 'like',
        });
      } else {
        await client.addActivityReaction({
          activity_id: activityId,
          type: 'like',
        });
      }
      console.log('[Like] Toggle like:', activityId, !isLiked);
      return !isLiked;
    } catch (error) {
      console.error('[Like] Failed to toggle like:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [client, isReady]);

  return { toggleLike, isLoading };
}
