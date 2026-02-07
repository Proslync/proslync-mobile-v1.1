// Feed API - Types and mappers for GetStream activities
import type { FeedItem } from '../types/feed.types';
import type { Event } from '../types/events.types';

/**
 * Feed activity from GetStream
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
  // Custom fields - may contain eventId
  custom?: {
    eventId?: number;
    venueId?: number;
  };
  // Direct fields for events (alternative format)
  eventId?: number;
  venueId?: number;
  venueName?: string;
  mediaType?: 'video' | 'image';
  videoUrl?: string;
  imageUrl?: string;
  thumbnail?: string;
  description?: string;
  isEvent?: boolean;
  isPaid?: boolean;
  isPrivate?: boolean;
  price?: number | null;
  ticketsAvailableNow?: boolean;
  ticketsAvailableFrom?: string | null;
  eventTitle?: string;
  eventDate?: string;
  // Reactions
  reaction_counts?: Record<string, number>;
  own_reactions?: Record<string, any[]>;
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
  return activity.custom?.eventId || activity.eventId;
}

/**
 * Map GetStream activity to FeedItem format for UI
 *
 * IMPORTANT (ISSUE 2 FIX):
 * - Stream activities are treated as POINTERS only
 * - We ONLY use the backend event flyer as the image source
 * - Stream CDN images (attachments.image_url) are IGNORED
 * - If no event flyer exists, the item is dropped
 *
 * @param activity - The activity from GetStream (pointer to event)
 * @param eventsMap - Map of event data fetched from backend (keyed by event ID)
 */
export function mapActivityToFeedItem(
  activity: FeedActivity,
  eventsMap?: Map<number, Event>
): FeedItem | null {
  // Extract actor data
  const actorData = typeof activity.actor === 'object'
    ? activity.actor.data
    : undefined;
  const actorId = typeof activity.actor === 'object'
    ? activity.actor.id
    : activity.actor;

  // Get eventId from activity
  const eventId = getEventIdFromActivity(activity);

  // ISSUE 2 FIX: Get event from backend - this is our ONLY source of truth
  const event = eventId && eventsMap ? eventsMap.get(eventId) : undefined;

  // If we have an eventId but no event data, skip this item
  // (event may have been deleted or we failed to fetch it)
  if (eventId && !event) {
    console.log('[Feed] Skipping activity - event not found in backend:', eventId);
    return null;
  }

  // Get event flyer from backend, fallback to imageUrl or placeholder
  const flyerUrl = event?.flyer?.url || event?.imageUrl || 'https://picsum.photos/seed/event-' + eventId + '/400/600';

  // If no event, check if this is a user post with media
  if (!event) {
    // Check if activity has its own media (user post)
    const postImageUrl = activity.imageUrl || activity.thumbnail;
    const postVideoUrl = activity.videoUrl;

    if (!postImageUrl && !postVideoUrl) {
      console.log('[Feed] Skipping non-event activity without media:', activity.id);
      return null;
    }

    // This is a user post with media - show it in the feed
    console.log('[Feed] Showing user post:', activity.id);

    return {
      id: activity.id,
      username: actorData?.name || 'user',
      userAvatar: actorData?.avatar || 'https://picsum.photos/200',
      description: activity.description || '',
      likes: activity.reaction_counts?.like || 0,
      comments: activity.reaction_counts?.comment || 0,
      shares: 0,
      mediaType: activity.mediaType || (postVideoUrl ? 'video' : 'image'),
      videoUrl: postVideoUrl,
      imageUrl: postImageUrl,
      thumbnail: activity.thumbnail || postImageUrl || 'https://picsum.photos/400/600',
      isEvent: false,
      eventId: undefined,
      eventTitle: undefined,
      eventDate: undefined,
      price: undefined,
      isPaid: false,
      ticketsAvailableNow: false,
      ticketsAvailableFrom: undefined,
      isPrivate: false,
      venueId: activity.venueId,
      venueName: activity.venueName,
      userId: actorId,
      isVenueActivity: false,
      isUserRegistered: false,
    };
  }

  // Log the flyer URL being used
  console.log('[Feed] Using backend flyer for event', eventId, ':', flyerUrl);

  // Build feed item from BACKEND event data (not Stream data)
  return {
    id: activity.id,
    // User info from activity actor
    username: actorData?.name || event.venue?.name || 'user',
    userAvatar: actorData?.avatar || event.venue?.imageUrl || 'https://picsum.photos/200',
    // Description from event
    description: event.description || '',
    // Reactions from Stream (this is fine to use)
    likes: activity.reaction_counts?.like || 0,
    comments: activity.reaction_counts?.comment || 0,
    shares: 0,
    // Media from backend event flyer or placeholder
    mediaType: 'image' as const,
    videoUrl: undefined,
    imageUrl: flyerUrl,
    thumbnail: flyerUrl,
    // Event data from BACKEND
    isEvent: true,
    eventId: event.id,
    eventTitle: event.name,
    eventDate: event.startDate,
    price: undefined, // Event type doesn't have price field
    isPaid: event.isPaid,
    ticketsAvailableNow: event.ticketsAvailableNow,
    ticketsAvailableFrom: event.ticketsAvailableFrom,
    isPrivate: !event.isPublic,
    venueId: event.venue?.id,
    venueName: event.venue?.name,
    userId: actorId,
    isVenueActivity: !!event.venue?.id,
    isUserRegistered: event.isUserRegistered,
  };
}
