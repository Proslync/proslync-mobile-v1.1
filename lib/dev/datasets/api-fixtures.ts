import * as mockRegistry from "../mock-registry";

/**
 * Demo fixtures for the in-app HTTP client. While the websocket gate is off
 * (`isDemoMode()` true), `lib/api/client.ts` returns these shape-matching
 * payloads for every endpoint instead of touching the network.
 *
 * Each family is registered separately so the Backend cockpit can list and
 * swap them piecemeal (e.g. inject a different MOCK_EVENTS variant without
 * touching the conversation thread fixtures).
 */

// ── Time helpers ─────────────────────────────────────────────────────────
const NOW = Date.now();
const ago = (mins: number): string => new Date(NOW - mins * 60_000).toISOString();
const day = (offset: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(22, 0, 0, 0);
  return d.toISOString();
};
const dayEnd = (offset: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(23, 59, 0, 0);
  return d.toISOString();
};

// ── Types ────────────────────────────────────────────────────────────────
// These mirror the shapes consumed by the api client's mock router. They are
// intentionally loose (`any` on nested optional bag fields) — the real
// client typings live in `lib/api/*` and this file only needs to satisfy the
// router's lookups.
export interface MockUser {
  id: number;
  userName: string;
  firstName: string;
  lastName: string;
  bio: string;
  avatar: { id: string; url: string } | null;
  isVerified: boolean;
  eventStats: { totalEvents: number; upcomingEvents: number; pastEvents: number };
  followStats: { followers: number; following: number };
}

export interface MockVenue {
  id: number;
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  imageUrl: string | null;
  phoneNumber: string | null;
  email: string | null;
  website: string | null;
  status: string;
  ownerId: number;
  feedBackground: string | null;
}

export interface MockEvent {
  id: number;
  name: string;
  description: string;
  location: string;
  venueId: number;
  venue: MockVenue;
  ownerId: number;
  status: string;
  startDate: string;
  endDate: string;
  maxCapacity: number;
  minimumAge: number;
  dressCode: string;
  eventType: string;
  imageUrl: string;
  isPublic: boolean;
  flyerId: string;
  flyer: { id: string; url: string; fileName: string };
  price: number;
  currency: string;
  isTicketed: boolean;
  attendeeCount: number;
}

export interface MockConversation {
  id: string;
  type: string;
  name: string | null;
  imageUrl: string | null;
  lastMessageAt: string;
  lastMessagePreview: string;
  unreadCount: number;
  isPinned: boolean;
  createdById: number;
  members: Array<{
    userId: number;
    userName: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | undefined;
    isVerified: boolean;
    joinedAt: string;
  }>;
  createdAt: string;
}

export interface MockMessage {
  id: number;
  conversationId: string;
  senderId: number;
  type: string;
  text: string;
  mediaUrl: string | null;
  mediaMetadata: any;
  systemMetadata?: { event: string };
  isDeleted: boolean;
  createdAt: string;
  sender: {
    id: number;
    userName: string;
    firstName: string;
    avatarUrl?: string;
  };
}

export interface MockFeedItem {
  id: string;
  username: string;
  userAvatar: string;
  description: string;
  verified: boolean;
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  mediaType: string;
  imageUrl: string;
  thumbnail: string;
  mediaWidth: number;
  mediaHeight: number;
  aspectRatio: number;
  mediaOrientation: string;
  isEvent: boolean;
  eventId: number;
  eventTitle: string;
  eventDate: string;
  price: number;
  isPaid: boolean;
  ticketsAvailableNow: boolean;
  isPrivate: boolean;
  venueId: number;
  venueName: string;
  userId: string;
  isVenueActivity: boolean;
  isUserRegistered: boolean;
}

export interface MockPost {
  id: string;
  authorId: number;
  author: { id: number; userName: string; firstName: string; avatarUrl: string };
  text: string;
  mediaUrls: string[];
  likes: number;
  comments: number;
  isLiked: boolean;
  createdAt: string;
}

export interface MockNotification {
  id: number;
  type: string;
  title: string;
  body: string | null;
  imageUrl: string | null;
  isRead: boolean;
  createdAt: string;
  data: Record<string, unknown>;
}

export interface MockTicket {
  id: string;
  eventId: number;
  event: MockEvent;
  status: string;
  qrCode: string;
  tier: string;
  price: number;
  currency: string;
  purchasedAt: string;
  usedAt: string | null;
}

