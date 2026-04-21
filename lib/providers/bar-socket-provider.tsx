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
import type {
  ActiveTabsResponse,
  BarTab,
  BarTabSummary,
} from '@/lib/types/bar-tab.types';

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
    // Debounced fallback invalidation timers — declared at effect scope for cleanup
    let tabsFallbackTimer: ReturnType<typeof setTimeout> | null = null;
    let summaryFallbackTimer: ReturnType<typeof setTimeout> | null = null;

    const initSocket = async () => {
      if (!config.websocket.enabled) return;
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

      // --- Helpers ---

      /** Update a specific tab in the single-tab cache */
      const setTabData = (eventId: number, tab: BarTab) => {
        queryClient.setQueryData<BarTab>(
          [BAR_TAB_KEY, eventId, tab.id],
          tab,
        );
      };

      /** Update a tab within the tabs list cache, or append if new */
      const upsertTabInList = (eventId: number, tab: BarTab) => {
        queryClient.setQueryData<ActiveTabsResponse>(
          [BAR_TABS_KEY, eventId],
          (old) => {
            if (!old) return old;
            const exists = old.tabs.some((t) => t.id === tab.id);
            const updatedTabs = exists
              ? old.tabs.map((t) => (t.id === tab.id ? tab : t))
              : [...old.tabs, tab];
            return {
              ...old,
              tabs: updatedTabs,
              totalOpenTabs: updatedTabs.filter((t) => t.status === 'open').length,
            };
          },
        );
      };

      /** Update the customer's own tab cache if it matches */
      const updateMyTab = (eventId: number, tab: BarTab) => {
        queryClient.setQueryData<BarTab | null>(
          [MY_BAR_TAB_KEY, eventId],
          (old) => {
            if (!old || old.id !== tab.id) return old;
            return tab;
          },
        );
      };

      /** Debounced fallback: full tabs list sync after burst settles */
      const debouncedTabsFallback = (eventId: number) => {
        if (tabsFallbackTimer) clearTimeout(tabsFallbackTimer);
        tabsFallbackTimer = setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: [BAR_TABS_KEY, eventId] });
          tabsFallbackTimer = null;
        }, 2000);
      };

      /** Debounced fallback: full summary sync after burst settles */
      const debouncedSummaryFallback = (eventId: number) => {
        if (summaryFallbackTimer) clearTimeout(summaryFallbackTimer);
        summaryFallbackTimer = setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: [BAR_SUMMARY_KEY, eventId] });
          summaryFallbackTimer = null;
        }, 2000);
      };

      // --- Socket event handlers ---

      // Tab opened — insert new tab into list, update summary optimistically
      s.on('bar:tab-opened', (data: { tab: BarTab }) => {
        const eventId = data.tab.eventId;
        if (!eventId) return;

        upsertTabInList(eventId, data.tab);

        // Optimistic summary update: increment open tab count
        queryClient.setQueryData<BarTabSummary>(
          [BAR_SUMMARY_KEY, eventId],
          (old) => {
            if (!old) return old;
            return { ...old, totalOpenTabs: old.totalOpenTabs + 1 };
          },
        );

        debouncedTabsFallback(eventId);
        debouncedSummaryFallback(eventId);
      });

      // Items added — update the specific tab and the tabs list
      s.on('bar:items-added', (data: { tab: BarTab }) => {
        const eventId = data.tab.eventId;
        if (!eventId) return;

        setTabData(eventId, data.tab);
        upsertTabInList(eventId, data.tab);
        updateMyTab(eventId, data.tab);

        debouncedTabsFallback(eventId);
      });

      // Tab closed — update tab status in all relevant caches
      s.on('bar:tab-closed', (data: { tab: BarTab; clientSecret: string; paymentIntentId: string; amount: number; currency: string }) => {
        const eventId = data.tab.eventId;
        if (!eventId) return;

        setTabData(eventId, data.tab);
        upsertTabInList(eventId, data.tab);
        updateMyTab(eventId, data.tab);

        debouncedTabsFallback(eventId);
      });

      // Tab paid — update tab, recalculate summary optimistically
      s.on('bar:tab-paid', (data: { tab: BarTab }) => {
        const eventId = data.tab.eventId;
        if (!eventId) return;

        setTabData(eventId, data.tab);
        upsertTabInList(eventId, data.tab);
        updateMyTab(eventId, data.tab);

        // Optimistic summary update: move from open to paid, add revenue
        queryClient.setQueryData<BarTabSummary>(
          [BAR_SUMMARY_KEY, eventId],
          (old) => {
            if (!old) return old;
            const totalPaidTabs = old.totalPaidTabs + 1;
            const totalOpenTabs = Math.max(0, old.totalOpenTabs - 1);
            const totalRevenueCents = old.totalRevenueCents + data.tab.total;
            const averageTabCents = totalPaidTabs > 0
              ? Math.round(totalRevenueCents / totalPaidTabs)
              : 0;
            return {
              ...old,
              totalOpenTabs,
              totalPaidTabs,
              totalRevenueCents,
              averageTabCents,
            };
          },
        );

        debouncedTabsFallback(eventId);
        debouncedSummaryFallback(eventId);
      });
    };

    initSocket();

    return () => {
      cancelled = true;
      if (tabsFallbackTimer) clearTimeout(tabsFallbackTimer);
      if (summaryFallbackTimer) clearTimeout(summaryFallbackTimer);
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
