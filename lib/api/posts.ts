// Posts API - Create user posts via backend
import { apiClient } from './client';

export interface CreatePostResponse {
  id: string;
  imageUrl?: string;
  videoUrl?: string;
  message: string;
}

export interface UploadMediaResponse {
  url: string;
  fileId?: string;
}

export const postsApi = {
  /**
   * Upload post media (image or video)
   * Backend endpoint: POST /api/files/post/upload
   */
  uploadMedia: async (
    uri: string,
    mediaType: 'image' | 'video'
  ): Promise<UploadMediaResponse> => {
    const filename = uri.split('/').pop() || (mediaType === 'video' ? 'post.mp4' : 'post.jpg');
    const match = /\.(\w+)$/.exec(filename);
    const type = mediaType === 'video'
      ? `video/${match?.[1] || 'mp4'}`
      : `image/${match?.[1] || 'jpeg'}`;

    return apiClient.uploadFile<UploadMediaResponse>(
      '/api/files/post/upload',
      { uri, name: filename, type },
      'file'
    );
  },

  /**
   * Create a post activity
   * Backend endpoint: POST /api/posts
   */
  createPost: async (data: {
    caption?: string;
    mediaUrl: string;
    mediaType: 'image' | 'video';
  }): Promise<CreatePostResponse> => {
    return apiClient.post<CreatePostResponse>('/api/posts', data);
  },
};