export interface MockWallet {
  balance: number;
  currency: string;
  pendingBalance: number;
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    currency: string;
    description: string;
    createdAt: string;
    status: string;
  }>;
}

// ── Conversations ────────────────────────────────────────────────────────
export const MOCK_CONVERSATIONS: MockConversation[] = [
  {
    id: 'conv-1',
    type: 'direct',
    name: null,
    imageUrl: null,
    lastMessageAt: ago(3),
    lastMessagePreview: 'yeah see you there',
    unreadCount: 2,
    isPinned: true,
    createdById: 2,
    members: [
      { userId: 1, userName: 'arshia', firstName: 'Arshia', lastName: 'Rahnavard', avatarUrl: undefined, isVerified: true, joinedAt: ago(10000) },
      { userId: 2, userName: 'mayasf', firstName: 'Maya', lastName: 'Chen', avatarUrl: 'https://i.pravatar.cc/200?img=47', isVerified: false, joinedAt: ago(10000) },
    ],
    createdAt: ago(10000),
  },
  {
    id: 'conv-2',
    type: 'direct',
    name: null,
    imageUrl: null,
    lastMessageAt: ago(42),
    lastMessagePreview: 'bet. table for 4?',
    unreadCount: 0,
    isPinned: false,
    createdById: 3,
    members: [
      { userId: 1, userName: 'arshia', firstName: 'Arshia', lastName: 'Rahnavard', avatarUrl: undefined, isVerified: true, joinedAt: ago(9000) },
      { userId: 3, userName: 'dev', firstName: 'Devonte', lastName: 'King', avatarUrl: 'https://i.pravatar.cc/200?img=12', isVerified: false, joinedAt: ago(9000) },
    ],
    createdAt: ago(9000),
  },
  {
    id: 'conv-3',
    type: 'group',
    name: 'SF nightlife crew',
    imageUrl: null,
    lastMessageAt: ago(120),
    lastMessagePreview: 'who’s down for saturday',
    unreadCount: 0,
    isPinned: false,
    createdById: 4,
    members: [
      { userId: 1, userName: 'arshia', firstName: 'Arshia', lastName: 'Rahnavard', avatarUrl: undefined, isVerified: true, joinedAt: ago(20000) },
      { userId: 2, userName: 'mayasf', firstName: 'Maya', lastName: 'Chen', avatarUrl: 'https://i.pravatar.cc/200?img=47', isVerified: false, joinedAt: ago(20000) },
      { userId: 3, userName: 'dev', firstName: 'Devonte', lastName: 'King', avatarUrl: 'https://i.pravatar.cc/200?img=12', isVerified: false, joinedAt: ago(20000) },
      { userId: 4, userName: 'leyla', firstName: 'Leyla', lastName: 'Aras', avatarUrl: 'https://i.pravatar.cc/200?img=32', isVerified: false, joinedAt: ago(20000) },
    ],
    createdAt: ago(20000),
  },
  {
    id: 'conv-4',
    type: 'direct',
    name: null,
    imageUrl: null,
    lastMessageAt: ago(60 * 24),
    lastMessagePreview: 'ticket confirmed 🎫',
    unreadCount: 0,
    isPinned: false,
    createdById: 5,
    members: [
      { userId: 1, userName: 'arshia', firstName: 'Arshia', lastName: 'Rahnavard', avatarUrl: undefined, isVerified: true, joinedAt: ago(30000) },
      { userId: 5, userName: 'audio.sf', firstName: 'Audio', lastName: 'SF', avatarUrl: 'https://i.pravatar.cc/200?img=65', isVerified: true, joinedAt: ago(30000) },
    ],
    createdAt: ago(30000),
  },
];

