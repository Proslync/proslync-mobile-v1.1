import * as React from 'react';
import { FeedsClient, type UserRequest } from '@stream-io/feeds-react-native-sdk';
import { useAuth } from './auth-provider';
import { streamApi } from '../api/stream';
import { config } from '../config';
import type { User } from '../types/auth.types';

type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error';

interface StreamContextType {
  client: FeedsClient | null;
  userId: string | null;
  status: ConnectionStatus;
  isReady: boolean;
  error: string | null;
  reconnect: () => Promise<void>;
}

const StreamContext = React.createContext<StreamContextType | null>(null);

export function useStream() {
  const context = React.useContext(StreamContext);
  if (!context) {
    throw new Error('useStream must be used within a StreamProvider');
  }
  return context;
}

interface StreamProviderProps {
  children: React.ReactNode;
}

// Build Stream user payload from app user
const buildStreamUserPayload = (user: User): UserRequest => {
  const displayName = [user.firstName, user.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();

  const custom: Record<string, unknown> = {
    phoneNumber: user.phoneNumber,
    role: user.role,
  };

  if (user.firstName) custom.firstName = user.firstName;
  if (user.lastName) custom.lastName = user.lastName;
  if (user.email) custom.email = user.email;

  return {
    id: String(user.id),
    name: displayName || user.phoneNumber || `User ${user.id}`,
    image: user.avatar?.url,
    custom,
  };
};

export function StreamProvider({ children }: StreamProviderProps) {
  const { user, isAuthenticated } = useAuth();

  const [client, setClient] = React.useState<FeedsClient | null>(null);
  const [status, setStatus] = React.useState<ConnectionStatus>('idle');
  const [error, setError] = React.useState<string | null>(null);

  const clientRef = React.useRef<FeedsClient | null>(null);
  const connectedUserIdRef = React.useRef<string | null>(null);
  const connectionAttemptRef = React.useRef(0);
  // ISSUE 4 FIX: Track if connection is in progress to prevent loops
  const isConnectingRef = React.useRef(false);

  const apiKey = config.stream.apiKey;
  const userId = user ? String(user.id) : null;

  // Token provider function - fetches fresh token from backend
  const getToken = React.useCallback(async (): Promise<string> => {
    console.log('[Stream] Fetching token from backend...');
    const response = await streamApi.getFeedToken();
    console.log('[Stream] Token received, expires at:', response.expiresAt);
    return response.token;
  }, []);

  // Disconnect function - ISSUE 4 FIX: Properly clears all state
  const disconnect = React.useCallback(async () => {
    console.log('[Stream] Disconnecting...');
    connectionAttemptRef.current += 1;
    connectedUserIdRef.current = null;
    isConnectingRef.current = false;

    const activeClient = clientRef.current;
    clientRef.current = null;

    if (activeClient) {
      try {
        await activeClient.disconnectUser();
        console.log('[Stream] Disconnected successfully');
      } catch (disconnectError) {
        console.error('[Stream] Failed to disconnect:', disconnectError);
      }
    }

    setClient(null);
    setStatus('idle');
  }, []);

  // Connect function - ISSUE 4 FIX: Guards against concurrent connections
  const connect = React.useCallback(async () => {
    if (!user || !userId || !isAuthenticated || !apiKey) {
      console.log('[Stream] Cannot connect - missing requirements');
      return;
    }

    // Prevent concurrent connection attempts
    if (isConnectingRef.current) {
      console.log('[Stream] Connection already in progress, skipping');
      return;
    }

    // Already connected for this user
    if (connectedUserIdRef.current === userId && clientRef.current) {
      console.log('[Stream] Already connected for user:', userId);
      return;
    }

    const attemptId = connectionAttemptRef.current + 1;
    connectionAttemptRef.current = attemptId;
    isConnectingRef.current = true;

    // Create new FeedsClient
    const feedsClient = new FeedsClient(apiKey);
    clientRef.current = feedsClient;

    setStatus('connecting');
    setError(null);

    const streamUser = buildStreamUserPayload(user);

    try {
      console.log('[Stream] Connecting user:', userId);

      // Connect with token provider function
      await feedsClient.connectUser(streamUser, getToken);

      // Check if this connection attempt is still valid
      if (connectionAttemptRef.current !== attemptId) {
        console.log('[Stream] Connection attempt cancelled');
        await feedsClient.disconnectUser().catch(() => undefined);
        return;
      }

      connectedUserIdRef.current = userId;
      setClient(feedsClient);
      setStatus('connected');
      console.log('[Stream] Connected successfully for user:', userId);

    } catch (connectError) {
      const message =
        connectError instanceof Error
          ? connectError.message
          : 'Failed to connect to Stream';

      console.error('[Stream] Connection error:', message);

      if (connectionAttemptRef.current === attemptId) {
        setError(message);
        setStatus('error');
      }

      await feedsClient.disconnectUser().catch(() => undefined);

      if (clientRef.current === feedsClient) {
        clientRef.current = null;
      }

      throw connectError;
    } finally {
      isConnectingRef.current = false;
    }
  }, [apiKey, getToken, isAuthenticated, user, userId]);

  // Reconnect function
  const reconnect = React.useCallback(async () => {
    await disconnect();
    await connect();
  }, [connect, disconnect]);

  // Log warning if API key is missing
  React.useEffect(() => {
    if (!apiKey && isAuthenticated) {
      console.warn('[Stream] API key is missing. Feed functionality will be unavailable.');
    }
  }, [apiKey, isAuthenticated]);

  // ISSUE 4 FIX: Connect/disconnect on auth state changes with proper sequencing
  React.useEffect(() => {
    // Not authenticated - disconnect
    if (!userId || !isAuthenticated || !apiKey) {
      if (clientRef.current || connectedUserIdRef.current) {
        void disconnect();
      }
      return;
    }

    // Already connected for this user - skip
    if (connectedUserIdRef.current === userId && clientRef.current) {
      return;
    }

    // User changed - disconnect first, then connect
    let cancelled = false;

    const establishConnection = async () => {
      // If connected to different user, disconnect first
      if (clientRef.current && connectedUserIdRef.current !== userId) {
        console.log('[Stream] User changed, disconnecting previous user:', connectedUserIdRef.current);
        await disconnect();
      }

      if (cancelled) return;

      try {
        await connect();
      } catch (connectionError) {
        if (cancelled) return;
        console.error('[Stream] Connection error:', connectionError);
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

  const value = React.useMemo<StreamContextType>(
    () => ({
      client,
      userId,
      status,
      isReady: status === 'connected' && !!client,
      error,
      reconnect,
    }),
    [client, userId, status, error, reconnect]
  );

  return <StreamContext.Provider value={value}>{children}</StreamContext.Provider>;
}
