import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { AudioSession } from '@livekit/react-native';
import io, { type Socket } from 'socket.io-client';
import { config } from '@/lib/config';
import { apiClient } from '@/lib/api/client';
import { callsApi } from '@/lib/api/calls';
import { useAuth } from '@/lib/providers/auth-provider';

export interface CurrentCall {
  callId: string;
  roomName: string;
  token: string;
  wsUrl: string;
  isVideo: boolean;
  recipientName?: string;
  recipientImage?: string;
}

export interface IncomingCall {
  callId: string;
  callerId: number;
  callerName: string;
  callerImage?: string;
  isVideo: boolean;
  roomName: string;
}

interface CallContextType {
  currentCall: CurrentCall | null;
  incomingCall: IncomingCall | null;
  startCall: (
    recipientId: number,
    isVideo: boolean,
    recipientName?: string,
    recipientImage?: string,
  ) => Promise<void>;
  acceptCall: (callId: string) => Promise<void>;
  declineCall: (callId: string) => Promise<void>;
  endCall: () => Promise<void>;
}

const CallContext = createContext<CallContextType | null>(null);

export function useCall(): CallContextType {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within CallProvider');
  }
  return context;
}

export function CallProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [currentCall, setCurrentCall] = useState<CurrentCall | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Connect to /calls namespace when authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    let socket: Socket | null = null;
    let cancelled = false;

    const initSocket = async () => {
      const token = await apiClient.getAccessToken();
      if (!token || cancelled) return;

      const s = io(`${config.websocket.url}/calls`, {
        auth: { token },
        transports: ['websocket'],
      });

      socket = s;
      socketRef.current = s;

      s.on('connect', () => {
        console.log('[CallProvider] Connected to /calls namespace');
      });

      s.on('call:incoming', (data: IncomingCall) => {
        console.log('[CallProvider] Incoming call:', data.callId);
        // Don't show incoming call if already on a call
        setCurrentCall((cur) => {
          if (cur) return cur;
          setIncomingCall(data);
          return null;
        });
      });

      s.on('call:accepted', (data: { callId: string }) => {
        console.log('[CallProvider] Call accepted:', data.callId);
        // The initiator's call is already set — no state change needed
        // The LiveKit room will auto-connect the recipient
      });

      s.on('call:declined', (data: { callId: string }) => {
        console.log('[CallProvider] Call declined:', data.callId);
        setCurrentCall((cur) => {
          if (cur?.callId === data.callId) {
            AudioSession.stopAudioSession();
            return null;
          }
          return cur;
        });
      });

      s.on('call:ended', (data: { callId: string }) => {
        console.log('[CallProvider] Call ended:', data.callId);
        setCurrentCall((cur) => {
          if (cur?.callId === data.callId) {
            AudioSession.stopAudioSession();
            return null;
          }
          return cur;
        });
        setIncomingCall((inc) =>
          inc?.callId === data.callId ? null : inc,
        );
      });

      s.on('disconnect', () => {
        console.log('[CallProvider] Disconnected from /calls namespace');
      });
    };

    initSocket();

    return () => {
      cancelled = true;
      if (socket) {
        socket.disconnect();
      }
      socketRef.current = null;
    };
  }, [isAuthenticated, user]);

  const startCall = useCallback(
    async (
      recipientId: number,
      isVideo: boolean,
      recipientName?: string,
      recipientImage?: string,
    ) => {
      try {
        await AudioSession.startAudioSession();
        const result = await callsApi.getToken(recipientId, isVideo);
        setCurrentCall({
          callId: result.callId,
          roomName: result.roomName,
          token: result.token,
          wsUrl: result.wsUrl,
          isVideo,
          recipientName,
          recipientImage,
        });
      } catch (error) {
        console.error('[CallProvider] Failed to start call:', error);
        AudioSession.stopAudioSession();
        throw error;
      }
    },
    [],
  );

  const acceptCall = useCallback(async (callId: string) => {
    try {
      await AudioSession.startAudioSession();
      const result = await callsApi.acceptCall(callId);

      setIncomingCall((inc) => {
        if (inc?.callId === callId) {
          setCurrentCall({
            callId,
            roomName: inc.roomName,
            token: result.token,
            wsUrl: result.wsUrl,
            isVideo: inc.isVideo,
            recipientName: inc.callerName,
          });
          return null;
        }
        return inc;
      });
    } catch (error) {
      console.error('[CallProvider] Failed to accept call:', error);
      AudioSession.stopAudioSession();
      throw error;
    }
  }, []);

  const declineCall = useCallback(async (callId: string) => {
    try {
      await callsApi.declineCall(callId);
      setIncomingCall((inc) => (inc?.callId === callId ? null : inc));
    } catch (error) {
      console.error('[CallProvider] Failed to decline call:', error);
    }
  }, []);

  const endCall = useCallback(async () => {
    const call = currentCall;
    if (!call) return;

    try {
      await callsApi.endCall(call.callId);
    } catch (error) {
      console.error('[CallProvider] Failed to end call:', error);
    } finally {
      setCurrentCall(null);
      AudioSession.stopAudioSession();
    }
  }, [currentCall]);

  const value: CallContextType = {
    currentCall,
    incomingCall,
    startCall,
    acceptCall,
    declineCall,
    endCall,
  };

  return (
    <CallContext.Provider value={value}>{children}</CallContext.Provider>
  );
}