export const MOCK_MESSAGES: Record<string, MockMessage[]> = {
  'conv-1': [
    { id: 101, conversationId: 'conv-1', senderId: 2, type: 'text', text: 'hey you going to audio tonight?', mediaUrl: null, mediaMetadata: null, isDeleted: false, createdAt: ago(40), sender: { id: 2, userName: 'mayasf', firstName: 'Maya', avatarUrl: 'https://i.pravatar.cc/200?img=47' } },
    { id: 102, conversationId: 'conv-1', senderId: 1, type: 'text', text: 'yeah just grabbing food first', mediaUrl: null, mediaMetadata: null, isDeleted: false, createdAt: ago(35), sender: { id: 1, userName: 'arshia', firstName: 'Arshia' } },
    { id: 103, conversationId: 'conv-1', senderId: 2, type: 'text', text: 'same, we’ll meet at the door around 11', mediaUrl: null, mediaMetadata: null, isDeleted: false, createdAt: ago(10), sender: { id: 2, userName: 'mayasf', firstName: 'Maya', avatarUrl: 'https://i.pravatar.cc/200?img=47' } },
    { id: 104, conversationId: 'conv-1', senderId: 2, type: 'text', text: 'yeah see you there', mediaUrl: null, mediaMetadata: null, isDeleted: false, createdAt: ago(3), sender: { id: 2, userName: 'mayasf', firstName: 'Maya', avatarUrl: 'https://i.pravatar.cc/200?img=47' } },
  ],
  'conv-2': [
    { id: 201, conversationId: 'conv-2', senderId: 3, type: 'text', text: 'yo table saturday?', mediaUrl: null, mediaMetadata: null, isDeleted: false, createdAt: ago(90), sender: { id: 3, userName: 'dev', firstName: 'Devonte', avatarUrl: 'https://i.pravatar.cc/200?img=12' } },
    { id: 202, conversationId: 'conv-2', senderId: 1, type: 'text', text: 'im down', mediaUrl: null, mediaMetadata: null, isDeleted: false, createdAt: ago(80), sender: { id: 1, userName: 'arshia', firstName: 'Arshia' } },
    { id: 203, conversationId: 'conv-2', senderId: 3, type: 'text', text: 'bet. table for 4?', mediaUrl: null, mediaMetadata: null, isDeleted: false, createdAt: ago(42), sender: { id: 3, userName: 'dev', firstName: 'Devonte', avatarUrl: 'https://i.pravatar.cc/200?img=12' } },
  ],
  'conv-3': [
    { id: 301, conversationId: 'conv-3', senderId: 4, type: 'text', text: 'who’s down for saturday', mediaUrl: null, mediaMetadata: null, isDeleted: false, createdAt: ago(130), sender: { id: 4, userName: 'leyla', firstName: 'Leyla', avatarUrl: 'https://i.pravatar.cc/200?img=32' } },
    { id: 302, conversationId: 'conv-3', senderId: 3, type: 'text', text: 'im in', mediaUrl: null, mediaMetadata: null, isDeleted: false, createdAt: ago(125), sender: { id: 3, userName: 'dev', firstName: 'Devonte', avatarUrl: 'https://i.pravatar.cc/200?img=12' } },
    { id: 303, conversationId: 'conv-3', senderId: 2, type: 'text', text: 'same', mediaUrl: null, mediaMetadata: null, isDeleted: false, createdAt: ago(120), sender: { id: 2, userName: 'mayasf', firstName: 'Maya', avatarUrl: 'https://i.pravatar.cc/200?img=47' } },
  ],
  'conv-4': [
    { id: 401, conversationId: 'conv-4', senderId: 5, type: 'system', text: 'Your ticket for Audio SF has been confirmed.', mediaUrl: null, mediaMetadata: null, systemMetadata: { event: 'ticket_confirmed' }, isDeleted: false, createdAt: ago(60 * 24), sender: { id: 5, userName: 'audio.sf', firstName: 'Audio', avatarUrl: 'https://i.pravatar.cc/200?img=65' } },
  ],
};

// ── Venues + flyers ──────────────────────────────────────────────────────
const FLYER_IMGS = [
  'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=1200&q=80',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&q=80',
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&q=80',
  'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200&q=80',
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=80',
  'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1200&q=80',
];

export const MOCK_VENUES: MockVenue[] = [
  { id: 101, name: 'Audio SF', description: 'Intimate underground club in SoMa', address: '316 11th St', city: 'San Francisco', state: 'CA', country: 'US', latitude: 37.7712, longitude: -122.4131, imageUrl: 'https://i.pravatar.cc/300?img=65', phoneNumber: '+14155550101', email: 'info@audio.sf', website: 'https://audiosf.com', status: 'active', ownerId: 5, feedBackground: null },
  { id: 102, name: 'The Great Northern', description: 'Electronic music institution', address: '119 Utah St', city: 'San Francisco', state: 'CA', country: 'US', latitude: 37.7690, longitude: -122.4060, imageUrl: null, phoneNumber: '+14155550102', email: null, website: null, status: 'active', ownerId: 5, feedBackground: null },
  { id: 103, name: 'Monarch', description: 'Two-floor dance spot off Mission', address: '101 6th St', city: 'San Francisco', state: 'CA', country: 'US', latitude: 37.7803, longitude: -122.4105, imageUrl: null, phoneNumber: null, email: null, website: null, status: 'active', ownerId: 5, feedBackground: null },
  { id: 104, name: 'August Hall', description: 'Grand historic venue downtown', address: '420 Mason St', city: 'San Francisco', state: 'CA', country: 'US', latitude: 37.7869, longitude: -122.4101, imageUrl: null, phoneNumber: null, email: null, website: null, status: 'active', ownerId: 5, feedBackground: null },
];

