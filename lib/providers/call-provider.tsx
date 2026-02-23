import * as React from 'react';
import {
  StreamVideoClient,
  StreamVideo,
  type Call,
  type User as StreamVideoUser,
} from '@stream-io/video-react-native-sdk';
import { config } from '@/lib/config';
import { streamApi } from '@/lib/api/stream';
import { useAuth } from '@/lib/providers/auth-provider';
import type { User } from '@/lib/types/auth.types';

type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error';

interface CallContextValue {
  client: StreamVideoClient | null;
  status: ConnectionStatus;
  error: string | null;
  activeCall: Call | null;
  startCall: (params: StartCallParams) => Promise<Call | null>;
  endCall: () => Promise<void>;
}

interface StartCallParams {
  callId: string;
  members: { userId: string }[];
  video?: boolean;
}

const CallContext = React.createContext<CallContextValue | undefined>(undefined);

interface TokenCache {
  token: string;
  expiresAt: number;
}

const TOKEN_BUFFER_MS = 60 * 1000;
const TOKEN_FALLBACK_TTL_MS = 60 * 60 * 1000;

const buildVideoUser = (user: User): StreamVideoUser => {
  const displayName = [user.firstName, user.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();

  return {
    id: String(user.id),
    name: displayName || user.phoneNumber || `User ${user.id}`,
    image: user.avatar?.url,
  };
};

export function CallProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();

  const [client, setClient] = React.useState<StreamVideoClient | null>(null);
  const [status, setStatus] = React.useState<ConnectionStatus>('idle');
  const [error, setError] = React.useState<string | null>(null);
  const [activeCall, setActiveCall] = React.useState<Call | null>(null);

  const clientRef = React.useRef<StreamVideoClient | null>(null);
  const connectedUserIdRef = React.useRef<string | null>(null);
  const tokenCacheRef = React.useRef<TokenCache | null>(null);
  const tokenRequestRef = React.useRef<Promise<string> | null>(null);
  const connectionAttemptRef = React.useRef(0);

  const apiKey = config.stream.apiKey;
  const userId = user ? String(user.id) : null;

  // Token provider — reuses feed tokens (work for video SDK too)
  const getToken = React.useCallback(async (forceRefresh = false): Promise<string> => {
    const now = Date.now();
    const cached = tokenCacheRef.current;

    if (!forceRefresh && cached && cached.expiresAt - now > TOKEN_BUFFER_MS) {
      return cached.token;
    }

    if (tokenRequestRef.current) {
      return tokenRequestRef.current;
    }

    console.log('[Call] Fetching token from backend...');

    const request = streamApi.getFeedToken()
      .then((response) => {
        const expiresAt = response.expiresAt
          ? Date.parse(response.expiresAt)
          : Date.now() + (response.ttlSeconds ? response.ttlSeconds * 1000 : TOKEN_FALLBACK_TTL_MS);

        tokenCacheRef.current = {
          token: response.token,
          expiresAt,
        };

        tokenRequestRef.current = null;
        console.log('[Call] Token received, expires at:', new Date(expiresAt).toISOString());
        return response.token;
      })
      .catch((err) => {
        tokenRequestRef.current = null;
        console.error('[Call] Token fetch error:', err);
        throw err;
      });

    tokenRequestRef.current = request;
    return request;
  }, []);

  const disconnect = React.useCallback(async () => {
    console.log('[Call] Disconnecting...');
    connectionAttemptRef.current += 1;
    tokenCacheRef.current = null;
    tokenRequestRef.current = null;
    connectedUserIdRef.current = null;

    // Leave active call
    if (activeCall) {
      try {
        await activeCall.leave();
      } catch (e) {
        console.log('[Call] Leave call error:', e);
      }
    }
    setActiveCall(null);

    const activeClient = clientRef.current;
    clientRef.current = null;

    if (activeClient) {
      try {
        await activeClient.disconnectUser();
        console.log('[Call] Disconnected successfully');
      } catch (e) {
        console.log('[Call] Disconnect error:', e);
      }
    }

    setClient(null);
    setStatus('idle');
  }, [activeCall]);

  const connect = React.useCallback(async () => {
    if (!user || !userId || !isAuthenticated || !apiKey) {
      console.log('[Call] Cannot connect - missing requirements');
      return;
    }

    if (connectedUserIdRef.current === userId && clientRef.current) {
      console.log('[Call] Already connected for user:', userId);
      return;
    }

    const attemptId = connectionAttemptRef.current + 1;
    connectionAttemptRef.current = attemptId;

    console.log('[Call] Connecting user:', userId);
    setStatus('connecting');
    setError(null);

    try {
      if (connectionAttemptRef.current !== attemptId) {
        console.log('[Call] Connection attempt cancelled');
        return;
      }

      const tokenProvider = async () => {
        return getToken(true);
      };

      const videoUser = buildVideoUser(user);

      const videoClient = StreamVideoClient.getOrCreateInstance({
        apiKey,
        user: videoUser,
        tokenProvider,
      });

      clientRef.current = videoClient;
      connectedUserIdRef.current = userId;
      setClient(videoClient);
      setStatus('connected');

      console.log('[Call] Connected successfully');
    } catch (connectError) {
      const message = connectError instanceof Error
        ? connectError.message
        : 'Failed to connect video client';

      console.error('[Call] Connection error:', connectError);

      if (connectionAttemptRef.current === attemptId) {
        setError(message);
        setStatus('error');
      }

      if (clientRef.current) {
        try {
          await clientRef.current.disconnectUser();
        } catch {
          // ignore
        }
        clientRef.current = null;
      }
    }
  }, [apiKey, getToken, isAuthenticated, user, userId]);

  // Start a call
  const startCall = React.useCallback(async ({
    callId,
    members,
    video = true,
  }: StartCallParams): Promise<Call | null> => {
    const videoClient = clientRef.current;
    if (!videoClient || !userId) {
      console.warn('[Call] Client not ready');
      return null;
    }

    try {
      const call = videoClient.call('default', callId);

      await call.getOrCreate({
        data: {
          members: members.map((m) => ({ user_id: m.userId })),
          ring: true,
          custom: {
            video: video ? 'true' : 'false',
          },
        },
      });

      await call.join();
      if (video) {
        await call.camera.enable();
      }
      await call.microphone.enable();

      setActiveCall(call);
      console.log('[Call] Call started:', callId, video ? '(video)' : '(audio)');
      return call;
    } catch (err) {
      console.error('[Call] Failed to start call:', err);
      return null;
    }
  }, [userId]);

  // End active call
  const endCall = React.useCallback(async () => {
    if (!activeCall) return;

    try {
      await activeCall.leave();
      console.log('[Call] Call ended');
    } catch (err) {
      console.error('[Call] Failed to end call:', err);
    } finally {
      setActiveCall(null);
    }
  }, [activeCall]);

  // Auto-connect when authenticated
  React.useEffect(() => {
    if (!userId || !isAuthenticated || !apiKey) {
      void disconnect();
      return;
    }

    if (connectedUserIdRef.current === userId && clientRef.current) {
      return;
    }

    let cancelled = false;

    const establishConnection = async () => {
      if (clientRef.current && connectedUserIdRef.current !== userId) {
        await disconnect();
      }

      if (cancelled) return;

      try {
        await connect();
      } catch (e) {
        if (!cancelled) {
          console.error('[Call] Auto-connect failed:', e);
        }
      }
    };

    void establishConnection();

    return () => {
      cancelled = true;
    };
  }, [apiKey, connect, disconnect, isAuthenticated, userId]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      void disconnect();
    };
  }, [disconnect]);

  const value = React.useMemo<CallContextValue>(() => ({
    client,
    status,
    error,
    activeCall,
    startCall,
    endCall,
  }), [client, status, error, activeCall, startCall, endCall]);

  return (
    <CallContext.Provider value={value}>
      {client ? (
        <StreamVideo client={client}>
          {children}
        </StreamVideo>
      ) : (
        children
      )}
    </CallContext.Provider>
  );
}

export function useCallProvider() {
  const context = React.useContext(CallContext);
  if (context === undefined) {
    throw new Error('useCallProvider must be used within a CallProvider');
  }
  return context;
}
