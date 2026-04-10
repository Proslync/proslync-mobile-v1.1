import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import {
  channelsApi,
  type ChannelResponse,
  type ChannelPostsPage,
  type ChannelMembersPage,
} from '@/lib/api/channels';

export const MY_CHANNELS_KEY = 'my-channels';
export const CHANNEL_KEY = 'channel';
export const CHANNEL_POSTS_KEY = 'channel-posts';
export const CHANNEL_MEMBERS_KEY = 'channel-members';
export const CHANNEL_DISCOVER_KEY = 'channel-discover';

export function useMyChannels() {
  return useQuery<ChannelResponse[], Error>({
    queryKey: [MY_CHANNELS_KEY],
    queryFn: () => channelsApi.getMyChannels(),
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
  });
}

export function useChannel(channelId: string | undefined) {
  return useQuery<ChannelResponse, Error>({
    queryKey: [CHANNEL_KEY, channelId],
    queryFn: () => {
      if (!channelId) throw new Error('Channel ID required');
      return channelsApi.getChannel(channelId);
    },
    enabled: !!channelId,
    staleTime: 1000 * 30,
  });
}

export function useChannelPosts(channelId: string | undefined) {
  return useInfiniteQuery<ChannelPostsPage, Error>({
    queryKey: [CHANNEL_POSTS_KEY, channelId],
    queryFn: ({ pageParam }) => {
      if (!channelId) throw new Error('Channel ID required');
      return channelsApi.getPosts(channelId, pageParam as number | undefined, 30);
    },
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!channelId,
    staleTime: 1000 * 15,
  });
}

export function useChannelMembers(channelId: string | undefined) {
  return useQuery<ChannelMembersPage, Error>({
    queryKey: [CHANNEL_MEMBERS_KEY, channelId],
    queryFn: () => {
      if (!channelId) throw new Error('Channel ID required');
      return channelsApi.getMembers(channelId);
    },
    enabled: !!channelId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useDiscoverChannels(query: string) {
  return useQuery<ChannelResponse[], Error>({
    queryKey: [CHANNEL_DISCOVER_KEY, query],
    queryFn: () => channelsApi.discover(query || undefined),
    staleTime: 1000 * 30,
  });
}