// ── Events ───────────────────────────────────────────────────────────────
export const MOCK_EVENTS: MockEvent[] = [
  { id: 1001, name: 'Saturday Night at Audio', description: 'Resident DJs + special guest', location: 'Audio SF', venueId: 101, venue: MOCK_VENUES[0]!, ownerId: 5, status: 'published', startDate: day(2), endDate: dayEnd(2), maxCapacity: 400, minimumAge: 21, dressCode: 'Smart', eventType: 'club', imageUrl: FLYER_IMGS[0]!, isPublic: true, flyerId: 'flyer-1', flyer: { id: 'flyer-1', url: FLYER_IMGS[0]!, fileName: 'flyer1.jpg' }, price: 25, currency: 'USD', isTicketed: true, attendeeCount: 128 },
  { id: 1002, name: 'Great Northern: Techno Night', description: 'All night underground', location: 'The Great Northern', venueId: 102, venue: MOCK_VENUES[1]!, ownerId: 5, status: 'published', startDate: day(5), endDate: dayEnd(5), maxCapacity: 800, minimumAge: 21, dressCode: 'Casual', eventType: 'club', imageUrl: FLYER_IMGS[1]!, isPublic: true, flyerId: 'flyer-2', flyer: { id: 'flyer-2', url: FLYER_IMGS[1]!, fileName: 'flyer2.jpg' }, price: 35, currency: 'USD', isTicketed: true, attendeeCount: 342 },
  { id: 1003, name: 'Monarch Afters', description: '2am till late', location: 'Monarch', venueId: 103, venue: MOCK_VENUES[2]!, ownerId: 5, status: 'published', startDate: day(7), endDate: dayEnd(7), maxCapacity: 300, minimumAge: 21, dressCode: 'Any', eventType: 'club', imageUrl: FLYER_IMGS[2]!, isPublic: true, flyerId: 'flyer-3', flyer: { id: 'flyer-3', url: FLYER_IMGS[2]!, fileName: 'flyer3.jpg' }, price: 20, currency: 'USD', isTicketed: true, attendeeCount: 56 },
  { id: 1004, name: 'August Hall: Rooftop Party', description: 'House + disco', location: 'August Hall', venueId: 104, venue: MOCK_VENUES[3]!, ownerId: 5, status: 'published', startDate: day(10), endDate: dayEnd(10), maxCapacity: 600, minimumAge: 21, dressCode: 'Smart casual', eventType: 'club', imageUrl: FLYER_IMGS[3]!, isPublic: true, flyerId: 'flyer-4', flyer: { id: 'flyer-4', url: FLYER_IMGS[3]!, fileName: 'flyer4.jpg' }, price: 30, currency: 'USD', isTicketed: true, attendeeCount: 210 },
  { id: 1005, name: 'Audio: Sunday Sessions', description: 'Daytime set in the courtyard', location: 'Audio SF', venueId: 101, venue: MOCK_VENUES[0]!, ownerId: 5, status: 'published', startDate: day(3), endDate: dayEnd(3), maxCapacity: 250, minimumAge: 21, dressCode: 'Any', eventType: 'day-party', imageUrl: FLYER_IMGS[4]!, isPublic: true, flyerId: 'flyer-5', flyer: { id: 'flyer-5', url: FLYER_IMGS[4]!, fileName: 'flyer5.jpg' }, price: 15, currency: 'USD', isTicketed: true, attendeeCount: 82 },
  { id: 1006, name: 'Great Northern: Bass Lab', description: 'Dubstep / DnB takeover', location: 'The Great Northern', venueId: 102, venue: MOCK_VENUES[1]!, ownerId: 5, status: 'published', startDate: day(14), endDate: dayEnd(14), maxCapacity: 800, minimumAge: 21, dressCode: 'Casual', eventType: 'club', imageUrl: FLYER_IMGS[5]!, isPublic: true, flyerId: 'flyer-6', flyer: { id: 'flyer-6', url: FLYER_IMGS[5]!, fileName: 'flyer6.jpg' }, price: 28, currency: 'USD', isTicketed: true, attendeeCount: 412 },
];

