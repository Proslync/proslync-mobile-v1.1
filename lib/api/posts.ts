import { apiClient } from './client';

export interface PostMedia {
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  duration?: string;
  mimeType?: string;
  fileId?: string;
}

export interface FeedItemResponse {
  id: number;
  type: 'post' | 'event';
  text: string | null;
  createdAt: string;
  authorId: number;
  authorUserName: string | null;
  authorFirstName: string | null;
  authorLastName: string | null;
  authorAvatarUrl: string | null;
  media: PostMedia[];
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  isPublic: boolean;
  eventId: number | null;
  eventName: string | null;
  eventStartDate: string | null;
  eventIsPublic: boolean | null;
  eventIsPaid: boolean | null;
  eventImageUrl: string | null;
  eventFlyerUrl: string | null;
  venueId: number | null;
  venueName: string | null;
  isUserRegistered: boolean;
}

export interface FeedResponse {
  items: FeedItemResponse[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface CommentResponse {
  id: number;
  text: string | null;
  userId: number;
  createdAt: string;
  user?: {
    userName?: string;
    firstName?: string;
    lastName?: string;
    avatar?: { url?: string } | null;
  };
}

export interface CommentsResponse {
  comments: CommentResponse[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface UploadMediaResponse {
  url: string;
  fileId?: string;
}

export const postsApi = {
  // Feed endpoints
  getForYouFeed: (cursor?: string, limit = 20) =>
    apiClient.get<FeedResponse>('/api/feed/foryou', {
      params: { cursor, limit },
    }),

  getFollowingFeed: (cursor?: string, limit = 20) =>
    apiClient.get<FeedResponse>('/api/feed/following', {
      params: { cursor, limit },
    }),

  getUserPosts: (userId: number, cursor?: string, limit = 50) =>
    apiClient.get<FeedResponse>(`/api/feed/users/${userId}/posts`, {
      params: { cursor, limit },
    }),

  // Post CRUD
  getPost: (postId: number) =>
    apiClient.get<FeedItemResponse>(`/api/posts/${postId}`),

  createPost: (data: {
    text?: string;
    media?: PostMedia[];
    eventId?: number;
    venueId?: number;
    isPublic?: boolean;
  }) => apiClient.post<FeedItemResponse>('/api/posts', data),

  deletePost: (postId: number) => apiClient.delete(`/api/posts/${postId}`),

  // Reactions
  likePost: (postId: number) =>
    apiClient.post(`/api/posts/${postId}/like`, {}),

  unlikePost: (postId: number) =>
    apiClient.delete(`/api/posts/${postId}/like`),

  addComment: (postId: number, text: string, parentId?: number) =>
    apiClient.post(`/api/posts/${postId}/comments`, {
      type: 'comment',
      text,
      parentId,
    }),

  getComments: (postId: number, cursor?: string, limit = 20) =>
    apiClient.get<CommentsResponse>(`/api/posts/${postId}/comments`, {
      params: { cursor, limit },
    }),

  // Media upload
  uploadMedia: async (
    uri: string,
    mediaType: 'image' | 'video',
  ): Promise<UploadMediaResponse> => {
    const parts = uri.split('/');
    const filename =
      parts[parts.length - 1] ||
      (mediaType === 'video' ? 'post.mp4' : 'post.jpg');
    const extMatch = /\.(\w+)$/.exec(filename);
    const type =
      mediaType === 'video'
        ? `video/${extMatch?.[1] || 'mp4'}`
        : `image/${extMatch?.[1] || 'jpeg'}`;

    return apiClient.uploadFile<UploadMediaResponse>(
      '/api/files/post/upload',
      { uri, name: filename, type },
      'file',
    );
  },
};
