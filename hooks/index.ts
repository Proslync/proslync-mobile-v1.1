// Feed hooks
export { useFeed, FEED_QUERY_KEY, useRefreshFeeds } from './use-feed';
export { useUserFeed, USER_FEED_QUERY_KEY } from './use-user-feed';
export { useEventForm, useEditEventForm } from './use-event-form';
export type { EventFormStep } from './use-event-form';
export {
  useCreateEvent,
  useUpdateEvent,
  useUploadFlyer,
  usePublishEvent,
  useDeleteEvent,
  useRegisterForEvent,
} from './use-event-mutations';
export { useMyEvents, useEvent, useEvents } from './use-events-query';
export { useEventMarketingStats } from './use-dashboard-query';
export { useEventAttendees } from './use-event-attendees';
export { useAllAttendees, ALL_ATTENDEES_KEY } from './use-all-attendees';
export { useContacts, CONTACTS_KEY } from './use-contacts';
export { useMyVenues } from './use-venues-query';
export { useVenueFollowers, VENUE_FOLLOWERS_KEY } from './use-venue-followers';
export { useFollowVenue } from './use-follow-venue';
export { useAddressSuggestions } from './use-address-suggestions';
export type { AddressSuggestion } from './use-address-suggestions';

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

// Ticket/Payment hooks
export { useMyTickets, MY_TICKETS_KEY } from './use-my-tickets';
export { useGetTiers, TIERS_QUERY_KEY } from './use-ticket-tiers';
export { useValidatePromoCode } from './use-promo-code';
export {
  useCreatePaymentIntent,
  usePaymentStatus,
  PAYMENT_STATUS_QUERY_KEY,
} from './use-payment-intent';

// Analytics hooks
export { useTrackEventView, clearTrackingCache } from './use-track-event-view';
export { useRevenueTimeSeries, REVENUE_TIMESERIES_KEY } from './use-revenue-analytics';

// Pricing CRUD hooks
export {
  useGetPromoCodes,
  useCreateTier,
  useUpdateTier,
  useDeleteTier,
  useCreatePricingRule,
  useUpdatePricingRule,
  useDeletePricingRule,
  useCreatePromoCode,
  useUpdatePromoCode,
  useDeletePromoCode,
  useTogglePromoCodeActive,
} from './use-pricing-mutations';

// Team hooks
export {
  useTeamMembers,
  useTeamRoles,
  useTeamInvitations,
  useTeamStats,
  TEAM_MEMBERS_KEY,
  TEAM_ROLES_KEY,
  TEAM_INVITATIONS_KEY,
  TEAM_STATS_KEY,
} from './use-team-queries';
export {
  useUpdateMemberRole,
  useRemoveTeamMember,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  useUpdateRolePermissions,
  useInviteByUserId,
  useCancelInvitation,
} from './use-team-mutations';

// Artist hooks
export {
  useEventArtists,
  useCreateEventArtist,
  useUpdateEventArtist,
  useDeleteEventArtist,
  EVENT_ARTISTS_KEY,
} from './use-event-artists';

// Permission hooks
export { useEventPermissions, EVENT_PERMISSIONS_KEY } from './use-event-permissions';

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

// Membership card hooks
export { useMembershipCard, MEMBERSHIP_CARD_KEY } from './use-membership-card';

// User Preferences hooks
export {
  useUserPreferences,
  useUpdatePreference,
  USER_PREFERENCES_KEY,
} from './use-user-preferences';

// Wallet / Stripe Connect hooks
export {
  useStripeAccountStatus,
  useStripeBalance,
  useExternalAccounts,
  useEarnings,
  usePayouts,
  useCreatePayout,
  useCreateCustomAccount,
  useUpdateCustomAccount,
  useSetupStripeAccount,
  STRIPE_ACCOUNT_STATUS_KEY,
  STRIPE_BALANCE_KEY,
  STRIPE_EXTERNAL_ACCOUNTS_KEY,
  STRIPE_EARNINGS_KEY,
  STRIPE_PAYOUTS_KEY,
} from './use-wallet-queries';

// Call hooks
export { useCall } from '../lib/providers/call-provider';

// Text Blast hooks
export {
  useTextBlasts,
  useRecipientCount,
  useSendTextBlast,
  TEXT_BLASTS_KEY,
  RECIPIENT_COUNT_KEY,
} from './use-text-blasts';
export {
  useCrossEventTextBlasts,
  useCrossEventRecipientCount,
  useSendCrossEventBlast,
  CROSS_EVENT_BLASTS_KEY,
  CROSS_EVENT_RECIPIENT_COUNT_KEY,
} from './use-cross-event-text-blasts';

// Venue Tables hooks
export {
  useVenueSections,
  useCreateSection,
  useUpdateSection,
  useDeleteSection,
  useCreateTable,
  useUpdateTable,
  useDeleteTable,
  useEventTables,
  VENUE_SECTIONS_KEY,
  EVENT_TABLES_KEY,
} from './use-venue-tables';

// Venue Menu hooks
export {
  useVenueMenu,
  useCreateMenuCategory,
  useUpdateMenuCategory,
  useDeleteMenuCategory,
  useCreateMenuItem,
  useUpdateMenuItem,
  useDeleteMenuItem,
  VENUE_MENU_KEY,
} from './use-venue-menu';

// Admin hooks
export {
  useAdminStats,
  useAdminActivity,
  useAdminUsers,
  useAdminEvents,
  useAdminPosts,
  useUpdateUserRole,
  useUpdateUserStatus,
  useUpdateUserVerified,
  useUpdateEventStatus,
  useAdminDeleteEvent,
  useAdminDeletePost,
  ADMIN_STATS_KEY,
  ADMIN_ACTIVITY_KEY,
  ADMIN_USERS_KEY,
  ADMIN_EVENTS_KEY,
  ADMIN_POSTS_KEY,
} from './use-admin';