// ── Feed items ───────────────────────────────────────────────────────────
export const MOCK_FEED: MockFeedItem[] = MOCK_EVENTS.map((e, i) => ({
  id: `feed-${e.id}`,
  username: ['mayasf', 'dev', 'leyla', 'audio.sf', 'monarchsf', 'augusthall'][i % 6]!,
  userAvatar: `https://i.pravatar.cc/200?img=${20 + i}`,
  description: e.description,
  verified: i % 2 === 0,
  likes: 150 + i * 23,
  comments: 8 + i * 3,
  shares: 2 + i,
  isLiked: false,
  mediaType: 'image',
  imageUrl: e.imageUrl,
  thumbnail: e.imageUrl,
  mediaWidth: 1200,
  mediaHeight: 1500,
  aspectRatio: 0.8,
  mediaOrientation: 'vertical',
  isEvent: true,
  eventId: e.id,
  eventTitle: e.name,
  eventDate: e.startDate,
  price: e.price,
  isPaid: true,
  ticketsAvailableNow: true,
  isPrivate: false,
  venueId: e.venueId,
  venueName: e.venue.name,
  userId: '5',
  isVenueActivity: true,
  isUserRegistered: i === 0,
}));

// ── Notifications ────────────────────────────────────────────────────────
export const MOCK_NOTIFICATIONS: MockNotification[] = [
  { id: 1, type: 'event_reminder', title: 'Tip-off in 2 hours', body: 'Syracuse vs Duke · JMA Wireless Dome', imageUrl: null, isRead: false, createdAt: ago(30), data: { eventId: 1001 } },
  { id: 2, type: 'follow', title: 'Coach Glenn Farello started following you', body: null, imageUrl: 'https://i.pravatar.cc/200?img=15', isRead: false, createdAt: ago(120), data: { userId: 2 } },
  { id: 3, type: 'like', title: 'Coach Diggs liked your highlight reel', body: '19-pt debut vs Delaware State', imageUrl: 'https://i.pravatar.cc/200?img=33', isRead: false, createdAt: ago(60 * 3), data: { postId: 'post-1' } },
  { id: 4, type: 'mention', title: 'Marcus Reid tagged you in a clip', body: 'Pick-and-roll breakdown · vs UNC', imageUrl: 'https://i.pravatar.cc/200?img=12', isRead: true, createdAt: ago(60 * 24), data: { postId: 'post-2' } },
  { id: 5, type: 'payment', title: 'NIL deal payout · $4,200', body: 'Nike Hoops · campaign 03', imageUrl: null, isRead: true, createdAt: ago(60 * 36), data: {} },
  { id: 6, type: 'rsvp', title: '12 friends are going to your game', body: 'Saturday · Syracuse vs Miami', imageUrl: null, isRead: true, createdAt: ago(60 * 48), data: { eventId: 1003 } },
  { id: 7, type: 'team_invitation', title: 'Welcome to Proslync', body: 'Follow athletes and coaches to see games and stats', imageUrl: null, isRead: true, createdAt: ago(60 * 72), data: {} },
];

// ── Tickets ──────────────────────────────────────────────────────────────
export const MOCK_TICKETS: MockTicket[] = [
  { id: 'tkt-1', eventId: 1001, event: MOCK_EVENTS[0]!, status: 'valid', qrCode: 'STATUS-TKT-1001-ARSHIA-001', tier: 'General', price: 25, currency: 'USD', purchasedAt: ago(60 * 24), usedAt: null },
  { id: 'tkt-2', eventId: 1002, event: MOCK_EVENTS[1]!, status: 'valid', qrCode: 'STATUS-TKT-1002-ARSHIA-002', tier: 'VIP', price: 75, currency: 'USD', purchasedAt: ago(60 * 48), usedAt: null },
  { id: 'tkt-3', eventId: 1005, event: MOCK_EVENTS[4]!, status: 'valid', qrCode: 'STATUS-TKT-1005-ARSHIA-003', tier: 'General', price: 15, currency: 'USD', purchasedAt: ago(60 * 72), usedAt: null },
];

// ── Posts ────────────────────────────────────────────────────────────────
export const MOCK_POSTS: MockPost[] = MOCK_FEED.slice(0, 4).map((f, i) => ({
  id: `post-${i + 1}`,
  authorId: i + 2,
  author: { id: i + 2, userName: f.username, firstName: f.username, avatarUrl: f.userAvatar },
  text: f.description,
  mediaUrls: [f.imageUrl],
  likes: f.likes,
  comments: f.comments,
  isLiked: false,
  createdAt: ago(60 * (i + 2)),
}));

