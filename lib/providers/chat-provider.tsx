import * as React from 'react';
import { StreamChat, type Event, type OwnUserResponse, type UserResponse } from 'stream-chat';
import { config } from '@/lib/config';
import { streamApi } from '@/lib/api/stream';
import { useAuth } from '@/lib/providers/auth-provider';
import type { User } from '@/lib/types/auth.types';

type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error';

interface ChatContextValue {
  client: StreamChat | null;
  status: ConnectionStatus;
  error: string | null;
  unreadCount: number;
  reconnect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const ChatContext = React.createContext<ChatContextValue | undefined>(undefined);

interface TokenCache {
  token: string;
  expiresAt: number;
}

const TOKEN_BUFFER_MS = 60 * 1000; // 60 seconds buffer before expiry
const TOKEN_FALLBACK_TTL_MS = 60 * 60 * 1000; // 1 hour fallback

// Build Stream Chat user payload from app user
const buildChatUserPayload = (user: User) => {
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

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();

  const [client, setClient] = React.useState<StreamChat | null>(null);
  const [status, setStatus] = React.useState<ConnectionStatus>('idle');
  const [error, setError] = React.useState<string | null>(null);
  const [unreadCount, setUnreadCount] = React.useState(0);

  const clientRef = React.useRef<StreamChat | null>(null);
  const connectedUserIdRef = React.useRef<string | null>(null);
  const tokenCacheRef = React.useRef<TokenCache | null>(null);
  const tokenRequestRef = React.useRef<Promise<string> | null>(null);
  const connectionAttemptRef = React.useRef(0);

  const apiKey = config.stream.apiKey;
  const userId = user ? String(user.id) : null;

  // Token provider - fetches and caches tokens
  const getToken = React.useCallback(async (forceRefresh = false): Promise<string> => {
    const now = Date.now();
    const cached = tokenCacheRef.current;

    // Use cached token if valid (with buffer)
    if (!forceRefresh && cached && cached.expiresAt - now > TOKEN_BUFFER_MS) {
      return cached.token;
    }

    // Avoid duplicate requests
    if (tokenRequestRef.current) {
      return tokenRequestRef.current;
    }

    console.log('[Chat] Fetching token from backend...');

    const request = streamApi.getChatToken()
      .then((response) => {
        const expiresAt = response.expiresAt
          ? Date.parse(response.expiresAt)
          : Date.now() + (response.ttlSeconds ? response.ttlSeconds * 1000 : TOKEN_FALLBACK_TTL_MS);

        tokenCacheRef.current = {
          token: response.token,
          expiresAt,
        };

        tokenRequestRef.current = null;
        console.log('[Chat] Token received, expires at:', new Date(expiresAt).toISOString());
        return response.token;
      })
      .catch((err) => {
        tokenRequestRef.current = null;
        console.error('[Chat] Token fetch error:', err);
        throw err;
      });

    tokenRequestRef.current = request;
    return request;
  }, []);

  // Disconnect function
  const disconnect = React.useCallback(async () => {
    console.log('[Chat] Disconnecting...');
    connectionAttemptRef.current += 1;
    tokenCacheRef.current = null;
    tokenRequestRef.current = null;
    connectedUserIdRef.current = null;

    const activeClient = clientRef.current;
    clientRef.current = null;

    if (activeClient) {
      try {
        await activeClient.disconnectUser();
        console.log('[Chat] Disconnected successfully');
      } catch (e) {
        console.log('[Chat] Disconnect error:', e);
      }
    }

    setClient(null);
    setStatus('idle');
    setUnreadCount(0);
  }, []);

  // Connect function
  const connect = React.useCallback(async () => {
    if (!user || !userId || !isAuthenticated || !apiKey) {
      console.log('[Chat] Cannot connect - missing requirements');
      return;
    }

    // Already connected for this user
    if (connectedUserIdRef.current === userId && clientRef.current) {
      console.log('[Chat] Already connected for user:', userId);
      return;
    }

    const attemptId = connectionAttemptRef.current + 1;
    connectionAttemptRef.current = attemptId;

    console.log('[Chat] Connecting user:', userId);

    // Create Stream Chat client
    const chatClient = StreamChat.getInstance(apiKey, {
      timeout: 6000,
    });
    clientRef.current = chatClient;

    setStatus('connecting');
    setError(null);

    const chatUser = buildChatUserPayload(user);

    try {
      const token = await getToken();

      // Check if this connection attempt is still valid
      if (connectionAttemptRef.current !== attemptId) {
        console.log('[Chat] Connection attempt cancelled');
        await chatClient.disconnectUser().catch(() => {});
        return;
      }

      await chatClient.connectUser(chatUser, token);

      connectedUserIdRef.current = userId;
      setClient(chatClient);
      setStatus('connected');

      // Get initial unread count
      const userResponse = chatClient.user as OwnUserResponse | undefined;
      const initialUnread = userResponse?.total_unread_count || 0;
      setUnreadCount(initialUnread);

      console.log('[Chat] Connected successfully, unread:', initialUnread);
    } catch (connectError) {
      const message = connectError instanceof Error
        ? connectError.message
        : 'Failed to connect to chat';

      console.error('[Chat] Connection error:', connectError);

      if (connectionAttemptRef.current === attemptId) {
        setError(message);
        setStatus('error');
      }

      await chatClient.disconnectUser().catch(() => {});

      if (clientRef.current === chatClient) {
        clientRef.current = null;
      }
    }
  }, [apiKey, getToken, isAuthenticated, user, userId]);

  // Reconnect function
  const reconnect = React.useCallback(async () => {
    await disconnect();
    await connect();
  }, [disconnect, connect]);

  // Listen for unread count changes
  React.useEffect(() => {
    if (!client) return;

    const handleEvent = (event: Event) => {
      if (typeof event.total_unread_count === 'number') {
        setUnreadCount(event.total_unread_count);
      }
    };

    const listener = client.on(handleEvent);
    return () => {
      listener?.unsubscribe?.();
    };
  }, [client]);

  // Auto-connect when user is authenticated
  React.useEffect(() => {
    if (!userId || !isAuthenticated || !apiKey) {
      void disconnect();
      return;
    }

    // Already connected for this user
    if (connectedUserIdRef.current === userId && clientRef.current) {
      return;
    }

    let cancelled = false;

    const establishConnection = async () => {
      // If connected to different user, disconnect first
      if (clientRef.current && connectedUserIdRef.current !== userId) {
        await disconnect();
      }

      if (cancelled) return;

      try {
        await connect();
      } catch (e) {
        if (!cancelled) {
          console.error('[Chat] Auto-connect failed:', e);
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

  const value = React.useMemo<ChatContextValue>(() => ({
    client,
    status,
    error,
    unreadCount,
    reconnect,
    disconnect,
  }), [client, status, error, unreadCount, reconnect, disconnect]);

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = React.useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
