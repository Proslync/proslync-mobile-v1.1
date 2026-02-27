import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { chatApi, type MessageResponse } from '@/lib/api/chat';
import { useAuth } from '@/lib/providers/auth-provider';
import { CONVERSATIONS_KEY } from './use-conversations';
import io, { type Socket } from 'socket.io-client';
import { config } from '@/lib/config';
import * as SecureStore from 'expo-secure-store';

export interface ChatMessage {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userImage?: string;
  createdAt: Date;
  isOwn: boolean;
  attachments?: {
    type: 'image' | 'video' | 'audio';
    url: string;
    thumbUrl?: string;
    width?: number;
    height?: number;
    duration?: number;
    mimeType?: string;
  }[];
}

export interface ChannelInfo {
  id: string;
  name: string;
  imageUrl?: string;
  memberCount: number;
  isOnline?: boolean;
  otherMember?: {
    id: string;
    name: string;
    image?: string;
    online?: boolean;
  };
}

const MESSAGES_KEY = 'conversation-messages';

function mapMessage(msg: MessageResponse, currentUserId: number): ChatMessage {
  const sender = msg.sender;
  const senderName = sender
    ? sender.userName ||
      [sender.firstName, sender.lastName].filter(Boolean).join(' ') ||
      'Unknown'
    : 'Unknown';

  let attachments: ChatMessage['attachments'];
  if (msg.mediaUrl && msg.type !== 'text') {
    attachments = [
      {
        type: msg.type as 'image' | 'video' | 'audio',
        url: msg.mediaUrl,
        thumbUrl: msg.mediaMetadata?.thumbnailUrl,
        width: msg.mediaMetadata?.width,
        height: msg.mediaMetadata?.height,
        duration: msg.mediaMetadata?.duration,
        mimeType: msg.mediaMetadata?.mimeType,
      },
    ];
  }

  return {
    id: String(msg.id),
    text: msg.isDeleted ? 'This message was deleted' : msg.text || '',
    userId: String(msg.senderId),
    userName: senderName,
    userImage: sender?.avatarUrl,
    createdAt: new Date(msg.createdAt),
    isOwn: msg.senderId === currentUserId,
    attachments,
  };
}

export function useConversation(conversationId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const currentUserId = user?.id ?? 0;
  const socketRef = React.useRef<Socket | null>(null);

  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [channelInfo, setChannelInfo] = React.useState<ChannelInfo | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const [isTyping, setIsTyping] = React.useState(false);
  const [otherReadAt, setOtherReadAt] = React.useState<Date | null>(null);

  // Fetch initial messages
  React.useEffect(() => {
    if (!conversationId || !currentUserId) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const init = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch messages
        const response = await chatApi.getMessages(conversationId, undefined, 50);

        if (cancelled) return;

        const mapped = response.messages
          .map((m) => mapMessage(m, currentUserId))
          .reverse(); // API returns newest first, we want oldest first
        setMessages(mapped);

        // Mark as read
        await chatApi.markRead(conversationId);

        // Get conversation info for header
        const convResponse = await chatApi.getConversations();
        const conv = convResponse.conversations.find((c) => c.id === conversationId);
        if (conv) {
          const otherMembers = conv.members.filter((m) => m.userId !== currentUserId);
          const firstOther = otherMembers[0];
          const displayName =
            conv.name ||
            (firstOther
              ? firstOther.userName ||
                [firstOther.firstName, firstOther.lastName].filter(Boolean).join(' ') ||
                'Chat'
              : 'Chat');

          setChannelInfo({
            id: conv.id,
            name: displayName,
            imageUrl: conv.imageUrl || firstOther?.avatarUrl || undefined,
            memberCount: conv.members.length,
            otherMember: firstOther
              ? {
                  id: String(firstOther.userId),
                  name:
                    firstOther.userName ||
                    [firstOther.firstName, firstOther.lastName].filter(Boolean).join(' ') ||
                    'Unknown',
                  image: firstOther.avatarUrl,
                }
              : undefined,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Failed to load conversation'));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    init();
    return () => {
      cancelled = true;
    };
  }, [conversationId, currentUserId]);

  // Socket.IO for real-time
  React.useEffect(() => {
    if (!conversationId || !currentUserId) return;

    let socket: Socket | null = null;
    let cancelled = false;

    const initSocket = async () => {
      const token = await SecureStore.getItemAsync('accessToken');
      if (!token || cancelled) return;

      const s = io(`${config.websocket.url}/chat`, {
        auth: { token },
        transports: ['websocket'],
      });

      socket = s;
      socketRef.current = s;

      s.on('connect', () => {
        s.emit('chat:join', { conversationId });
      });

      s.on('chat:message', (data: { message: MessageResponse }) => {
        // Skip messages from ourselves — already added optimistically in sendMessage
        if (data.message.senderId === currentUserId) return;
        const mapped = mapMessage(data.message, currentUserId);
        setMessages((prev) => [...prev, mapped]);
        chatApi.markRead(conversationId);
      });

      s.on('chat:typing', (data: { userId: number }) => {
        if (data.userId !== currentUserId) {
          setIsTyping(true);
          setTimeout(() => setIsTyping(false), 3000);
        }
      });

      s.on('chat:read', (data: { userId: number; lastReadAt: string }) => {
        if (data.userId !== currentUserId) {
          setOtherReadAt(new Date(data.lastReadAt));
        }
      });
    };

    initSocket();

    return () => {
      cancelled = true;
      if (socket) {
        socket.emit('chat:leave', { conversationId });
        socket.disconnect();
      }
      socketRef.current = null;
    };
  }, [conversationId, currentUserId]);

  const sendMessage = React.useCallback(
    async (text: string, attachments?: { type: 'image' | 'video'; uri: string }[]) => {
      if (!conversationId) return;
      if (!text.trim() && (!attachments || attachments.length === 0)) return;

      try {
        // For now, just send text messages
        // Media upload can be added later using the files API
        const response = await chatApi.sendMessage(conversationId, {
          type: 'text',
          text: text.trim() || undefined,
        });

        // Add to local messages immediately
        const mapped = mapMessage(response, currentUserId);
        setMessages((prev) => [...prev, mapped]);

        // Invalidate conversations list to update preview
        queryClient.invalidateQueries({ queryKey: [CONVERSATIONS_KEY] });
      } catch (err) {
        console.error('Error sending message:', err);
        throw err;
      }
    },
    [conversationId, currentUserId, queryClient],
  );

  const sendVoiceMessage = React.useCallback(
    async (uri: string, duration: number) => {
      if (!conversationId) return;
      // Voice messages not yet supported in our backend
      console.warn('Voice messages not yet supported');
    },
    [conversationId],
  );

  const deleteMessage = React.useCallback(
    async (messageId: string) => {
      try {
        await chatApi.deleteMessage(Number(messageId));
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      } catch (err) {
        console.error('Error deleting message:', err);
        throw err;
      }
    },
    [],
  );

  const sendTypingStart = React.useCallback(async () => {
    if (!conversationId || !socketRef.current) return;
    socketRef.current.emit('chat:typing', { conversationId });
  }, [conversationId]);

  const sendTypingStop = React.useCallback(async () => {
    // No explicit stop event needed — typing auto-clears
  }, []);

  return {
    channel: null, // Not needed anymore
    messages,
    channelInfo,
    isLoading,
    error,
    isTyping,
    currentUserId: String(currentUserId),
    otherReadAt,
    sendMessage,
    sendVoiceMessage,
    sendTypingStart,
    sendTypingStop,
    deleteMessage,
  };
}
