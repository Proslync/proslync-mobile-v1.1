// Feed API - Types and mappers for GetStream activities
import type { FeedItem, MediaOrientation } from '../types/feed.types';
import type { Event } from '../types/events.types';

/**
 * Attachment from GetStream activity
 * Matches ActivityResponse.attachments from @stream-io/feeds-react-sdk
 */
export interface ActivityAttachment {
  type: 'file' | 'image';
  asset_url?: string;  // For video/file attachments
  image_url?: string;  // For image attachments
  // Original dimensions provided by GetStream (for aspect ratio calculation)
  original_width?: number;
  original_height?: number;
  custom?: {
    thumb_url?: string;  // Thumbnail URL for videos
    duration?: string;   // Video duration (e.g., "7309.36ms")
  };
}

/**
 * User data from GetStream activity
 */
export interface ActivityUser {
  id: string;
  name?: string;
  image?: string;
  custom?: {
    firstName?: string;
    lastName?: string;
    verified?: boolean;
  };
}

/**
 * Custom fields for venue activities
 */
export interface VenueActivityCustomFields {
  venueId?: string | number;
  venueName?: string;
  venueLogo?: string;
  eventId?: number;
  userName?: string;
}

/**
 * Feed activity from GetStream
 * Aligned with ActivityResponse from @stream-io/feeds-react-sdk
 */
export interface FeedActivity {
  id: string;
  actor: string | {
    id: string;
    data?: {
      name?: string;
      avatar?: string;
    };
  };
  verb: string;
  object: string;
  time: string;
  foreign_id?: string;

  // Text content (web uses 'text', we support both)
  text?: string;
  description?: string;

  // Attachments array (matches web's ActivityResponse)
  attachments?: ActivityAttachment[];

  // User data (matches web's ActivityResponse)
  user?: ActivityUser;

  // Custom fields - may contain eventId, venueId, etc.
  custom?: VenueActivityCustomFields & Record<string, unknown>;

  // Direct fields for events (alternative format from backend)
  eventId?: number;
  venueId?: number;
  venueName?: string;
  mediaType?: 'video' | 'image';
  videoUrl?: string;
  imageUrl?: string;
  thumbnail?: string;
  isEvent?: boolean;
  isPaid?: boolean;
  isPrivate?: boolean;
  price?: number | null;
  ticketsAvailableNow?: boolean;
  ticketsAvailableFrom?: string | null;
  eventTitle?: string;
  eventDate?: string;

  // Reactions - support both formats
  reaction_counts?: Record<string, number>;
  reaction_groups?: Record<string, { count?: number }>;
  // own_reactions is an array of reaction objects the current user has made
  own_reactions?: Array<{ type: string; custom?: Record<string, unknown> }>;
  reaction_count?: number;
  comment_count?: number;
}

export interface FeedResponse {
  results: FeedActivity[];
  next?: string;
  duration?: string;
}

/**
 * Extract eventId from activity (check both custom.eventId and direct eventId)
 */
export function getEventIdFromActivity(activity: FeedActivity): number | undefined {
  const customEventId = activity.custom?.eventId;
  if (typeof customEventId === 'number') return customEventId;
  if (typeof customEventId === 'string') return parseInt(customEventId, 10) || undefined;
  return activity.eventId;
}

/**
 * Check if activity has media attachment (video or image) or is an event
 * Matches web's hasMediaAttachment function
 */
export function hasMediaAttachment(activity: FeedActivity): boolean {
  // Check for video or image attachments
  const hasAttachments = Boolean(
    activity.attachments?.some(
      (att) =>
        (att.type === 'file' && att.asset_url) ||
        (att.type === 'image' && att.image_url),
    ),
  );

  if (hasAttachments) return true;

  // Check for direct media fields
  if (activity.videoUrl || activity.imageUrl || activity.thumbnail) {
    return true;
  }

  // If no attachments, check if it's an event activity (can use event flyer)
  const hasEventId = Boolean(getEventIdFromActivity(activity));
  return hasEventId;
}

/**
 * Get reaction count - supports both reaction_counts and reaction_groups formats
 */
