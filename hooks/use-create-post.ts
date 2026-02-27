import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postsApi, type PostMedia } from '@/lib/api/posts';
import { FEED_QUERY_KEY } from './use-feed';
import { USER_FEED_QUERY_KEY } from './use-user-feed';

export type { PostMedia as ActivityMedia };

interface UploadMediaParams {
  fileUri: string;
  mimeType: string;
}

interface CreatePostParams {
  text?: string;
  media?: PostMedia[];
  eventId?: number;
  venueId?: number;
  isPublic?: boolean;
}

export function useUploadPostMedia() {
  return useMutation<PostMedia, Error, UploadMediaParams>({
    mutationFn: async ({ fileUri, mimeType }) => {
      const isVideo = mimeType.startsWith('video/');
      const response = await postsApi.uploadMedia(
        fileUri,
        isVideo ? 'video' : 'image',
      );
      return {
        type: isVideo ? 'video' as const : 'image' as const,
        url: response.url,
        fileId: response.fileId,
      };
    },
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, CreatePostParams>({
    mutationFn: async (params) => {
      await postsApi.createPost(params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FEED_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [USER_FEED_QUERY_KEY] });
    },
  });
}

interface CreateEventPostParams {
  eventId: number;
  eventName: string;
  flyerUri?: string | null;
  description?: string;
}

export function useCreateEventPost() {
  const uploadMedia = useUploadPostMedia();
  const createPost = useCreatePost();

  return useMutation<void, Error, CreateEventPostParams>({
    mutationFn: async ({ eventId, flyerUri, description }) => {
      let media: PostMedia[] = [];

      if (flyerUri) {
        const uploaded = await uploadMedia.mutateAsync({
          fileUri: flyerUri,
          mimeType: 'image/jpeg',
        });
        media = [uploaded];
      }

      await createPost.mutateAsync({
        text: description,
        media,
        eventId,
        isPublic: true,
      });
    },
  });
}
