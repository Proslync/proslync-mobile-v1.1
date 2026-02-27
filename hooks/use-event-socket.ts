// useEventSocket — real-time WebSocket hook for event updates
// Connects to /events namespace, subscribes to a specific event room

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { config } from '@/lib/config';
import { apiClient } from '@/lib/api/client';

interface GuestCheckedInPayload {
  guestId: number;
  userId?: number;
  firstName: string;
  lastName: string;
  status: string;
  eventId: number;
}

interface PaymentReceivedPayload {
  userId?: number | null;
  guestId?: number | null;
  paymentId: number;
  amount: number;
  eventId: number;
}

interface UseEventSocketOptions {
  eventId: number | null;
  onGuestCheckedIn?: (data: GuestCheckedInPayload) => void;
  onPaymentReceived?: (data: PaymentReceivedPayload) => void;
  enabled?: boolean;
}

export function useEventSocket({
  eventId,
  onGuestCheckedIn,
  onPaymentReceived,
  enabled = true,
}: UseEventSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const callbacksRef = useRef({ onGuestCheckedIn, onPaymentReceived });

  // Keep callbacks ref up to date without re-triggering effect
  useEffect(() => {
    callbacksRef.current = { onGuestCheckedIn, onPaymentReceived };
  }, [onGuestCheckedIn, onPaymentReceived]);

  useEffect(() => {
    if (!enabled || !eventId || !config.websocket.enabled) return;

    let socket: Socket | null = null;

    const connect = async () => {
      const token = await apiClient.getAccessToken();
      if (!token) {
        console.error('No auth token available');
        return;
      }

      const socketUrl = `${config.websocket.url}/events`;
      socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      });

      socket.on('connect', () => {        socket?.emit('subscribe_event', { eventId });
      });

      socket.on('disconnect', (reason) => {      });

      socket.on('connect_error', (error) => {
        console.error('Connection error:', error.message);
      });

      socket.on('guest_checked_in', (data: GuestCheckedInPayload) => {        callbacksRef.current.onGuestCheckedIn?.(data);
      });

      socket.on('payment_received', (data: PaymentReceivedPayload) => {        callbacksRef.current.onPaymentReceived?.(data);
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
      if (socket) {
        socket.emit('unsubscribe_event', { eventId });
        socket.disconnect();
      }
      socketRef.current = null;
    };
  }, [eventId, enabled]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  return { disconnect };
}
