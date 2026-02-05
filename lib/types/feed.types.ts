export interface FeedItem {
  id: string;
  username: string;
  userAvatar: string;
  description: string;
  likes: number;
  comments: number;
  shares: number;
  mediaType: 'video' | 'image';
  videoUrl?: string;
  imageUrl?: string;
  thumbnail: string;
  isEvent: boolean;
  eventId?: number;
  eventTitle?: string;
  eventDate?: string;
  price?: number | null;
  isPaid?: boolean;
  ticketsAvailableNow?: boolean;
  ticketsAvailableFrom?: string | null;
  isPrivate?: boolean;
  venueId?: number;
  venueName?: string;
  userId?: string;
  isVenueActivity?: boolean;
  isUserRegistered?: boolean;
}

export type FeedTab = 'foryou' | 'following';
