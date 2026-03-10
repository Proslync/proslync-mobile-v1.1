import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  chatApi,
  type MessageResponse,
  type ConversationResponse,
} from '@/lib/api/chat';
import { useAuth } from '@/lib/providers/auth-provider';
import { useChatSocket } from '@/lib/providers/chat-socket-provider';
import { CONVERSATIONS_KEY } from './use-conversations';
import { filesApi } from '@/lib/api/files';

// --- Types ---

export interface ChatMessage {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userImage?: string;
  createdAt: Date;
  isOwn: boolean;
  isSystem?: boolean;
  systemEvent?: string;
  callType?: string;
  callDuration?: number;
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

export interface ChannelMember {
  id: number;
  name: string;
  userName?: string;
  image?: string;
  isVerified?: boolean;
}

export interface ChannelInfo {
  id: string;
  type: 'direct' | 'group' | 'system';
  name: string;
  imageUrl?: string;
  memberCount: number;
  createdById?: number;
  isOnline?: boolean;
  members: ChannelMember[];
  otherMember?: {
    id: string;
    name: string;
    image?: string;
    online?: boolean;
    isVerified?: boolean;
  };
}

// --- Constants ---

export const CONVERSATION_MESSAGES_KEY = 'conversation-messages';

// --- Helpers ---

function mapMessage(msg: MessageResponse, currentUserId: number): ChatMessage {
  // System messages (call events, etc.)
  if (msg.type === 'system') {
    return {
      id: String(msg.id),
      text: msg.text || '',
      userId: '',
      userName: '',
      createdAt: new Date(msg.createdAt),
      isOwn: false,
      isSystem: true,
      systemEvent: msg.systemMetadata?.event,
      callType: msg.systemMetadata?.callType,
      callDuration: msg.systemMetadata?.duration,
    };
  }

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

  const isSystem = msg.type === 'system' || msg.isDeleted;

  return {
    id: String(msg.id),
    text: msg.isDeleted ? 'This message was deleted' : msg.text || '',
    userId: String(msg.senderId),
    userName: senderName,
    userImage: sender?.avatarUrl,
    createdAt: new Date(msg.createdAt),
    isOwn: msg.senderId === currentUserId,
    isSystem,
    attachments,
  };
}

function deriveChannelInfo(
  conv: ConversationResponse,
  currentUserId: number,
): ChannelInfo {
  const otherMembers = conv.members.filter((m) => m.userId !== currentUserId);
  const firstOther = otherMembers[0];
  const displayName =
    conv.name ||
    (firstOther
      ? firstOther.userName ||
        [firstOther.firstName, firstOther.lastName].filter(Boolean).join(' ') ||
        'Chat'
      : 'Chat');

  return {
    id: conv.id,
    type: conv.type,
    name: displayName,
    imageUrl: conv.imageUrl || firstOther?.avatarUrl || undefined,
    memberCount: conv.members.length,
    createdById: conv.createdById,
    members: conv.members.map((m) => ({
      id: m.userId,
      name: m.userName || [m.firstName, m.lastName].filter(Boolean).join(' ') || 'Unknown',
      userName: m.userName,
      image: m.avatarUrl,
      isVerified: m.isVerified,
    })),
    otherMember: firstOther
      ? {
          id: String(firstOther.userId),
          name:
            firstOther.userName ||
            [firstOther.firstName, firstOther.lastName]
              .filter(Boolean)
              .join(' ') ||
            'Unknown',
          image: firstOther.avatarUrl,
          isVerified: firstOther.isVerified,
        }
      : undefined,
  };
}

type InfiniteMessagesData = {
  pages: { messages: MessageResponse[]; nextCursor: string | null; hasMore: boolean }[];
  pageParams: (string | undefined)[];
};

// --- Hook ---

export function useConversation(conversationId: string | undefined) {
  const { user } = useAuth();
  const { socket } = useChatSocket();
  const queryClient = useQueryClient();
  const currentUserId = user?.id ?? 0;
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [otherReadAt, setOtherReadAt] = useState<Date | null>(null);

  // --- Messages (infinite query — newest page first, load older on demand) ---

  const messagesQuery = useInfiniteQuery({
    queryKey: [CONVERSATION_MESSAGES_KEY, conversationId],
    enabled: !!conversationId && !!currentUserId,
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      const response = await chatApi.getMessages(conversationId!, pageParam, 50);
      // Mark as read on initial load only
      if (!pageParam) {
        chatApi.markRead(conversationId!).then(() => {
          queryClient.invalidateQueries({ queryKey: [CONVERSATIONS_KEY] });
        }).catch(() => {});
      }
      return response;
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor ?? undefined : undefined,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
  });

  // Flatten pages into oldest-first array for display
  // API returns newest-first per page; pages[0]=newest batch, pages[N]=oldest batch
  const messages = useMemo(() => {
    const pages = messagesQuery.data?.pages ?? [];
    return pages
      .slice()
      .reverse()
      .flatMap((page) =>
        page.messages
          .slice()
          .reverse()
          .map((m) => mapMessage(m, currentUserId)),
      );
  }, [messagesQuery.data, currentUserId]);

  // --- Channel info (shared query with conversations list) ---

  const conversationsQuery = useQuery({
    queryKey: [CONVERSATIONS_KEY],
    queryFn: async () => {
      const response = await chatApi.getConversations();
      return response.conversations;
    },
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!conversationId && !!currentUserId,
  });

  const channelInfo = useMemo((): ChannelInfo | null => {
    if (!conversationId || !currentUserId) return null;
    const conv = conversationsQuery.data?.find((c) => c.id === conversationId);
    if (!conv) return null;
    return deriveChannelInfo(conv, currentUserId);
  }, [conversationId, currentUserId, conversationsQuery.data]);

  // --- Socket.IO for real-time updates (uses shared socket from ChatSocketProvider) ---

  useEffect(() => {
    if (!socket || !conversationId || !currentUserId) return;

    // Join conversation room
    socket.emit('chat:join', { conversationId });

    const onMessage = (data: { message: MessageResponse }) => {
      // Skip own messages — already added optimistically via sendMessage
      if (data.message.senderId === currentUserId) return;

      // Insert into React Query cache (prepend to newest page)
      queryClient.setQueryData<InfiniteMessagesData>(
        [CONVERSATION_MESSAGES_KEY, conversationId],
        (old) => {
          if (!old?.pages?.length) return old;
          const pages = [...old.pages];
          pages[0] = {
            ...pages[0],
            messages: [data.message, ...pages[0].messages],
          };
          return { ...old, pages };
        },
      );

      chatApi.markRead(conversationId).catch(() => {});
      queryClient.invalidateQueries({ queryKey: [CONVERSATIONS_KEY] });
    };

    const onTyping = (data: { userId: number }) => {
      if (data.userId !== currentUserId) {
        setIsTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
      }
    };

    const onRead = (data: { userId: number; lastReadAt: string }) => {
      if (data.userId !== currentUserId) {
        setOtherReadAt(new Date(data.lastReadAt));
      }
    };

    socket.on('chat:message', onMessage);
    socket.on('chat:typing', onTyping);
    socket.on('chat:read', onRead);

    return () => {
      socket.emit('chat:leave', { conversationId });
      socket.off('chat:message', onMessage);
      socket.off('chat:typing', onTyping);
      socket.off('chat:read', onRead);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    };
  }, [socket, conversationId, currentUserId, queryClient]);

  // --- Send message (optimistic update) ---

  const sendMessageMutation = useMutation({
    mutationFn: async (params: {
      text: string;
      attachments?: { type: 'image' | 'video'; uri: string }[];
    }) => {
      return chatApi.sendMessage(conversationId!, {
        type: 'text',
        text: params.text.trim() || undefined,
      });
    },
    onMutate: async (params) => {
      await queryClient.cancelQueries({
        queryKey: [CONVERSATION_MESSAGES_KEY, conversationId],
      });

      const optimisticMsg: MessageResponse = {
        id: -Date.now(),
        conversationId: conversationId!,
        senderId: currentUserId,
        type: 'text',
        text: params.text.trim(),
        mediaUrl: null,
        mediaMetadata: null,
        isDeleted: false,
        createdAt: new Date().toISOString(),
        sender: {
          id: currentUserId,
          userName: user?.userName,
          firstName: user?.firstName,
          lastName: user?.lastName,
          avatarUrl: user?.avatar?.url,
        },
      };

      queryClient.setQueryData<InfiniteMessagesData>(
        [CONVERSATION_MESSAGES_KEY, conversationId],
        (old) => {
          if (!old?.pages?.length) return old;
          const pages = [...old.pages];
          pages[0] = {
            ...pages[0],
            messages: [optimisticMsg, ...pages[0].messages],
          };
          return { ...old, pages };
        },
      );

      return { optimisticId: optimisticMsg.id };
    },
    onSuccess: (serverMsg, _vars, context) => {
      // Replace optimistic message with server response
      queryClient.setQueryData<InfiniteMessagesData>(
        [CONVERSATION_MESSAGES_KEY, conversationId],
        (old) => {
          if (!old?.pages?.length) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              messages: page.messages.map((m) =>
                m.id === context?.optimisticId ? serverMsg : m,
              ),
            })),
          };
        },
      );
      queryClient.invalidateQueries({ queryKey: [CONVERSATIONS_KEY] });
    },
    onError: (_err, _vars, context) => {
      // Remove optimistic message on failure
      queryClient.setQueryData<InfiniteMessagesData>(
        [CONVERSATION_MESSAGES_KEY, conversationId],
        (old) => {
          if (!old?.pages?.length) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              messages: page.messages.filter(
                (m) => m.id !== context?.optimisticId,
              ),
            })),
          };
        },
      );
    },
  });

  // --- Delete message (optimistic removal) ---

  const deleteMessageMutation = useMutation({
    mutationFn: (messageId: string) => chatApi.deleteMessage(Number(messageId)),
    onMutate: async (messageId) => {
      await queryClient.cancelQueries({
        queryKey: [CONVERSATION_MESSAGES_KEY, conversationId],
      });

      const previous = queryClient.getQueryData<InfiniteMessagesData>([
        CONVERSATION_MESSAGES_KEY,
        conversationId,
      ]);

      queryClient.setQueryData<InfiniteMessagesData>(
        [CONVERSATION_MESSAGES_KEY, conversationId],
        (old) => {
          if (!old?.pages?.length) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              messages: page.messages.filter(
                (m) => String(m.id) !== messageId,
              ),
            })),
          };
        },
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          [CONVERSATION_MESSAGES_KEY, conversationId],
          context.previous,
        );
      }
    },
  });

  // --- Send voice message (optimistic update + upload) ---

  const sendVoiceMessageMutation = useMutation({
    mutationFn: async (params: { uri: string; duration: number }) => {
      // Upload audio file to GCS
      const mediaUrl = await filesApi.uploadVoiceMessage(params.uri);

      // Send message with uploaded URL
      return chatApi.sendMessage(conversationId!, {
        type: 'voice',
        mediaUrl,
        mediaMetadata: {
          duration: params.duration,
          mimeType: 'audio/mp4',
        },
      });
    },
    onMutate: async (params) => {
      await queryClient.cancelQueries({
        queryKey: [CONVERSATION_MESSAGES_KEY, conversationId],
      });

      const optimisticMsg: MessageResponse = {
        id: -Date.now(),
        conversationId: conversationId!,
        senderId: currentUserId,
        type: 'voice',
        text: null,
        mediaUrl: params.uri,
        mediaMetadata: {
          duration: params.duration,
          mimeType: 'audio/mp4',
        },
        isDeleted: false,
        createdAt: new Date().toISOString(),
        sender: {
          id: currentUserId,
          userName: user?.userName,
          firstName: user?.firstName,
          lastName: user?.lastName,
          avatarUrl: user?.avatar?.url,
        },
      };

      queryClient.setQueryData<InfiniteMessagesData>(
        [CONVERSATION_MESSAGES_KEY, conversationId],
        (old) => {
          if (!old?.pages?.length) return old;
          const pages = [...old.pages];
          pages[0] = {
            ...pages[0],
            messages: [optimisticMsg, ...pages[0].messages],
          };
          return { ...old, pages };
        },
      );

      return { optimisticId: optimisticMsg.id };
    },
    onSuccess: (serverMsg, _vars, context) => {
      queryClient.setQueryData<InfiniteMessagesData>(
        [CONVERSATION_MESSAGES_KEY, conversationId],
        (old) => {
          if (!old?.pages?.length) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              messages: page.messages.map((m) =>
                m.id === context?.optimisticId ? serverMsg : m,
              ),
            })),
          };
        },
      );
      queryClient.invalidateQueries({ queryKey: [CONVERSATIONS_KEY] });
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData<InfiniteMessagesData>(
        [CONVERSATION_MESSAGES_KEY, conversationId],
        (old) => {
          if (!old?.pages?.length) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              messages: page.messages.filter(
                (m) => m.id !== context?.optimisticId,
              ),
            })),
          };
        },
      );
    },
  });

  // --- Public API (preserves existing interface) ---

  const sendMessage = useCallback(
    async (
      text: string,
      attachments?: { type: 'image' | 'video'; uri: string }[],
    ) => {
      if (!conversationId) return;
      if (!text.trim() && (!attachments || attachments.length === 0)) return;
      await sendMessageMutation.mutateAsync({ text, attachments });
    },
    [conversationId, sendMessageMutation],
  );

  const sendVoiceMessage = useCallback(
    async (uri: string, duration: number) => {
      if (!conversationId) return;
      await sendVoiceMessageMutation.mutateAsync({ uri, duration });
    },
    [conversationId, sendVoiceMessageMutation],
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      await deleteMessageMutation.mutateAsync(messageId);
    },
    [deleteMessageMutation],
  );

  const sendTypingStart = useCallback(async () => {
    if (!conversationId || !socket) return;
    socket.emit('chat:typing', { conversationId });
  }, [conversationId, socket]);

  const sendTypingStop = useCallback(async () => {
    // No explicit stop event — typing auto-clears after timeout
  }, []);

  const loadOlderMessages = useCallback(async () => {
    if (messagesQuery.hasNextPage && !messagesQuery.isFetchingNextPage) {
      await messagesQuery.fetchNextPage();
    }
  }, [messagesQuery]);

  return {
    messages,
    channelInfo,
    isLoading: messagesQuery.isLoading,
    error: messagesQuery.error,
    isTyping,
    currentUserId: String(currentUserId),
    otherReadAt,
    sendMessage,
    sendVoiceMessage,
    sendTypingStart,
    sendTypingStop,
    deleteMessage,
    loadOlderMessages,
    hasOlderMessages: !!messagesQuery.hasNextPage,
    isSending: sendMessageMutation.isPending,
    isSendingVoice: sendVoiceMessageMutation.isPending,
  };
}
