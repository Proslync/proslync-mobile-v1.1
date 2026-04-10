import { apiClient } from './client';

export type ChannelVisibility = 'public' | 'private';
export type ChannelMemberRole = 'owner' | 'admin' | 'member';
export type ChannelPostType = 'text' | 'image' | 'video';

export interface ChannelMediaMetadata {
  width?: number;
  height?: number;
  duration?: number;
  mimeType?: string;
  thumbnailUrl?: string;
}

export interface ChannelResponse {
  id: string;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  coverImageUrl: string | null;
  visibility: ChannelVisibility;
  ownerId: number;
  organizationId: number | null;
  memberCount: number;
  postCount: number;
  createdAt: string;
  updatedAt: string;
  // Membership fields (when called as a member)
  userRole?: ChannelMemberRole | null;
  isMember?: boolean;
  unreadCount?: number;
}

export interface ChannelMemberResponse {
  id: number;
  channelId: string;
  userId: number;
  role: ChannelMemberRole;
  joinedAt: string;
  notificationsMuted: boolean;
  user?: {
    id: number;
    userName?: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
    isVerified?: boolean;
  };
}

export interface ChannelPostResponse {
  id: number;
  channelId: string;
  authorId: number;
  type: ChannelPostType;
  text: string | null;
  mediaUrl: string | null;
  mediaMetadata: ChannelMediaMetadata | null;
  reactionCounts: Record<string, number>;
  userReaction: string | null;
  isDeleted: boolean;
  createdAt: string;
  author?: {
    id: number;
    userName?: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
    isVerified?: boolean;
  };
}

export interface ChannelPostsPage {
  posts: ChannelPostResponse[];
  hasMore: boolean;
  nextCursor: number | null;
}

export interface ChannelMembersPage {
  members: ChannelMemberResponse[];
  total: number;
  page: number;
  hasMore: boolean;
}

export interface CreateChannelDto {
  name: string;
  description?: string;
  avatarUrl?: string;
  coverImageUrl?: string;
  visibility?: ChannelVisibility;
  organizationId?: number;
}

export interface UpdateChannelDto {
  name?: string;
  description?: string;
  avatarUrl?: string;
  coverImageUrl?: string;
  visibility?: ChannelVisibility;
}

export interface CreateChannelPostDto {
  type: ChannelPostType;
  text?: string;
  mediaUrl?: string;
  mediaMetadata?: ChannelMediaMetadata;
}

export const channelsApi = {
  // Channel CRUD
  createChannel: (data: CreateChannelDto): Promise<ChannelResponse> =>
    apiClient.post<ChannelResponse>('/api/channels', data),

  getMyChannels: (): Promise<ChannelResponse[]> =>
    apiClient.get<ChannelResponse[]>('/api/channels/my'),

  getChannel: (id: string): Promise<ChannelResponse> =>
    apiClient.get<ChannelResponse>(`/api/channels/${id}`),

  updateChannel: (id: string, data: UpdateChannelDto): Promise<ChannelResponse> =>
    apiClient.put<ChannelResponse>(`/api/channels/${id}`, data),

  deleteChannel: (id: string): Promise<{ success: boolean }> =>
    apiClient.delete<{ success: boolean }>(`/api/channels/${id}`),

  // Membership
  joinChannel: (id: string): Promise<{ success: boolean }> =>
    apiClient.post<{ success: boolean }>(`/api/channels/${id}/join`),

  leaveChannel: (id: string): Promise<{ success: boolean }> =>
    apiClient.post<{ success: boolean }>(`/api/channels/${id}/leave`),

  getMembers: (id: string, page = 1, limit = 50): Promise<ChannelMembersPage> =>
    apiClient.get<ChannelMembersPage>(`/api/channels/${id}/members?page=${page}&limit=${limit}`),

  removeMember: (id: string, userId: number): Promise<{ success: boolean }> =>
    apiClient.delete<{ success: boolean }>(`/api/channels/${id}/members/${userId}`),

  addMember: (id: string, userId: number): Promise<ChannelMemberResponse> =>
    apiClient.post<ChannelMemberResponse>(`/api/channels/${id}/members`, { userId }),

  updateMemberRole: (id: string, userId: number, role: ChannelMemberRole): Promise<ChannelMemberResponse> =>
    apiClient.put<ChannelMemberResponse>(`/api/channels/${id}/members/${userId}/role`, { role }),

  // Posts
  getPosts: (id: string, cursor?: number, limit = 30): Promise<ChannelPostsPage> => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (cursor) params.set('cursor', String(cursor));
    return apiClient.get<ChannelPostsPage>(`/api/channels/${id}/posts?${params.toString()}`);
  },

  createPost: (id: string, data: CreateChannelPostDto): Promise<ChannelPostResponse> =>
    apiClient.post<ChannelPostResponse>(`/api/channels/${id}/posts`, data),

  deletePost: (postId: number): Promise<{ success: boolean }> =>
    apiClient.delete<{ success: boolean }>(`/api/channels/posts/${postId}`),

  // Reactions
  setReaction: (postId: number, emoji: string): Promise<ChannelPostResponse> =>
    apiClient.put<ChannelPostResponse>(`/api/channels/posts/${postId}/reaction`, { emoji }),

  removeReaction: (postId: number): Promise<ChannelPostResponse> =>
    apiClient.delete<ChannelPostResponse>(`/api/channels/posts/${postId}/reaction`),

  // Discovery
  discover: (q?: string, limit = 20): Promise<ChannelResponse[]> => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (q) params.set('q', q);
    return apiClient.get<ChannelResponse[]>(`/api/channels/discover?${params.toString()}`);
  },
};