function getReactionCount(activity: FeedActivity, type: string): number {
  // Try reaction_groups first (web format)
  if (activity.reaction_groups?.[type]?.count !== undefined) {
    return activity.reaction_groups[type].count!;
  }
  // Fall back to reaction_counts (mobile format)
  if (activity.reaction_counts?.[type] !== undefined) {
    return activity.reaction_counts[type];
  }
  // Fall back to reaction_count for likes
  if (type === 'like' && activity.reaction_count !== undefined) {
    return activity.reaction_count;
  }
  return 0;
}

/**
 * Get comment count from activity
 */
function getCommentCount(activity: FeedActivity): number {
  if (activity.comment_count !== undefined) {
    return activity.comment_count;
  }
  return getReactionCount(activity, 'comment');
}

/**
 * Check if current user has liked the activity
 */
function hasUserLiked(activity: FeedActivity): boolean {
  if (!activity.own_reactions || !Array.isArray(activity.own_reactions)) {
    return false;
  }
  return activity.own_reactions.some((reaction) => reaction.type === 'like');
}

/**
 * Calculate aspect ratio and determine orientation from dimensions
 * Matches web frontend thresholds: horizontal > 1.1, vertical < 0.9, square 0.9-1.1
 */
function calculateMediaOrientation(
  width: number | undefined,
  height: number | undefined
): { aspectRatio?: number; mediaOrientation?: MediaOrientation; mediaWidth?: number; mediaHeight?: number } {
  if (!width || !height || height === 0) {
    return {};
  }

  const aspectRatio = width / height;
  let mediaOrientation: MediaOrientation;

  if (aspectRatio > 1.1) {
    mediaOrientation = 'horizontal';
  } else if (aspectRatio < 0.9) {
    mediaOrientation = 'vertical';
  } else {
    mediaOrientation = 'square';
  }

  return {
    aspectRatio,
    mediaOrientation,
    mediaWidth: width,
    mediaHeight: height,
  };
}

/**
 * Map GetStream activity to FeedItem format for UI
 *
 * Supports both:
 * 1. Activities with attachments (web pattern)
 * 2. Activities with direct media fields (current mobile pattern)
 * 3. Event activities using backend event flyer
 */
