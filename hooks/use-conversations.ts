import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useCallback } from 'react';
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
  isPinned: boolean;
  isConcierge: boolean;
  otherUserId?: number;
  isVerified?: boolean;
}

function mapConversation(conv: ConversationResponse, currentUserId?: number): ChannelData {
  const otherMembers = conv.members.filter((m) => m.userId !== currentUserId);
  const firstOther = otherMembers[0];
  const isConcierge = conv.type === 'system';

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
    isPinned: conv.isPinned || false,
    isConcierge,
    otherUserId: firstOther?.userId,
    isVerified: firstOther?.isVerified,
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

  const channelData = useMemo(() => {
    const data = query.data ?? [];
    return data
      .map((conv) => mapConversation(conv, currentUserId))
      .sort((a, b) => {
        if (a.isConcierge && !b.isConcierge) return -1;
        if (!a.isConcierge && b.isConcierge) return 1;
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return bTime - aTime;
      });
  }, [query.data, currentUserId]);

  const deleteChannel = useCallback(async (conversationId: string) => {
    queryClient.setQueryData<ConversationResponse[]>(
      [CONVERSATIONS_KEY],
      (old) => old?.filter((c) => c.id !== conversationId),
    );
    return true;
  }, [queryClient]);

  return {
    channelData,
    conversations: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    deleteChannel,
  };
}

export function usePinConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) => chatApi.pinConversation(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CONVERSATIONS_KEY] });
    },
  });
}

export function useUnpinConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) => chatApi.unpinConversation(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CONVERSATIONS_KEY] });
    },
  });
}

export function useAddMembers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, memberIds }: { conversationId: string; memberIds: number[] }) =>
      chatApi.addMembers(conversationId, memberIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CONVERSATIONS_KEY] });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, userId }: { conversationId: string; userId: number }) =>
      chatApi.removeMember(conversationId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CONVERSATIONS_KEY] });
    },
  });
}

export function useLeaveConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) => chatApi.leaveConversation(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CONVERSATIONS_KEY] });
    },
  });
}

export function useUpdateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, data }: { conversationId: string; data: { name?: string; imageUrl?: string } }) =>
      chatApi.updateConversation(conversationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CONVERSATIONS_KEY] });
    },
  });
}

export function useEnsureConcierge() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let cancelled = false;
    chatApi.getConciergeConversation().then(() => {
      if (!cancelled) queryClient.invalidateQueries({ queryKey: [CONVERSATIONS_KEY] });
    }).catch(() => {});
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
