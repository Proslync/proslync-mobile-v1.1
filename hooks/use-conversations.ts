import { useQuery, useQueryClient } from '@tanstack/react-query';
import { chatApi, type ConversationResponse } from '@/lib/api/chat';

export const CONVERSATIONS_KEY = 'conversations';

export interface ChannelData {
  id: string;
  name: string;
  imageUrl?: string;
  lastMessage?: {
    text: string;
    createdAt: string;
    userId: string;
    attachmentType?: 'image' | 'video' | 'audio' | null;
  };
  unreadCount: number;
  memberCount: number;
  isOnline?: boolean;
  updatedAt: string;
  lastMessageReadByOther?: boolean;
  otherUserLastReadAt?: string;
}

function mapConversation(conv: ConversationResponse, currentUserId?: number): ChannelData {
  const otherMembers = conv.members.filter((m) => m.userId !== currentUserId);
  const firstOther = otherMembers[0];

  const displayName =
    conv.name ||
    (firstOther
      ? firstOther.userName ||
        [firstOther.firstName, firstOther.lastName].filter(Boolean).join(' ') ||
        'Unknown'
      : 'Chat');

  return {
    id: conv.id,
    name: displayName,
    imageUrl: conv.imageUrl || firstOther?.avatarUrl || undefined,
    lastMessage: conv.lastMessagePreview
      ? {
          text: conv.lastMessagePreview,
          createdAt: conv.lastMessageAt || conv.createdAt,
          userId: '',
          attachmentType: null,
        }
      : undefined,
    unreadCount: conv.unreadCount,
    memberCount: conv.members.length,
    updatedAt: conv.lastMessageAt || conv.createdAt,
  };
}

export function useConversations(currentUserId?: number) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [CONVERSATIONS_KEY],
    staleTime: 10 * 1000,
    gcTime: 5 * 60 * 1000,
    queryFn: async () => {
      const response = await chatApi.getConversations();
      return response.conversations;
    },
  });

  const channelData = (query.data ?? []).map((conv) =>
    mapConversation(conv, currentUserId),
  );

  const deleteChannel = async (conversationId: string) => {
    // For now, just remove from local cache
    // Backend doesn't support conversation deletion yet
    queryClient.setQueryData<ConversationResponse[]>(
      [CONVERSATIONS_KEY],
      (old) => old?.filter((c) => c.id !== conversationId),
    );
    return true;
  };

  return {
    channelData,
    conversations: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    deleteChannel,
  };
}
