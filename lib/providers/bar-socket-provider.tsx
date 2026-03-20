import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import io, { type Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { config } from '@/lib/config';
import { apiClient } from '@/lib/api/client';
import { useAuth } from '@/lib/providers/auth-provider';
import {
  BAR_TABS_KEY,
  BAR_TAB_KEY,
  BAR_SUMMARY_KEY,
  MY_BAR_TAB_KEY,
} from '@/hooks/use-bar-tabs';

interface BarSocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  joinEvent: (eventId: number) => void;
  leaveEvent: (eventId: number) => void;
}

const BarSocketContext = createContext<BarSocketContextValue | null>(null);

export function BarSocketProvider({ children }: { children: React.ReactNode }) {
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

      const s = io(`${config.websocket.url}/bar`, {
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

      // Debounced invalidation timers
      let tabsTimer: ReturnType<typeof setTimeout> | null = null;
      let summaryTimer: ReturnType<typeof setTimeout> | null = null;

      const invalidateTabs = (eventId: number) => {
        if (tabsTimer) clearTimeout(tabsTimer);
        tabsTimer = setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: [BAR_TABS_KEY, eventId] });
          tabsTimer = null;
        }, 300);
      };

      const invalidateSummary = (eventId: number) => {
        if (summaryTimer) clearTimeout(summaryTimer);
        summaryTimer = setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: [BAR_SUMMARY_KEY, eventId] });
          summaryTimer = null;
        }, 300);
      };

      // Tab opened — refresh tabs list and summary
      s.on('bar:tab-opened', (data: { eventId: number }) => {
        invalidateTabs(data.eventId);
        invalidateSummary(data.eventId);
      });

      // Items added — refresh specific tab and tabs list
      s.on('bar:items-added', (data: { eventId: number; tabId: number }) => {
        queryClient.invalidateQueries({
          queryKey: [BAR_TAB_KEY, data.eventId, data.tabId],
        });
        invalidateTabs(data.eventId);
        queryClient.invalidateQueries({
          queryKey: [MY_BAR_TAB_KEY, data.eventId],
        });
      });

      // Tab closed — refresh tab, tabs list, and customer's tab
      s.on('bar:tab-closed', (data: { eventId: number; tabId: number }) => {
        queryClient.invalidateQueries({
          queryKey: [BAR_TAB_KEY, data.eventId, data.tabId],
        });
        invalidateTabs(data.eventId);
        queryClient.invalidateQueries({
          queryKey: [MY_BAR_TAB_KEY, data.eventId],
        });
      });

      // Tab paid — refresh everything
      s.on('bar:tab-paid', (data: { eventId: number; tabId: number }) => {
        queryClient.invalidateQueries({
          queryKey: [BAR_TAB_KEY, data.eventId, data.tabId],
        });
        invalidateTabs(data.eventId);
        invalidateSummary(data.eventId);
        queryClient.invalidateQueries({
          queryKey: [MY_BAR_TAB_KEY, data.eventId],
        });
      });
    };

    initSocket();

    return () => {
      cancelled = true;
      if (tabsTimer) clearTimeout(tabsTimer);
      if (summaryTimer) clearTimeout(summaryTimer);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
    };
  }, [user?.id, queryClient]);

  const joinEvent = React.useCallback((eventId: number) => {
    socketRef.current?.emit('bar:join-event', { eventId });
  }, []);

  const leaveEvent = React.useCallback((eventId: number) => {
    socketRef.current?.emit('bar:leave-event', { eventId });
  }, []);

  const value = React.useMemo<BarSocketContextValue>(
    () => ({
      socket: socketRef.current,
      isConnected,
      joinEvent,
      leaveEvent,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isConnected, user?.id, joinEvent, leaveEvent],
  );

  return (
    <BarSocketContext.Provider value={value}>
      {children}
    </BarSocketContext.Provider>
  );
}

export function useBarSocket(): BarSocketContextValue {
  const context = useContext(BarSocketContext);
  if (!context) {
    throw new Error('useBarSocket must be used within a BarSocketProvider');
  }
  return context;
}
