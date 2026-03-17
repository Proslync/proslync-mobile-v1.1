import { useMemo } from 'react';
import { useInfiniteQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { postsApi, type FeedItemResponse } from '@/lib/api/posts';
import type { FeedItem, FeedTab } from '@/lib/types/feed.types';

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
  isFetchingNextPage: boolean;
}

export const FEED_QUERY_KEY = 'feed';

const VIDEO_EXTENSIONS = /\.(mp4|mov|webm|m4v|avi|mkv)(\?|$)/i;

function isVideoUrl(url?: string | null): boolean {
  if (!url) return false;
  return VIDEO_EXTENSIONS.test(url);
}

function mapResponseToFeedItem(item: FeedItemResponse): FeedItem {
  const firstMedia = item.media?.[0];
  const isVideo =
    firstMedia?.type === 'video' ||
    (firstMedia?.mimeType && firstMedia.mimeType.startsWith('video/')) ||
    isVideoUrl(firstMedia?.url);

  const mediaType: 'video' | 'image' = isVideo ? 'video' : 'image';

  const primaryUrl = item.type === 'event'
    ? item.eventFlyerUrl || item.eventImageUrl || firstMedia?.url || ''
    : firstMedia?.url || '';

  const imageUrl = isVideo ? '' : primaryUrl;
  const videoUrl = isVideo ? primaryUrl : undefined;

  const thumbnail =
    firstMedia?.thumbnailUrl
    || (isVideo ? (item.eventImageUrl || primaryUrl || '') : '')
    || imageUrl || '';

  const displayName =
    item.authorUserName ||
    [item.authorFirstName, item.authorLastName].filter(Boolean).join(' ') ||
    '';

  const width = firstMedia?.width;
  const height = firstMedia?.height;
  let aspectRatio: number | undefined;
  let mediaOrientation: 'horizontal' | 'vertical' | 'square' | undefined;
  if (width && height) {
    aspectRatio = width / height;
    if (aspectRatio > 1.05) mediaOrientation = 'horizontal';
    else if (aspectRatio < 0.95) mediaOrientation = 'vertical';
    else mediaOrientation = 'square';
  }

  return {
    id: String(item.id),
    username: item.type === 'event' && item.venueName ? item.venueName : displayName,
    userAvatar: item.authorAvatarUrl || '',
    description: item.text || '',
    verified: item.authorIsVerified ?? false,
    likes: item.likeCount,
    comments: item.commentCount,
    shares: 0,
    isLiked: item.isLiked,
    mediaType,
    videoUrl,
    imageUrl,
    thumbnail,
    mediaWidth: width,
    mediaHeight: height,
    aspectRatio,
    mediaOrientation,
    isEvent: item.type === 'event',
    eventId: item.eventId ?? undefined,
    eventTitle: item.eventName ?? undefined,
    eventDate: item.eventStartDate ?? undefined,
    price: undefined,
    isPaid: item.eventIsPaid ?? undefined,
    isPrivate: !item.isPublic,
    venueId: item.venueId ?? undefined,
    venueName: item.venueName ?? undefined,
    userId: String(item.authorId),
    isVenueActivity: !!item.venueId,
    isUserRegistered: item.isUserRegistered ?? false,
  };
}

export function useFeed({ feedType, enabled = true }: UseFeedOptions): UseFeedReturn {
  const queryClient = useQueryClient();

  const fetchFeed = feedType === 'foryou'
    ? postsApi.getForYouFeed
    : postsApi.getFollowingFeed;

  const query = useInfiniteQuery({
    queryKey: [FEED_QUERY_KEY, feedType],
    enabled,
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      return fetchFeed(pageParam, 20);
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor ?? undefined : undefined,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  const items = useMemo(
    () => (query.data?.pages ?? []).flatMap((page) => page.items.map(mapResponseToFeedItem)),
    [query.data?.pages],
  );

  const refetch = async () => {
    await query.refetch();
  };

  const loadMore = async () => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      await query.fetchNextPage();
    }
  };

  return {
    items,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch,
    loadMore,
    hasMore: !!query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  };
}

export function useRefreshFeeds() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: [FEED_QUERY_KEY] });
  };
}
