import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import io, { type Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { config } from '@/lib/config';
import { apiClient } from '@/lib/api/client';
import { useAuth } from '@/lib/providers/auth-provider';
import { CONVERSATIONS_KEY } from '@/hooks/use-conversations';
import { NOTIFICATIONS_KEY, UNREAD_COUNT_KEY } from '@/hooks/use-notifications';

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

      // Global listener: conversation list refresh on new messages
      s.on('chat:new-message', () => {
        queryClient.invalidateQueries({ queryKey: [CONVERSATIONS_KEY] });
      });

      // Global listener: real-time notification delivery
      s.on('notification:new', () => {
        queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] });
        queryClient.invalidateQueries({ queryKey: [UNREAD_COUNT_KEY] });
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