// ── Wallet ───────────────────────────────────────────────────────────────
export const MOCK_WALLET: MockWallet = {
  balance: 245.5,
  currency: 'USD',
  pendingBalance: 0,
  transactions: [
    { id: 'tx-1', type: 'purchase', amount: -25, currency: 'USD', description: 'Audio SF — Saturday Night', createdAt: ago(60 * 24), status: 'completed' },
    { id: 'tx-2', type: 'purchase', amount: -75, currency: 'USD', description: 'Great Northern — VIP', createdAt: ago(60 * 48), status: 'completed' },
    { id: 'tx-3', type: 'topup', amount: 200, currency: 'USD', description: 'Wallet top-up', createdAt: ago(60 * 72), status: 'completed' },
    { id: 'tx-4', type: 'purchase', amount: -15, currency: 'USD', description: 'Audio SF — Sunday Sessions', createdAt: ago(60 * 96), status: 'completed' },
  ],
};

// ── Followers / following ────────────────────────────────────────────────
export const MOCK_USERS: MockUser[] = [
  { id: 2, userName: 'mayasf', firstName: 'Maya', lastName: 'Chen', bio: 'dj + party promoter', avatar: { id: 'a2', url: 'https://i.pravatar.cc/200?img=47' }, isVerified: false, eventStats: { totalEvents: 12, upcomingEvents: 3, pastEvents: 9 }, followStats: { followers: 2300, following: 412 } },
  { id: 3, userName: 'dev', firstName: 'Devonte', lastName: 'King', bio: 'I run the city', avatar: { id: 'a3', url: 'https://i.pravatar.cc/200?img=12' }, isVerified: true, eventStats: { totalEvents: 40, upcomingEvents: 7, pastEvents: 33 }, followStats: { followers: 8200, following: 210 } },
  { id: 4, userName: 'leyla', firstName: 'Leyla', lastName: 'Aras', bio: 'photo + film', avatar: { id: 'a4', url: 'https://i.pravatar.cc/200?img=32' }, isVerified: false, eventStats: { totalEvents: 5, upcomingEvents: 1, pastEvents: 4 }, followStats: { followers: 890, following: 340 } },
  { id: 5, userName: 'audio.sf', firstName: 'Audio', lastName: 'SF', bio: 'Underground. SoMa.', avatar: { id: 'a5', url: 'https://i.pravatar.cc/200?img=65' }, isVerified: true, eventStats: { totalEvents: 120, upcomingEvents: 14, pastEvents: 106 }, followStats: { followers: 24000, following: 48 } },
];

// ── Registry registration ────────────────────────────────────────────────
mockRegistry.register({
  id: 'api-conversations',
  description: 'Direct + group conversations returned by GET /api/conversations',
  load: () => MOCK_CONVERSATIONS,
});
mockRegistry.register({
  id: 'api-messages-by-conversation',
  description: 'Per-conversation message lists keyed by conversation id',
  load: () => MOCK_MESSAGES,
});
mockRegistry.register({
  id: 'api-venues',
  description: 'SF venue directory used by venues + events endpoints',
  load: () => MOCK_VENUES,
});
mockRegistry.register({
  id: 'api-events',
  description: 'Event listings (clubs / day-parties) used by events + feed endpoints',
  load: () => MOCK_EVENTS,
});
mockRegistry.register({
  id: 'api-feed',
  description: 'Feed items derived from MOCK_EVENTS for /api/feed/*',
  load: () => MOCK_FEED,
});
mockRegistry.register({
  id: 'api-notifications',
  description: 'In-app notification stream for /api/notifications',
  load: () => MOCK_NOTIFICATIONS,
});
mockRegistry.register({
  id: 'api-tickets',
  description: 'Owned tickets for /api/tickets/my',
  load: () => MOCK_TICKETS,
});
mockRegistry.register({
  id: 'api-posts',
  description: 'Demo posts for /api/posts and feed-by-user lookups',
  load: () => MOCK_POSTS,
});
mockRegistry.register({
  id: 'api-wallet',
  description: 'Wallet balance + transaction stream for /api/wallet',
  load: () => MOCK_WALLET,
});
mockRegistry.register({
  id: 'api-users',
  description: 'User directory used by user / search / followers endpoints',
  load: () => MOCK_USERS,
});
