import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import io, { type Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { config } from '@/lib/config';
import { apiClient } from '@/lib/api/client';
import { useAuth } from '@/lib/providers/auth-provider';
import { CONVERSATIONS_KEY } from '@/hooks/use-conversations';
import { NOTIFICATIONS_KEY, UNREAD_COUNT_KEY } from '@/hooks/use-notifications';
import type { ConversationResponse } from '@/lib/api/chat';

interface ChatSocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
}

const ChatSocketContext = createContext<ChatSocketContextValue | null>(null);

export function ChatSocketProvider({ children }: { children: React.ReactNode }) {
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

      const s = io(`${config.websocket.url}/chat`, {
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

      // --- chat:new-message ---
      // Optimistic cache update: bump conversation to top + increment unread count.
      // Debounced invalidation syncs the full preview text from the server.
      let chatFallbackTimer: ReturnType<typeof setTimeout> | null = null;

      s.on('chat:new-message', (data: { conversationId: string }) => {
        // Immediately update cached conversations list (avoids a full refetch)
        queryClient.setQueryData<ConversationResponse[]>(
          [CONVERSATIONS_KEY],
          (old) => {
            if (!old) return old;
            const now = new Date().toISOString();
            return old.map((conv) =>
              conv.id === data.conversationId
                ? {
                    ...conv,
                    lastMessageAt: now,
                    unreadCount: conv.unreadCount + 1,
                  }
                : conv,
            );
          },
        );

        // Debounced fallback invalidation — syncs full data (preview text, etc.)
        // after a burst of messages settles
        if (chatFallbackTimer) clearTimeout(chatFallbackTimer);
        chatFallbackTimer = setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: [CONVERSATIONS_KEY] });
          chatFallbackTimer = null;
        }, 2000);
      });

      // --- chat:read ---
      // Update the read receipt directly in cache when another user reads messages
      s.on('chat:read', (data: { userId: number; conversationId: string; lastReadAt: string }) => {
        queryClient.setQueryData<ConversationResponse[]>(
          [CONVERSATIONS_KEY],
          (old) => {
            if (!old) return old;
            return old.map((conv) => {
              if (conv.id !== data.conversationId) return conv;
              return {
                ...conv,
                members: conv.members.map((m) =>
                  m.userId === data.userId
                    ? { ...m, lastReadAt: data.lastReadAt }
                    : m,
                ),
              };
            });
          },
        );
      });

      // --- notification:new ---
      let notifTimer: ReturnType<typeof setTimeout> | null = null;

      s.on('notification:new', () => {
        if (notifTimer) clearTimeout(notifTimer);
        notifTimer = setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] });
          queryClient.invalidateQueries({ queryKey: [UNREAD_COUNT_KEY] });
          notifTimer = null;
        }, 300);
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

  // socketRef.current updates are captured via isConnected state changes
  const value = React.useMemo<ChatSocketContextValue>(
    () => ({ socket: socketRef.current, isConnected }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isConnected, user?.id],
  );

  return (
    <ChatSocketContext.Provider value={value}>
      {children}
    </ChatSocketContext.Provider>
  );
}

export function useChatSocket(): ChatSocketContextValue {
  const context = useContext(ChatSocketContext);
  if (!context) {
    throw new Error('useChatSocket must be used within a ChatSocketProvider');
  }
  return context;
}
