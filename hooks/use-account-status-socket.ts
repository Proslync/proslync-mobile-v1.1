// useAccountStatusSocket — real-time WebSocket listener for Stripe account status changes
// Listens for account_status_updated events to invalidate React Query cache

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { config } from '@/lib/config';
import { apiClient } from '@/lib/api/client';
const STRIPE_ACCOUNT_STATUS_KEY = 'stripe-account-status';

interface UseAccountStatusSocketOptions {
  enabled?: boolean;
}

export function useAccountStatusSocket({ enabled = true }: UseAccountStatusSocketOptions = {}) {
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

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

      socket.on('account_status_updated', () => {
        queryClient.invalidateQueries({ queryKey: [STRIPE_ACCOUNT_STATUS_KEY] });
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
      if (socket) {
        socket.disconnect();
      }
      socketRef.current = null;
    };
  }, [enabled, queryClient]);
}
