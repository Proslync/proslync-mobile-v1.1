import * as React from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';
import * as Device from 'expo-device';
import { AudioSession } from '@livekit/react-native';
import { config } from '@/lib/config';
import { callsApi, type IncomingCallData } from '@/lib/api/calls';
import { useAuth } from '@/lib/providers/auth-provider';
import { IncomingCallOverlay } from '@/components/call/incoming-call-overlay';
import { callkitService } from '@/lib/services/callkit-service';
import { voipPushService } from '@/lib/services/voip-push-service';

// CallKit crashes on simulator — only use on real iOS devices
const useCallKit = Platform.OS === 'ios' && Device.isDevice;

interface CurrentCall {
  callId: string;
  roomName: string;
  token: string;
  wsUrl: string;
  recipientId: number;
  recipientName: string;
  recipientAvatar?: string;
  isVideo: boolean;
  isOutgoing: boolean;
}

interface CallContextType {
  currentCall: CurrentCall | null;
  incomingCall: IncomingCallData | null;
  startCall: (recipientId: number, name?: string, avatar?: string, isVideo?: boolean) => Promise<void>;
  acceptIncoming: () => Promise<void>;
  declineIncoming: () => Promise<void>;
  endCall: () => Promise<void>;
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
  const [currentCall, setCurrentCall] = React.useState<CurrentCall | null>(null);
  const [incomingCall, setIncomingCall] = React.useState<IncomingCallData | null>(null);

  // Refs to avoid stale closures in CallKit callbacks
  const incomingCallRef = React.useRef<IncomingCallData | null>(null);
  const currentCallRef = React.useRef<CurrentCall | null>(null);
  React.useEffect(() => {
    incomingCallRef.current = incomingCall;
  }, [incomingCall]);
  React.useEffect(() => {
    currentCallRef.current = currentCall;
  }, [currentCall]);

  // Initialize CallKit and VoIP push on real iOS devices
  React.useEffect(() => {
    if (!useCallKit) return;

    callkitService.setup();

    // Handle CallKit answer — user tapped "Accept" on the native call screen
    callkitService.setOnAnswer(async (callId: string) => {
      try {
        const result = await callsApi.acceptCall(callId);
        const incoming = incomingCallRef.current;
        // CallKit manages audio session — don't fail if manual activation conflicts
        await AudioSession.startAudioSession().catch(() => {});
        setCurrentCall({
          callId,
          roomName: incoming?.roomName || '',
          token: result.token,
          wsUrl: result.wsUrl,
          recipientId: incoming?.callerId || 0,
          recipientName: incoming?.callerName || 'Unknown',
          isVideo: incoming?.isVideo || false,
          isOutgoing: false,
        });
        setIncomingCall(null);
        router.push('/call');
      } catch (error) {
        console.error('[CallKit] Failed to accept call:', error);
        // Call was already declined/ended — clean up stale state
        setIncomingCall(null);
        callkitService.endCall(callId);
      }
    });

    // Handle CallKit end — user tapped "Decline" or "End" on native call screen
    callkitService.setOnEnd(async (callId: string) => {
      const incoming = incomingCallRef.current;
      const active = currentCallRef.current;

      if (incoming && incoming.callId === callId) {
        // Declining an incoming call
        try { await callsApi.declineCall(callId); } catch {}
        setIncomingCall(null);
      } else if (active && active.callId === callId) {
        // Ending an active/outgoing call
        try { await callsApi.endCall(callId); } catch {}
        setCurrentCall(null);
        AudioSession.stopAudioSession().catch(() => {});
      } else {
        // Stale CallKit callback for an already-cleared call — just end on backend
        try { await callsApi.endCall(callId); } catch {}
      }
    });
  }, [router]);

  // Register VoIP push when user is authenticated (real device only)
  React.useEffect(() => {
    if (!user?.id || !useCallKit) return;
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
        if (useCallKit) {
          callkitService.reportIncomingCall(data.callId, data.callerName, data.isVideo);
        }
        setIncomingCall(data);
      });

      s.on('call:declined', (data: { callId: string }) => {
        if (useCallKit) {
          callkitService.endCall(data.callId);
        }
        setCurrentCall(null);
        setIncomingCall(null);
        AudioSession.stopAudioSession().catch(() => {});
      });

      s.on('call:ended', (data: { callId: string }) => {
        if (useCallKit) {
          callkitService.endCall(data.callId);
        }
        setCurrentCall(null);
        setIncomingCall(null);
        AudioSession.stopAudioSession().catch(() => {});
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
        await AudioSession.startAudioSession().catch(() => {});
        const result = await callsApi.initiateCall(recipientId, isVideo ?? false);
        setCurrentCall({
          callId: result.callId,
          roomName: result.roomName,
          token: result.token,
          wsUrl: result.wsUrl,
          recipientId,
          recipientName: name || 'Unknown',
          recipientAvatar: avatar,
          isVideo: isVideo ?? false,
          isOutgoing: true,
        });

        if (useCallKit) {
          callkitService.reportOutgoingCall(result.callId, name || 'Unknown');
        }

        router.push('/call');
      } catch (error) {
        console.error('Failed to start call:', error);
        AudioSession.stopAudioSession().catch(() => {});
      }
    },
    [router],
  );

  const acceptIncoming = React.useCallback(async () => {
    if (!incomingCall) return;

    try {
      await AudioSession.startAudioSession().catch(() => {});
      const result = await callsApi.acceptCall(incomingCall.callId);
      setCurrentCall({
        callId: incomingCall.callId,
        roomName: incomingCall.roomName,
        token: result.token,
        wsUrl: result.wsUrl,
        recipientId: incomingCall.callerId,
        recipientName: incomingCall.callerName,
        isVideo: incomingCall.isVideo,
        isOutgoing: false,
      });
      setIncomingCall(null);
      router.push('/call');
    } catch (error) {
      console.error('Failed to accept call:', error);
      AudioSession.stopAudioSession().catch(() => {});
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

    if (useCallKit) {
      callkitService.endCall(incomingCall.callId);
    }

    setIncomingCall(null);
  }, [incomingCall]);

  const endCall = React.useCallback(async () => {
    if (!currentCall) return;

    try {
      await callsApi.endCall(currentCall.callId);
    } catch {}

    if (useCallKit) {
      callkitService.endCall(currentCall.callId);
    }

    setCurrentCall(null);
    AudioSession.stopAudioSession().catch(() => {});
  }, [currentCall]);

  const value = React.useMemo(
    () => ({
      currentCall,
      incomingCall,
      startCall,
      acceptIncoming,
      declineIncoming,
      endCall,
    }),
    [currentCall, incomingCall, startCall, acceptIncoming, declineIncoming, endCall],
  );

  return (
    <CallContext.Provider value={value}>
      {children}
      {/* CallKit handles incoming call UI on real iOS devices. Otherwise show in-app overlay. */}
      {incomingCall && !useCallKit && (
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
