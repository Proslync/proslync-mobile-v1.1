// Feed hooks
export { useFeed, FEED_QUERY_KEY, useRefreshFeeds } from './use-feed';
export { useFeedEngagement } from './use-feed-engagement';
export { useUserFeed, USER_FEED_QUERY_KEY } from './use-user-feed';

// Post creation hooks
export {
  useUploadPostMedia,
  useCreatePost,
  useCreateEventPost,
} from './use-create-post';
export type { ActivityMedia } from './use-create-post';

// Post detail hooks
export { usePost, POST_QUERY_KEY } from './use-post';
export type { PostResponse } from './use-post';
export { usePostComments, POST_COMMENTS_KEY } from './use-post-comments';
export type { CommentData } from './use-post-comments';
export { useAddComment } from './use-add-comment';
export { usePostReaction } from './use-post-reaction';
export { useDeletePost } from './use-delete-post';

// Follow hooks
export { useFollowUser } from './use-follow-user';
export { useMutualFollowers, MUTUAL_FOLLOWERS_KEY } from './use-mutual-followers';

// User profile hooks
export { useUserProfile, USER_PROFILE_KEY } from './use-user-profile';

// Block hooks
export { useBlockedUsers, useBlockUser, useUnblockUser, BLOCKED_USERS_KEY } from './use-blocked-users';

// Search/Discover hooks
export { useDebounce } from './use-debounce';
export {
  useSearch,
  SEARCH_QUERY_KEY,
  mapPersonToDiscover,
  mapEventToDiscover,
  mapVenueToDiscover,
} from './use-search';
export {
  useUnifiedSearch,
  UNIFIED_SEARCH_KEY,
  SUGGESTIONS_KEY,
} from './use-unified-search';

// Analytics hooks
export { useTrackEventView, clearTrackingCache } from './use-track-event-view';

// Notification hooks
export {
  useMyTeamInvitations,
  useAcceptTeamInvitation,
  useDeclineTeamInvitation,
  MY_TEAM_INVITATIONS_KEY,
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  NOTIFICATIONS_KEY,
  UNREAD_COUNT_KEY,
} from './use-notifications';

// User Preferences hooks
export {
  useUserPreferences,
  useUpdatePreference,
  USER_PREFERENCES_KEY,
} from './use-user-preferences';

// Account socket
export { useAccountStatusSocket } from './use-account-status-socket';

// Call hooks
export { useCall } from '../lib/providers/call-provider';

// Admin hooks
export {
  useAdminStats,
  useAdminActivity,
  useAdminUsers,
  useAdminPosts,
  useUpdateUserRole,
  useUpdateUserStatus,
  useUpdateUserVerified,
  useAdminDeletePost,
  ADMIN_STATS_KEY,
  ADMIN_ACTIVITY_KEY,
  ADMIN_USERS_KEY,
  ADMIN_POSTS_KEY,
} from './use-admin';
