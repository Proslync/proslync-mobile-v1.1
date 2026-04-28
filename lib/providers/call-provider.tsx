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
import { voipPushService } from '@/lib/services/voip-push-service';
import { pushNotificationService } from '@/lib/services/push-notification-service';
import {
  addNotificationListener,
  addCallAnsweredListener,
  addCallEndedListener,
  startOutgoingCall,
  reportCallConnected,
  fulfillAnswerAction,
  endNativeCall,
} from '@/modules/voip-push';

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
  startGroupCall: (conversationId: string, groupName: string, isVideo?: boolean) => Promise<void>;
  acceptIncoming: () => Promise<void>;
  declineIncoming: () => Promise<void>;
  endCall: () => Promise<void>;
  onCallConnected: (callId: string) => void;
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

  // Refs to avoid stale closures in callbacks
  const incomingCallRef = React.useRef<IncomingCallData | null>(null);
  const currentCallRef = React.useRef<CurrentCall | null>(null);
  // Store push payload synchronously so native answer handler can read it immediately
  const pushPayloadRef = React.useRef<Record<string, IncomingCallData>>({});
  // Track callIds already being handled by native answer/end to prevent double-processing
  const handledCallIds = React.useRef<Set<string>>(new Set());

  React.useEffect(() => {
    incomingCallRef.current = incomingCall;
  }, [incomingCall]);
  React.useEffect(() => {
    currentCallRef.current = currentCall;
  }, [currentCall]);

  // Handle ALL call events from native VoIP push + CallKit delegate (single CXProvider)
  React.useEffect(() => {
    if (!useCallKit) return;

    // VoIP push payload arrives — store data for answer/end handlers
    const notifSub = addNotificationListener((payload) => {
      const callId = payload.callId as string;
      if (!callId) return;

      console.log('[VoipPush] Notification:', callId, payload.callerName);

      const callData: IncomingCallData = {
        callId,
        callerId: Number(payload.callerId) || 0,
        callerName: (payload.callerName as string) || 'Unknown',
        isVideo: !!payload.isVideo,
        roomName: (payload.roomName as string) || '',
      };

      pushPayloadRef.current[callId] = callData;
      setIncomingCall(callData);
    });

    // Native CallKit answer — user tapped Accept on CallKit UI
    // Note: CXAnswerCallAction is NOT yet fulfilled — we must call fulfillAnswerAction after connecting
    const answerSub = addCallAnsweredListener(async (callId) => {
      if (handledCallIds.current.has(callId)) return;
      handledCallIds.current.add(callId);

      console.log('[VoipPush] Answered:', callId);

      // Read from synchronous ref — React state may not have updated yet
      const callData = pushPayloadRef.current[callId] || incomingCallRef.current;

      try {
        const result = await callsApi.acceptCall(callId);
        await AudioSession.startAudioSession().catch(() => {});
        setCurrentCall({
          callId,
          roomName: callData?.roomName || '',
          token: result.token,
          wsUrl: result.wsUrl,
          recipientId: callData?.callerId || 0,
          recipientName: callData?.callerName || 'Unknown',
          isVideo: callData?.isVideo || false,
          isOutgoing: false,
        });
        setIncomingCall(null);
        delete pushPayloadRef.current[callId];
        // Fulfill the CallKit answer action — switches from "Connecting..." to active call
        fulfillAnswerAction(callId);
        router.push('/call');
      } catch (error) {
        console.error('[VoipPush] Accept failed:', error);
        setIncomingCall(null);
        delete pushPayloadRef.current[callId];
        handledCallIds.current.delete(callId);
        // End the CallKit call since accept failed
        endNativeCall(callId);
      }
    });

    // Native CallKit end — user tapped Decline or End on CallKit UI
    const endSub = addCallEndedListener(async (callId) => {
      if (handledCallIds.current.has(callId)) return;
      handledCallIds.current.add(callId);

      console.log('[VoipPush] Ended/Declined:', callId);

      const incoming = incomingCallRef.current;
      const active = currentCallRef.current;

      if (incoming && incoming.callId === callId) {
        try { await callsApi.declineCall(callId); } catch {}
        setIncomingCall(null);
      } else if (active && active.callId === callId) {
        try { await callsApi.endCall(callId); } catch {}
        setCurrentCall(null);
        AudioSession.stopAudioSession().catch(() => {});
      } else {
        // No JS state yet — decline via API as a fallback
        try { await callsApi.declineCall(callId); } catch {}
        setIncomingCall(null);
      }

      delete pushPayloadRef.current[callId];
      // Clean up after a delay so other handlers don't race
      setTimeout(() => handledCallIds.current.delete(callId), 5000);
    });

    return () => {
      notifSub?.remove();
      answerSub?.remove();
      endSub?.remove();
    };
  }, [router]);

  // Register VoIP push when user is authenticated (real device only)
  React.useEffect(() => {
    if (!user?.id || !useCallKit) return;
    try {
      voipPushService.register();
    } catch (err) {
      console.warn('[VoipPush] register() failed:', err);
    }

    return () => {
      try { voipPushService.unregister(); } catch {}
    };
  }, [user?.id]);

  // Register for standard push notifications when user is authenticated
  React.useEffect(() => {
    if (!user?.id) return;
    pushNotificationService.register().catch((err) => {
      console.warn('[PushNotification] register() rejected:', err);
    });

    return () => {
      pushNotificationService.unregister().catch(() => {});
    };
  }, [user?.id]);

  // Connect to /calls namespace when user is authenticated
  React.useEffect(() => {
    if (!user?.id) return;

    let socket: Socket | null = null;
    let cancelled = false;

    const initSocket = async () => {
      if (!config.websocket.enabled) return;
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
        console.log('[WS] call:incoming', data.callId);
        // On real device: native CXProvider already shows CallKit UI via VoIP push.
        // NEVER report via CallKit from JS — it creates a duplicate CallKit call.
        // Just update JS state so WebSocket-originated data (with roomName) is available.
        setIncomingCall(data);
        // Also store in pushPayloadRef as fallback if VoIP push was slow
        if (!pushPayloadRef.current[data.callId]) {
          pushPayloadRef.current[data.callId] = data;
        }
      });

      s.on('call:declined', (data: { callId: string }) => {
        setCurrentCall((cur) => {
          if (cur?.callId === data.callId) {
            AudioSession.stopAudioSession().catch(() => {});
            return null;
          }
          return cur;
        });
        setIncomingCall((inc) => (inc?.callId === data.callId ? null : inc));
        delete pushPayloadRef.current[data.callId];
        // End the native CallKit call UI
        if (useCallKit) endNativeCall(data.callId);
      });

      s.on('call:ended', (data: { callId: string }) => {
        setCurrentCall((cur) => {
          if (cur?.callId === data.callId) {
            AudioSession.stopAudioSession().catch(() => {});
            return null;
          }
          return cur;
        });
        setIncomingCall((inc) => (inc?.callId === data.callId ? null : inc));
        delete pushPayloadRef.current[data.callId];
        // End the native CallKit call UI
        if (useCallKit) endNativeCall(data.callId);
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
  }, [user?.id]);

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
          startOutgoingCall(result.callId, name || 'Unknown', isVideo ?? false);
        }

        router.push('/call');
      } catch (error) {
        console.error('Failed to start call:', error);
        AudioSession.stopAudioSession().catch(() => {});
      }
    },
    [router],
  );

  const startGroupCall = React.useCallback(
    async (conversationId: string, groupName: string, isVideo?: boolean) => {
      try {
        await AudioSession.startAudioSession().catch(() => {});
        const result = await callsApi.initiateGroupCall(conversationId, isVideo ?? false);
        setCurrentCall({
          callId: result.callId,
          roomName: result.roomName,
          token: result.token,
          wsUrl: result.wsUrl,
          recipientId: 0,
          recipientName: groupName,
          isVideo: isVideo ?? false,
          isOutgoing: true,
        });

        if (useCallKit) {
          startOutgoingCall(result.callId, groupName, isVideo ?? false);
        }

        router.push('/call');
      } catch (error) {
        console.error('Failed to start group call:', error);
        AudioSession.stopAudioSession().catch(() => {});
      }
    },
    [router],
  );

  // Called from call screen when remote participant joins (LiveKit connected)
  const onCallConnected = React.useCallback((callId: string) => {
    if (useCallKit) {
      reportCallConnected(callId);
    }
  }, []);

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
      // Fulfill native answer action if pending
      if (useCallKit) fulfillAnswerAction(incomingCall.callId);
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
      endNativeCall(incomingCall.callId);
    }

    delete pushPayloadRef.current[incomingCall.callId];
    setIncomingCall(null);
  }, [incomingCall]);

  const endCall = React.useCallback(async () => {
    if (!currentCall) return;

    try {
      await callsApi.endCall(currentCall.callId);
    } catch {}

    if (useCallKit) {
      endNativeCall(currentCall.callId);
    }

    delete pushPayloadRef.current[currentCall.callId];
    setCurrentCall(null);
    AudioSession.stopAudioSession().catch(() => {});
  }, [currentCall]);

  const value = React.useMemo(
    () => ({
      currentCall,
      incomingCall,
      startCall,
      startGroupCall,
      acceptIncoming,
      declineIncoming,
      endCall,
      onCallConnected,
    }),
    [currentCall, incomingCall, startCall, startGroupCall, acceptIncoming, declineIncoming, endCall, onCallConnected],
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
