import { apiClient } from './client';

export interface EngagementSignal {
  postId: number;
  authorId: number;
  dwellTimeMs: number;
  videoWatchPercent?: number;
  didLike?: boolean;
  didComment?: boolean;
  didShare?: boolean;
  didScrollPast?: boolean;
  didExpandPost?: boolean;
  didViewProfile?: boolean;
  feedPosition?: number;
}

export interface TrackEngagementPayload {
  feedType: string;
  signals: EngagementSignal[];
}

export const engagementApi = {
  /**
   * Send batched engagement signals to the backend.
   * Fire-and-forget — errors are silently ignored.
   */
  trackEngagement: (payload: TrackEngagementPayload): Promise<void> =>
    apiClient.post('/api/feed/engagement', payload),
};
