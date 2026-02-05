export type MediaOrientation = 'horizontal' | 'vertical' | 'square';

export interface FeedItem {
  id: string;
  username: string;
  userAvatar: string;
  description: string;
  verified?: boolean;
  likes: number;
  comments: number;
  shares: number;
  isLiked?: boolean;  // Whether current user has liked this item (from own_reactions)
  mediaType: 'video' | 'image';
  videoUrl?: string;
  imageUrl?: string;
  thumbnail: string;
  // Media dimensions from GetStream attachments
  mediaWidth?: number;
  mediaHeight?: number;
  aspectRatio?: number;  // width / height (e.g., 0.8 for portrait, 1.78 for landscape)
  mediaOrientation?: MediaOrientation;  // 'horizontal' | 'vertical' | 'square'
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
