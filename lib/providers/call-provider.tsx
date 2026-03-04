import * as React from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';
import { config } from '@/lib/config';
import { callsApi, type IncomingCallData } from '@/lib/api/calls';
import { useAuth } from '@/lib/providers/auth-provider';
import { IncomingCallOverlay } from '@/components/call/incoming-call-overlay';
import { callkitService } from '@/lib/services/callkit-service';
import { voipPushService } from '@/lib/services/voip-push-service';

interface ActiveCall {
  callId: string;
  roomName: string;
  recipientId: number;
  recipientName: string;
  recipientAvatar?: string;
  isVideo: boolean;
  isOutgoing: boolean;
}

interface CallContextType {
  activeCall: ActiveCall | null;
  incomingCall: IncomingCallData | null;
  socketRef: React.RefObject<Socket | null>;
  startCall: (recipientId: number, name?: string, avatar?: string, isVideo?: boolean) => Promise<void>;
  acceptIncoming: () => Promise<void>;
  declineIncoming: () => Promise<void>;
  endActiveCall: () => Promise<void>;
  clearActiveCall: () => void;
}

const CallContext = React.createContext<CallContextType | null>(null);

export function useCall() {
  const context = React.useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
}

export function CallProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const socketRef = React.useRef<Socket | null>(null);
  const [activeCall, setActiveCall] = React.useState<ActiveCall | null>(null);
  const [incomingCall, setIncomingCall] = React.useState<IncomingCallData | null>(null);

  // Initialize CallKit and VoIP push on iOS
  React.useEffect(() => {
    if (Platform.OS !== 'ios') return;

    callkitService.setup();

    // Handle CallKit answer — user tapped "Accept" on the native call screen
    callkitService.setOnAnswer(async (callId: string) => {
      try {
        await callsApi.acceptCall(callId);
        // We need the incoming call data to navigate — it might come from Socket.IO or push
        // Navigate to call screen
        router.push({
          pathname: '/call',
          params: {
            callId,
            recipientId: '0',
            recipientName: 'Unknown',
            recipientAvatar: '',
            isVideo: '0',
            isIncoming: '1',
          },
        });
      } catch (error) {
        console.error('[CallKit] Failed to accept call:', error);
        callkitService.endCall(callId);
      }
    });

    // Handle CallKit end — user tapped "Decline" or "End" on native call screen
    callkitService.setOnEnd(async (callId: string) => {
      try {
        await callsApi.declineCall(callId);
      } catch {
        // Call may already be ended
      }
      setIncomingCall(null);
      setActiveCall(null);
    });
  }, [router]);

  // Register VoIP push when user is authenticated
  React.useEffect(() => {
    if (!user?.id || Platform.OS !== 'ios') return;
    voipPushService.register();

    return () => {
      voipPushService.unregister();
    };
  }, [user?.id]);

  // Connect to /calls namespace when user is authenticated
  React.useEffect(() => {
    if (!user?.id) return;

    let socket: Socket | null = null;
    let cancelled = false;

    const initSocket = async () => {
      const token = await SecureStore.getItemAsync('accessToken');
      if (!token || cancelled) return;

      const s = io(`${config.websocket.url}/calls`, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      });

      socket = s;
      socketRef.current = s;

      s.on('call:incoming', (data: IncomingCallData) => {
        if (Platform.OS === 'ios') {
          // On iOS, report to CallKit instead of showing in-app overlay
          // This is idempotent — if VoIP push already reported it, this is a no-op
          callkitService.reportIncomingCall(data.callId, data.callerName, data.isVideo);
        }
        // Store the incoming call data so we can use it when answering
        setIncomingCall(data);
      });

      s.on('call:declined', (_data: { callId: string }) => {
        setActiveCall(null);
        router.back();
      });

      s.on('call:ended', (_data: { callId: string }) => {
        setActiveCall(null);
      });
    };

    initSocket();

    return () => {
      cancelled = true;
      if (socket) {
        socket.disconnect();
        socketRef.current = null;
      }
    };
  }, [user?.id, router]);

  const startCall = React.useCallback(
    async (recipientId: number, name?: string, avatar?: string, isVideo?: boolean) => {
      try {
        const result = await callsApi.initiateCall(recipientId, isVideo ?? false);
        const call: ActiveCall = {
          callId: result.callId,
          roomName: result.roomName,
          recipientId,
          recipientName: name || 'Unknown',
          recipientAvatar: avatar,
          isVideo: isVideo ?? false,
          isOutgoing: true,
        };
        setActiveCall(call);

        // Report outgoing call to CallKit
        if (Platform.OS === 'ios') {
          callkitService.reportOutgoingCall(result.callId, name || 'Unknown');
        }

        router.push({
          pathname: '/call',
          params: {
            callId: result.callId,
            recipientId: String(recipientId),
            recipientName: name || 'Unknown',
            recipientAvatar: avatar || '',
            isVideo: isVideo ? '1' : '0',
            isIncoming: '0',
          },
        });
      } catch (error) {
        console.error('Failed to start call:', error);
      }
    },
    [router],
  );

  const acceptIncoming = React.useCallback(async () => {
    if (!incomingCall) return;

    try {
      await callsApi.acceptCall(incomingCall.callId);
      const call: ActiveCall = {
        callId: incomingCall.callId,
        roomName: incomingCall.roomName,
        recipientId: incomingCall.callerId,
        recipientName: incomingCall.callerName,
        isVideo: incomingCall.isVideo,
        isOutgoing: false,
      };
      setActiveCall(call);
      setIncomingCall(null);
      router.push({
        pathname: '/call',
        params: {
          callId: incomingCall.callId,
          recipientId: String(incomingCall.callerId),
          recipientName: incomingCall.callerName,
          recipientAvatar: '',
          isVideo: incomingCall.isVideo ? '1' : '0',
          isIncoming: '1',
        },
      });
    } catch (error) {
      console.error('Failed to accept call:', error);
      setIncomingCall(null);
    }
  }, [incomingCall, router]);

  const declineIncoming = React.useCallback(async () => {
    if (!incomingCall) return;

    try {
      await callsApi.declineCall(incomingCall.callId);
    } catch (error) {
      console.error('Failed to decline call:', error);
    }

    // End in CallKit too
    if (Platform.OS === 'ios') {
      callkitService.endCall(incomingCall.callId);
    }

    setIncomingCall(null);
  }, [incomingCall]);

  const endActiveCall = React.useCallback(async () => {
    if (!activeCall) return;

    try {
      await callsApi.endCall(activeCall.callId);
    } catch (error) {
      console.error('Failed to end call:', error);
    }

    // End in CallKit
    if (Platform.OS === 'ios') {
      callkitService.endCall(activeCall.callId);
    }

    setActiveCall(null);
  }, [activeCall]);

  const clearActiveCall = React.useCallback(() => {
    setActiveCall(null);
  }, []);

  const value = React.useMemo(
    () => ({
      activeCall,
      incomingCall,
      socketRef,
      startCall,
      acceptIncoming,
      declineIncoming,
      endActiveCall,
      clearActiveCall,
    }),
    [activeCall, incomingCall, startCall, acceptIncoming, declineIncoming, endActiveCall, clearActiveCall],
  );

  return (
    <CallContext.Provider value={value}>
      {children}
      {/* On iOS, CallKit handles the incoming call UI. On Android, show the in-app overlay. */}
      {incomingCall && Platform.OS !== 'ios' && (
        <IncomingCallOverlay
          callerName={incomingCall.callerName}
          isVideo={incomingCall.isVideo}
          onAccept={acceptIncoming}
          onDecline={declineIncoming}
        />
      )}
    </CallContext.Provider>
  );
}
