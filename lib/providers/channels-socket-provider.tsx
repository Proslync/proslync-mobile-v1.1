import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import io, { type Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { config } from '@/lib/config';
import { apiClient } from '@/lib/api/client';
import { useAuth } from '@/lib/providers/auth-provider';
import {
  MY_CHANNELS_KEY,
  CHANNEL_KEY,
  CHANNEL_POSTS_KEY,
} from '@/hooks/use-channels';
import type { ChannelPostResponse, ChannelResponse } from '@/lib/api/channels';

interface ChannelsSocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  joinChannel: (channelId: string) => void;
  leaveChannel: (channelId: string) => void;
}

const ChannelsSocketContext = createContext<ChannelsSocketContextValue | null>(null);

export function ChannelsSocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;

    const initSocket = async () => {
      if (!config.websocket.enabled) return;
      const token = await apiClient.getAccessToken();
      if (!token || cancelled) return;

      const s = io(`${config.websocket.url}/channels`, {
        auth: { token },
        transports: ['websocket'],
      });

      socketRef.current = s;

      s.on('connect', () => {
        if (!cancelled) setIsConnected(true);
      });

      s.on('disconnect', () => {
        if (!cancelled) setIsConnected(false);
      });

      // --- channel:new-post ---
      // Optimistic: prepend the post to the cached posts list, bump channel in list
      let listFallbackTimer: ReturnType<typeof setTimeout> | null = null;
      s.on('channel:new-post', (data: { channelId: string; post: ChannelPostResponse }) => {
        // Prepend post to the channel's posts cache
        queryClient.setQueryData<{
          pages: { posts: ChannelPostResponse[]; hasMore: boolean; nextCursor: number | null }[];
          pageParams: unknown[];
        }>([CHANNEL_POSTS_KEY, data.channelId], (old) => {
          if (!old) return old;
          // Skip if we already have this post (avoid duplicate from optimistic create)
          if (old.pages[0]?.posts.some((p) => p.id === data.post.id)) return old;
          const newPages = [...old.pages];
          newPages[0] = {
            ...newPages[0],
            posts: [data.post, ...(newPages[0]?.posts ?? [])],
          };
          return { ...old, pages: newPages };
        });

        // Update channel detail (postCount, etc.)
        queryClient.setQueryData<ChannelResponse>([CHANNEL_KEY, data.channelId], (old) => {
          if (!old) return old;
          return { ...old, postCount: old.postCount + 1 };
        });

        // Bump in list and increment unread
        queryClient.setQueryData<ChannelResponse[]>([MY_CHANNELS_KEY], (old) => {
          if (!old) return old;
          return old.map((c) =>
            c.id === data.channelId
              ? { ...c, postCount: c.postCount + 1, unreadCount: (c.unreadCount ?? 0) + 1 }
              : c,
          );
        });

        // Debounced fallback to keep things in sync after burst
        if (listFallbackTimer) clearTimeout(listFallbackTimer);
        listFallbackTimer = setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: [MY_CHANNELS_KEY] });
          listFallbackTimer = null;
        }, 2000);
      });

      // --- channel:post-deleted ---
      s.on('channel:post-deleted', (data: { channelId: string; postId: number }) => {
        queryClient.setQueryData<{
          pages: { posts: ChannelPostResponse[]; hasMore: boolean; nextCursor: number | null }[];
          pageParams: unknown[];
        }>([CHANNEL_POSTS_KEY, data.channelId], (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              posts: page.posts.map((p) =>
                p.id === data.postId ? { ...p, isDeleted: true } : p,
              ),
            })),
          };
        });
      });

      // --- channel:post-reaction-updated ---
      s.on(
        'channel:post-reaction-updated',
        (data: { channelId: string; postId: number; reactionCounts: Record<string, number> }) => {
          queryClient.setQueryData<{
            pages: { posts: ChannelPostResponse[]; hasMore: boolean; nextCursor: number | null }[];
            pageParams: unknown[];
          }>([CHANNEL_POSTS_KEY, data.channelId], (old) => {
            if (!old) return old;
            return {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                posts: page.posts.map((p) =>
                  p.id === data.postId ? { ...p, reactionCounts: data.reactionCounts } : p,
                ),
              })),
            };
          });
        },
      );

      // --- channel:updated ---
      s.on('channel:updated', (data: { channelId: string; channel: ChannelResponse }) => {
        queryClient.setQueryData<ChannelResponse>([CHANNEL_KEY, data.channelId], data.channel);
        queryClient.setQueryData<ChannelResponse[]>([MY_CHANNELS_KEY], (old) => {
          if (!old) return old;
          return old.map((c) => (c.id === data.channelId ? { ...c, ...data.channel } : c));
        });
      });
    };

    initSocket();

    return () => {
      cancelled = true;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
    };
  }, [user?.id, queryClient]);

  const joinChannel = useCallback((channelId: string) => {
    socketRef.current?.emit('channel:join', { channelId });
  }, []);

  const leaveChannel = useCallback((channelId: string) => {
    socketRef.current?.emit('channel:leave', { channelId });
  }, []);

  const value = React.useMemo<ChannelsSocketContextValue>(
    () => ({ socket: socketRef.current, isConnected, joinChannel, leaveChannel }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isConnected, user?.id, joinChannel, leaveChannel],
  );

  return (
    <ChannelsSocketContext.Provider value={value}>
      {children}
    </ChannelsSocketContext.Provider>
  );
}

export function useChannelsSocket(): ChannelsSocketContextValue {
  const context = useContext(ChannelsSocketContext);
  if (!context) {
    throw new Error('useChannelsSocket must be used within a ChannelsSocketProvider');
  }
  return context;
}
