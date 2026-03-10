import { apiClient } from './client';

export interface ConversationMember {
  userId: number;
  userName?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  isVerified?: boolean;
  lastReadAt?: string;
  joinedAt: string;
}

export interface ConversationResponse {
  id: string;
  type: 'direct' | 'group' | 'system';
  name: string | null;
  imageUrl: string | null;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  unreadCount: number;
  isPinned?: boolean;
  members: ConversationMember[];
  createdAt: string;
}

export interface MessageResponse {
  id: number;
  conversationId: string;
  senderId: number;
  type: 'text' | 'image' | 'video' | 'voice' | 'system';
  text: string | null;
  mediaUrl: string | null;
  mediaMetadata: {
    width?: number;
    height?: number;
    duration?: number;
    mimeType?: string;
    thumbnailUrl?: string;
  } | null;
  isDeleted: boolean;
  createdAt: string;
  sender?: {
    id: number;
    userName?: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
  };
}

export interface MessagesResponse {
  messages: MessageResponse[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ConversationsResponse {
  conversations: ConversationResponse[];
}

export const chatApi = {
  getConversations: () =>
    apiClient.get<ConversationsResponse>('/api/conversations'),

  createConversation: (memberIds: number[], name?: string) =>
    apiClient.post<ConversationResponse>('/api/conversations', {
      memberIds,
      name,
    }),

  getMessages: (conversationId: string, cursor?: string, limit = 30) => {
    const params = new URLSearchParams();
    params.set('limit', String(limit));
    if (cursor) params.set('cursor', cursor);
    return apiClient.get<MessagesResponse>(
      `/api/conversations/${conversationId}/messages?${params.toString()}`,
    );
  },

  sendMessage: (
    conversationId: string,
    data: {
      type?: 'text' | 'image' | 'video' | 'voice';
      text?: string;
      mediaUrl?: string;
      mediaMetadata?: Record<string, unknown>;
    },
  ) =>
    apiClient.post<MessageResponse>(
      `/api/conversations/${conversationId}/messages`,
      data,
    ),

  markRead: (conversationId: string) =>
    apiClient.post(`/api/conversations/${conversationId}/read`, {}),

  deleteMessage: (messageId: number) =>
    apiClient.delete(`/api/conversations/messages/${messageId}`),

  addMembers: (conversationId: string, memberIds: number[]) =>
    apiClient.post<{ added: number }>(
      `/api/conversations/${conversationId}/members`,
      { memberIds },
    ),

  removeMember: (conversationId: string, userId: number) =>
    apiClient.delete(`/api/conversations/${conversationId}/members/${userId}`),

  leaveConversation: (conversationId: string) =>
    apiClient.post<{ success: boolean }>(
      `/api/conversations/${conversationId}/leave`,
      {},
    ),

  updateConversation: (
    conversationId: string,
    data: { name?: string; imageUrl?: string },
  ) =>
    apiClient.patch<ConversationResponse>(
      `/api/conversations/${conversationId}`,
      data,
    ),

  pinConversation: (conversationId: string) =>
    apiClient.patch<{ success: boolean }>(
      `/api/conversations/${conversationId}/pin`,
      {},
    ),

  unpinConversation: (conversationId: string) =>
    apiClient.patch<{ success: boolean }>(
      `/api/conversations/${conversationId}/unpin`,
      {},
    ),

  getConciergeConversation: () =>
    apiClient.post<ConversationResponse>('/api/conversations/concierge', {}),
};
