// useAnalyticsSocket — real-time WebSocket hook for analytics updates
// Listens for analytics_update, guest_checked_in, and payment_received events
// to trigger React Query cache invalidation for live chart updates

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { config } from '@/lib/config';
import { apiClient } from '@/lib/api/client';

interface UseAnalyticsSocketOptions {
  /** Event ID to subscribe to (for event-level analytics) */
  eventId?: number | null;
  /** Called when any analytics-relevant event is received */
  onUpdate: () => void;
  /** Whether the socket should connect */
  enabled?: boolean;
}

export function useAnalyticsSocket({
  eventId,
  onUpdate,
  enabled = true,
}: UseAnalyticsSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const onUpdateRef = useRef(onUpdate);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep callback ref up to date without re-triggering effect
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  // Debounced update to avoid rapid re-fetches
  const debouncedUpdate = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      onUpdateRef.current();
    }, 500);
  }, []);

  useEffect(() => {
    if (!enabled || !config.websocket.enabled) return;

    let socket: Socket | null = null;

    const connect = async () => {
      const token = await apiClient.getAccessToken();
      if (!token) return;

      const socketUrl = `${config.websocket.url}/events`;

      socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      });

      socket.on('connect', () => {
        // Subscribe to event room if eventId provided
        if (eventId) {
          socket?.emit('subscribe_event', { eventId });
        }
        // User room is joined automatically by the gateway on connect
      });

      // Analytics-relevant events that should trigger chart refresh
      socket.on('analytics_update', () => {
        debouncedUpdate();
      });

      socket.on('guest_checked_in', () => {
        debouncedUpdate();
      });

      socket.on('payment_received', () => {
        debouncedUpdate();
      });

      socket.on('pong', () => {
        // heartbeat response
      });

      socketRef.current = socket;
    };

    connect();

    // Heartbeat every 30s
    const heartbeat = setInterval(() => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('ping');
      }
    }, 30000);

    return () => {
      clearInterval(heartbeat);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (socket) {
        if (eventId) {
          socket.emit('unsubscribe_event', { eventId });
        }
        socket.disconnect();
      }
      socketRef.current = null;
    };
  }, [eventId, enabled, debouncedUpdate]);
}