export function mapActivityToFeedItem(
  activity: FeedActivity,
  eventsMap?: Map<number, Event>
): FeedItem | null {
  // Check if activity has media
  if (!hasMediaAttachment(activity)) {
    return null;
  }

  const customFields = activity.custom as VenueActivityCustomFields | undefined;
  const isVenueActivity = Boolean(customFields?.venueId);
  const eventId = getEventIdFromActivity(activity);

  // Get event from backend if available
  const event = eventId && eventsMap ? eventsMap.get(eventId) : undefined;

  // If we have an eventId but no event data, skip this item
  if (eventId && !event) {
    console.log('[Feed] Skipping activity - event not found in backend:', eventId);
    return null;
  }

  // Extract actor data
  const actorData = typeof activity.actor === 'object'
    ? activity.actor.data
    : undefined;
  const actorId = typeof activity.actor === 'object'
    ? activity.actor.id
    : activity.actor;

  // Get user ID - prefer activity.user.id (clean numeric ID), fall back to parsing actor
  // The actor format in GetStream is often "user:123" but we need just "123" for comparison
  const getUserId = (): string => {
    // First check activity.user.id (cleanest source, matches frontend)
    if (activity.user?.id) {
      return activity.user.id;
    }
    // Parse from actorId - remove "user:" prefix if present
    if (actorId.startsWith('user:')) {
      return actorId.substring(5);
    }
    return actorId;
  };
  const userId = getUserId();

  // Get username - prioritize venue name for venue activities
  const username = isVenueActivity
    ? customFields?.venueName || `venue-${customFields?.venueId}` || 'venue'
    : customFields?.userName ||
      activity.user?.name ||
      (activity.user?.custom?.firstName && activity.user?.custom?.lastName
        ? `${activity.user.custom.firstName} ${activity.user.custom.lastName}`
        : actorData?.name) ||
      'user';

  // Get avatar URL
  const userAvatar = isVenueActivity
    ? customFields?.venueLogo || ''
    : activity.user?.image || actorData?.avatar || '';

  // Get verified status
  const verified = Boolean(
    activity.user?.custom?.verified ||
    (isVenueActivity && customFields?.venueName)
  );

  // Find video or image from attachments (web pattern)
  const videoAttachment = activity.attachments?.find(
    (att) => att.type === 'file' && att.asset_url,
  );
  const imageAttachment = activity.attachments?.find(
    (att) => att.type === 'image' && att.image_url,
  );

  // Determine media type and URLs
  let mediaType: 'video' | 'image';
  let videoUrl: string | undefined;
  let imageUrl: string | undefined;
  let thumbnail: string;
  let mediaWidth: number | undefined;
  let mediaHeight: number | undefined;

  if (videoAttachment?.asset_url) {
    // Video from attachments
    mediaType = 'video';
    videoUrl = videoAttachment.asset_url;
    thumbnail = videoAttachment.custom?.thumb_url || videoUrl;
    mediaWidth = videoAttachment.original_width;
    mediaHeight = videoAttachment.original_height;
  } else if (activity.videoUrl) {
    // Video from direct field
    mediaType = 'video';
    videoUrl = activity.videoUrl;
    thumbnail = activity.thumbnail || videoUrl;
  } else if (imageAttachment?.image_url) {
    // Image from attachments
    mediaType = 'image';
    imageUrl = imageAttachment.image_url;
    thumbnail = imageUrl;
    mediaWidth = imageAttachment.original_width;
    mediaHeight = imageAttachment.original_height;
  } else if (activity.imageUrl || activity.thumbnail) {
    // Image from direct field
    mediaType = 'image';
    imageUrl = activity.imageUrl || activity.thumbnail;
    thumbnail = activity.thumbnail || activity.imageUrl || '';
  } else if (eventId && event?.flyer?.url) {
    // Event activity - use backend flyer
    mediaType = 'image';
    imageUrl = event.flyer.url;
    thumbnail = imageUrl;
  } else if (eventId && event?.imageUrl) {
    // Event activity - use backend imageUrl
    mediaType = 'image';
    imageUrl = event.imageUrl;
    thumbnail = imageUrl;
  } else {
    // No valid media
    return null;
  }

  // Calculate aspect ratio and orientation from dimensions
  const mediaDimensions = calculateMediaOrientation(mediaWidth, mediaHeight);

  // Get reaction counts and like status from Stream
  const likes = getReactionCount(activity, 'like');
  const comments = getCommentCount(activity);
  const shares = getReactionCount(activity, 'share');
  const isLiked = hasUserLiked(activity);

  // Get description/text - prefer activity.text (from Stream), fall back to event description
  const description = activity.text || activity.description || '';

  // If this is an event activity, combine Stream media with backend event metadata
  if (event) {
    return {
      id: activity.id,
      // User info - prefer Stream data, fall back to event venue
      username: activity.user?.name || customFields?.venueName || event.venue?.name || username,
      userAvatar: activity.user?.image || customFields?.venueLogo || event.venue?.imageUrl || userAvatar,
      // Description - prefer Stream activity text, fall back to event description
      description: description || event.description || '',
      verified,
      // Reactions from Stream
      likes,
      comments,
      shares,
      isLiked,
      // Media from Stream attachments (already extracted above)
      mediaType,
      videoUrl,
      imageUrl,
      thumbnail,
      // Media dimensions and orientation from GetStream
      ...mediaDimensions,
      // Event metadata from backend
      isEvent: true,
      eventId: event.id,
      eventTitle: event.name,
      eventDate: event.startDate,
      price: undefined,
      isPaid: event.isPaid,
      ticketsAvailableNow: event.ticketsAvailableNow,
      ticketsAvailableFrom: event.ticketsAvailableFrom,
      isPrivate: !event.isPublic,
      venueId: event.venue?.id,
      venueName: event.venue?.name,
      userId,
      isVenueActivity: !!event.venue?.id,
      isUserRegistered: event.isUserRegistered,
    };
  }

  // Non-event activity (user post)
  return {
    id: activity.id,
    username,
    userAvatar,
    description,
    verified,
    likes,
    comments,
    shares,
    isLiked,
    mediaType,
    videoUrl,
    imageUrl,
    thumbnail,
    // Media dimensions and orientation from GetStream
    ...mediaDimensions,
    isEvent: false,
    eventId: undefined,
    eventTitle: undefined,
    eventDate: undefined,
    price: undefined,
    isPaid: false,
    ticketsAvailableNow: false,
    ticketsAvailableFrom: undefined,
    isPrivate: activity.isPrivate || false,
    venueId: activity.venueId,
    venueName: activity.venueName,
    userId,
    isVenueActivity,
    isUserRegistered: false,
  };
}
