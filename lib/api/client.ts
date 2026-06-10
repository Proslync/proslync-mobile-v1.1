// ── MOCK MODE ──────────────────────────────────────────────
// Backend was disconnected. This module now returns static
// shape-matching mock responses so the UI runs without crashes.
// Nothing here touches the network.

import { ApiClientError } from './errors';
import { config } from '../config';

async function httpRequest<T>(
  method: string,
  endpoint: string,
  body: unknown,
  tokenProvider: () => Promise<string | null>,
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${config.api.baseUrl}${endpoint}`;
  const headers: Record<string, string> = { Accept: 'application/json' };
  const token = await tokenProvider();
  if (token && !token.startsWith('mock-')) headers.Authorization = `Bearer ${token}`;
  let payload: BodyInit | undefined;
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.api.timeout);
  try {
    const res = await fetch(url, { method, headers, body: payload, signal: controller.signal });
    if (!res.ok) {
      throw new ApiClientError(`HTTP ${res.status} ${res.statusText} for ${method} ${endpoint}`, res.status);
    }
    const text = await res.text();
    if (!text) return undefined as T;
    try {
      return JSON.parse(text) as T;
    } catch {
      return text as unknown as T;
    }
  } finally {
    clearTimeout(timeoutId);
  }
}

// ── Mock data ────────────────────────────────────────────
const NOW = Date.now();
const ago = (mins: number) => new Date(NOW - mins * 60_000).toISOString();

const MOCK_CONVERSATIONS = [
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
    lastMessagePreview: 'ticket confirmed 🎟️',
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

const MOCK_MESSAGES: Record<string, any[]> = {
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

// ── Venues ───────────────────────────────────────────────
const FLYER_IMGS = [
  'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=1200&q=80',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&q=80',
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&q=80',
  'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200&q=80',
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=80',
  'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1200&q=80',
];

const MOCK_VENUES = [
  { id: 101, name: 'Audio SF', description: 'Intimate underground club in SoMa', address: '316 11th St', city: 'San Francisco', state: 'CA', country: 'US', latitude: 37.7712, longitude: -122.4131, imageUrl: 'https://i.pravatar.cc/300?img=65', phoneNumber: '+14155550101', email: 'info@audio.sf', website: 'https://audiosf.com', status: 'active', ownerId: 5, feedBackground: null },
  { id: 102, name: 'The Great Northern', description: 'Electronic music institution', address: '119 Utah St', city: 'San Francisco', state: 'CA', country: 'US', latitude: 37.7690, longitude: -122.4060, imageUrl: null, phoneNumber: '+14155550102', email: null, website: null, status: 'active', ownerId: 5, feedBackground: null },
  { id: 103, name: 'Monarch', description: 'Two-floor dance spot off Mission', address: '101 6th St', city: 'San Francisco', state: 'CA', country: 'US', latitude: 37.7803, longitude: -122.4105, imageUrl: null, phoneNumber: null, email: null, website: null, status: 'active', ownerId: 5, feedBackground: null },
  { id: 104, name: 'August Hall', description: 'Grand historic venue downtown', address: '420 Mason St', city: 'San Francisco', state: 'CA', country: 'US', latitude: 37.7869, longitude: -122.4101, imageUrl: null, phoneNumber: null, email: null, website: null, status: 'active', ownerId: 5, feedBackground: null },
];

// ── Events ───────────────────────────────────────────────
const day = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(22, 0, 0, 0);
  return d.toISOString();
};
const dayEnd = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(23, 59, 0, 0);
  return d.toISOString();
};

const MOCK_EVENTS = [
  { id: 1001, name: 'Saturday Night at Audio', description: 'Resident DJs + special guest', location: 'Audio SF', venueId: 101, venue: MOCK_VENUES[0], ownerId: 5, status: 'published', startDate: day(2), endDate: dayEnd(2), maxCapacity: 400, minimumAge: 21, dressCode: 'Smart', eventType: 'club', imageUrl: FLYER_IMGS[0], isPublic: true, flyerId: 'flyer-1', flyer: { id: 'flyer-1', url: FLYER_IMGS[0], fileName: 'flyer1.jpg' }, price: 25, currency: 'USD', isTicketed: true, attendeeCount: 128 },
  { id: 1002, name: 'Great Northern: Techno Night', description: 'All night underground', location: 'The Great Northern', venueId: 102, venue: MOCK_VENUES[1], ownerId: 5, status: 'published', startDate: day(5), endDate: dayEnd(5), maxCapacity: 800, minimumAge: 21, dressCode: 'Casual', eventType: 'club', imageUrl: FLYER_IMGS[1], isPublic: true, flyerId: 'flyer-2', flyer: { id: 'flyer-2', url: FLYER_IMGS[1], fileName: 'flyer2.jpg' }, price: 35, currency: 'USD', isTicketed: true, attendeeCount: 342 },
  { id: 1003, name: 'Monarch Afters', description: '2am till late', location: 'Monarch', venueId: 103, venue: MOCK_VENUES[2], ownerId: 5, status: 'published', startDate: day(7), endDate: dayEnd(7), maxCapacity: 300, minimumAge: 21, dressCode: 'Any', eventType: 'club', imageUrl: FLYER_IMGS[2], isPublic: true, flyerId: 'flyer-3', flyer: { id: 'flyer-3', url: FLYER_IMGS[2], fileName: 'flyer3.jpg' }, price: 20, currency: 'USD', isTicketed: true, attendeeCount: 56 },
  { id: 1004, name: 'August Hall: Rooftop Party', description: 'House + disco', location: 'August Hall', venueId: 104, venue: MOCK_VENUES[3], ownerId: 5, status: 'published', startDate: day(10), endDate: dayEnd(10), maxCapacity: 600, minimumAge: 21, dressCode: 'Smart casual', eventType: 'club', imageUrl: FLYER_IMGS[3], isPublic: true, flyerId: 'flyer-4', flyer: { id: 'flyer-4', url: FLYER_IMGS[3], fileName: 'flyer4.jpg' }, price: 30, currency: 'USD', isTicketed: true, attendeeCount: 210 },
  { id: 1005, name: 'Audio: Sunday Sessions', description: 'Daytime set in the courtyard', location: 'Audio SF', venueId: 101, venue: MOCK_VENUES[0], ownerId: 5, status: 'published', startDate: day(3), endDate: dayEnd(3), maxCapacity: 250, minimumAge: 21, dressCode: 'Any', eventType: 'day-party', imageUrl: FLYER_IMGS[4], isPublic: true, flyerId: 'flyer-5', flyer: { id: 'flyer-5', url: FLYER_IMGS[4], fileName: 'flyer5.jpg' }, price: 15, currency: 'USD', isTicketed: true, attendeeCount: 82 },
  { id: 1006, name: 'Great Northern: Bass Lab', description: 'Dubstep / DnB takeover', location: 'The Great Northern', venueId: 102, venue: MOCK_VENUES[1], ownerId: 5, status: 'published', startDate: day(14), endDate: dayEnd(14), maxCapacity: 800, minimumAge: 21, dressCode: 'Casual', eventType: 'club', imageUrl: FLYER_IMGS[5], isPublic: true, flyerId: 'flyer-6', flyer: { id: 'flyer-6', url: FLYER_IMGS[5], fileName: 'flyer6.jpg' }, price: 28, currency: 'USD', isTicketed: true, attendeeCount: 412 },
];

// ── Feed items ───────────────────────────────────────────
const MOCK_FEED = MOCK_EVENTS.map((e, i) => ({
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

// ── Notifications ────────────────────────────────────────
const MOCK_NOTIFICATIONS = [
  { id: 1, type: 'event_reminder', title: 'Tip-off in 2 hours', body: 'Syracuse vs Duke · JMA Wireless Dome', imageUrl: null, isRead: false, createdAt: ago(30), data: { eventId: 1001 } },
  { id: 2, type: 'follow', title: 'Coach Glenn Farello started following you', body: null, imageUrl: 'https://i.pravatar.cc/200?img=15', isRead: false, createdAt: ago(120), data: { userId: 2 } },
  { id: 3, type: 'like', title: 'Coach Diggs liked your highlight reel', body: '19-pt debut vs Delaware State', imageUrl: 'https://i.pravatar.cc/200?img=33', isRead: false, createdAt: ago(60 * 3), data: { postId: 'post-1' } },
  { id: 4, type: 'mention', title: 'Marcus Reid tagged you in a clip', body: 'Pick-and-roll breakdown · vs UNC', imageUrl: 'https://i.pravatar.cc/200?img=12', isRead: true, createdAt: ago(60 * 24), data: { postId: 'post-2' } },
  { id: 5, type: 'payment', title: 'NIL deal payout · $4,200', body: 'Nike Hoops · campaign 03', imageUrl: null, isRead: true, createdAt: ago(60 * 36), data: {} },
  { id: 6, type: 'rsvp', title: '12 friends are going to your game', body: 'Saturday · Syracuse vs Miami', imageUrl: null, isRead: true, createdAt: ago(60 * 48), data: { eventId: 1003 } },
  { id: 7, type: 'team_invitation', title: 'Welcome to Proslync', body: 'Follow athletes and coaches to see games and stats', imageUrl: null, isRead: true, createdAt: ago(60 * 72), data: {} },
];

// ── Tickets ──────────────────────────────────────────────
const MOCK_TICKETS = [
  { id: 'tkt-1', eventId: 1001, event: MOCK_EVENTS[0], status: 'valid', qrCode: 'STATUS-TKT-1001-ARSHIA-001', tier: 'General', price: 25, currency: 'USD', purchasedAt: ago(60 * 24), usedAt: null },
  { id: 'tkt-2', eventId: 1002, event: MOCK_EVENTS[1], status: 'valid', qrCode: 'STATUS-TKT-1002-ARSHIA-002', tier: 'VIP', price: 75, currency: 'USD', purchasedAt: ago(60 * 48), usedAt: null },
  { id: 'tkt-3', eventId: 1005, event: MOCK_EVENTS[4], status: 'valid', qrCode: 'STATUS-TKT-1005-ARSHIA-003', tier: 'General', price: 15, currency: 'USD', purchasedAt: ago(60 * 72), usedAt: null },
];

// ── Posts ────────────────────────────────────────────────
const MOCK_POSTS = MOCK_FEED.slice(0, 4).map((f, i) => ({
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

// ── Wallet ───────────────────────────────────────────────
const MOCK_WALLET = {
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

// ── Followers / following ────────────────────────────────
const MOCK_USERS = [
  { id: 2, userName: 'mayasf', firstName: 'Maya', lastName: 'Chen', bio: 'dj + party promoter', avatar: { id: 'a2', url: 'https://i.pravatar.cc/200?img=47' }, isVerified: false, eventStats: { totalEvents: 12, upcomingEvents: 3, pastEvents: 9 }, followStats: { followers: 2300, following: 412 } },
  { id: 3, userName: 'dev', firstName: 'Devonte', lastName: 'King', bio: 'I run the city', avatar: { id: 'a3', url: 'https://i.pravatar.cc/200?img=12' }, isVerified: true, eventStats: { totalEvents: 40, upcomingEvents: 7, pastEvents: 33 }, followStats: { followers: 8200, following: 210 } },
  { id: 4, userName: 'leyla', firstName: 'Leyla', lastName: 'Aras', bio: 'photo + film', avatar: { id: 'a4', url: 'https://i.pravatar.cc/200?img=32' }, isVerified: false, eventStats: { totalEvents: 5, upcomingEvents: 1, pastEvents: 4 }, followStats: { followers: 890, following: 340 } },
  { id: 5, userName: 'audio.sf', firstName: 'Audio', lastName: 'SF', bio: 'Underground. SoMa.', avatar: { id: 'a5', url: 'https://i.pravatar.cc/200?img=65' }, isVerified: true, eventStats: { totalEvents: 120, upcomingEvents: 14, pastEvents: 106 }, followStats: { followers: 24000, following: 48 } },
];

interface RequestConfig {
  headers?: Record<string, string>;
  timeout?: number;
  skipAuth?: boolean;
  params?: Record<string, string | number | boolean | undefined | null>;
}

function mockResponse(method: string, endpoint: string): any {
  const path = endpoint.split('?')[0] ?? endpoint;

  // Auth endpoints — return a mock logged-in user so the app
  // never bounces to /signin during demo mode.
  if (path.includes('/auth/me') || path.includes('/users/me')) {
    return {
      id: 1,
      phoneNumber: '+15555550100',
      userName: 'arshia',
      firstName: 'Arshia',
      lastName: 'Rahnavard',
      email: 'arshia@status.inc',
      bio: 'Demo account',
      role: 'user',
      status: 'active',
      isProfileComplete: true,
      isVerified: true,
      isAppleMessagesLinked: true,
      avatar: null,
      eventStats: { totalEvents: 0, pastEvents: 0, upcomingEvents: 0 },
      organizations: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  if (path.includes('/auth/refresh')) {
    return { accessToken: 'mock-access-token', refreshToken: 'mock-refresh-token' };
  }

  if (path.includes('/auth/request-otp')) {
    return { message: 'OTP sent (mock)' };
  }

  if (path.includes('/auth/verify-otp')) {
    return {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      user: {
        id: 1,
        phoneNumber: '+15555550100',
        role: 'user',
        status: 'active',
        isProfileComplete: true,
        isAppleMessagesLinked: true,
      },
    };
  }

  if (path.includes('/auth/logout')) {
    return { message: 'Logged out (mock)' };
  }

  // ── Mock conversations + messages ────────────────────────
  if (path === '/api/conversations' || path.endsWith('/conversations')) {
    return { conversations: MOCK_CONVERSATIONS };
  }
  const convMsgsMatch = path.match(/\/api\/conversations\/([^/]+)\/messages/);
  if (convMsgsMatch) {
    const convId = convMsgsMatch[1]!;
    return {
      messages: MOCK_MESSAGES[convId] ?? [],
      nextCursor: null,
      hasMore: false,
    };
  }
  const convDetailMatch = path.match(/\/api\/conversations\/([^/]+)$/);
  if (convDetailMatch) {
    const convId = convDetailMatch[1]!;
    return MOCK_CONVERSATIONS.find((c) => c.id === convId) ?? MOCK_CONVERSATIONS[0];
  }

  // ── Events ───────────────────────────────────────────────
  if (path === '/api/events' || path.startsWith('/api/events?')) {
    return { events: MOCK_EVENTS, data: MOCK_EVENTS, items: MOCK_EVENTS, results: MOCK_EVENTS, total: MOCK_EVENTS.length, hasMore: false, nextCursor: null };
  }
  const eventDetailMatch = path.match(/^\/api\/events\/(\d+)$/);
  if (eventDetailMatch) {
    const eid = Number(eventDetailMatch[1]);
    return MOCK_EVENTS.find((e) => e.id === eid) ?? MOCK_EVENTS[0];
  }
  if (path.match(/^\/api\/events\/\d+\/tickets\/info/)) {
    return { tiers: [{ id: 'tier-1', name: 'General', price: 25, currency: 'USD', available: 120, capacity: 200 }, { id: 'tier-2', name: 'VIP', price: 75, currency: 'USD', available: 20, capacity: 40 }], fees: { service: 3, total: 28 } };
  }
  if (path.match(/^\/api\/events\/\d+\/attendees/)) {
    return { attendees: MOCK_USERS.slice(0, 3), total: 3, hasMore: false };
  }

  // ── Feed ─────────────────────────────────────────────────
  if (path.startsWith('/api/feed/foryou') || path.startsWith('/api/feed/following')) {
    return { items: MOCK_FEED, data: MOCK_FEED, results: MOCK_FEED, hasMore: false, nextCursor: null };
  }
  if (path.match(/^\/api\/feed\/users\/\d+\/posts/)) {
    return { posts: MOCK_POSTS, items: MOCK_POSTS, data: MOCK_POSTS, hasMore: false };
  }

  // ── Posts ────────────────────────────────────────────────
  if (path === '/api/posts') {
    return { posts: MOCK_POSTS, items: MOCK_POSTS, data: MOCK_POSTS, hasMore: false };
  }
  const postDetailMatch = path.match(/^\/api\/posts\/([^/]+)$/);
  if (postDetailMatch) {
    return MOCK_POSTS.find((p) => p.id === postDetailMatch[1]) ?? MOCK_POSTS[0];
  }

  // ── Venues ───────────────────────────────────────────────
  if (path === '/api/venues/my') {
    // venuesApi.getMyVenues returns Venue[] directly — not wrapped.
    return MOCK_VENUES;
  }
  if (path === '/api/venues') {
    return { venues: MOCK_VENUES, items: MOCK_VENUES, data: MOCK_VENUES, total: MOCK_VENUES.length, hasMore: false };
  }
  const venueDetailMatch = path.match(/^\/api\/venues\/(\d+)$/);
  if (venueDetailMatch) {
    const vid = Number(venueDetailMatch[1]);
    return MOCK_VENUES.find((v) => v.id === vid) ?? MOCK_VENUES[0];
  }

  // ── Notifications ────────────────────────────────────────
  if (path === '/api/notifications') {
    return { notifications: MOCK_NOTIFICATIONS, items: MOCK_NOTIFICATIONS, data: MOCK_NOTIFICATIONS, hasMore: false };
  }
  if (path === '/api/notifications/unread-count') {
    return { count: MOCK_NOTIFICATIONS.filter((n) => !n.isRead).length };
  }

  // ── Tickets ──────────────────────────────────────────────
  if (path.startsWith('/api/tickets/my') || path === '/api/tickets') {
    return { tickets: MOCK_TICKETS, items: MOCK_TICKETS, data: MOCK_TICKETS, hasMore: false, total: MOCK_TICKETS.length };
  }

  // ── Wallet ───────────────────────────────────────────────
  if (path === '/api/wallet/me') {
    return {
      data: {
        id: 'wallet-1',
        holderType: 'athlete',
        holderId: '1',
        userId: 1,
        currency: 'USD',
        balanceCents: 24550,
        pendingCents: 0,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
  }
  if (path.match(/^\/api\/wallet\/[^/]+\/transactions/)) {
    return { data: [], nextCursor: null, hasMore: false };
  }
  if (path.startsWith('/api/wallet')) {
    return MOCK_WALLET;
  }
  if (path.startsWith('/api/stripe-connect/payouts/balance')) {
    return { available: 245.5, pending: 0, currency: 'USD' };
  }

  // ── Users / follows ──────────────────────────────────────
  const userDetailMatch = path.match(/^\/api\/users\/(\d+)$/);
  if (userDetailMatch) {
    const uid = Number(userDetailMatch[1]);
    return MOCK_USERS.find((u) => u.id === uid) ?? MOCK_USERS[0];
  }
  if (path.match(/^\/api\/users\/\d+\/followers/)) {
    const userFollowers = MOCK_USERS.slice(0, 3).map((u) => ({ id: u.id, userName: u.userName, firstName: u.firstName, lastName: u.lastName, avatarUrl: u.avatar?.url ?? '' }));
    return { userFollowers, totalFollowers: userFollowers.length, hasMore: false };
  }
  if (path.match(/^\/api\/users\/\d+\/following/)) {
    const followingUsers = MOCK_USERS.slice(0, 2).map((u) => ({ id: u.id, userName: u.userName, firstName: u.firstName, lastName: u.lastName, avatarUrl: u.avatar?.url ?? '' }));
    const followingVenues = MOCK_VENUES.slice(0, 2).map((v) => ({ id: v.id, name: v.name, logoUrl: v.imageUrl ?? '' }));
    return { followingUsers, followingVenues, totalFollowing: followingUsers.length + followingVenues.length, hasMore: false };
  }
  if (path.match(/^\/api\/users\/\d+\/follow-status/)) {
    return { isFollowing: false, isFollower: false, isMutual: false };
  }

  // ── Search ───────────────────────────────────────────────
  if (path === '/api/search/suggestions') {
    const asSuggestion = (u: any, type: 'recent' | 'frequent' | 'mutual') => ({
      type,
      id: u.id,
      userName: u.userName,
      firstName: u.firstName,
      lastName: u.lastName,
      displayName: `${u.firstName} ${u.lastName}`.trim(),
      displayImage: u.avatar?.url ?? null,
      avatar: u.avatar ?? null,
      isVerified: u.isVerified ?? false,
      mutualCount: 2,
    });
    return {
      recentSearches: MOCK_USERS.slice(0, 2).map((u) => asSuggestion(u, 'recent')),
      frequentFriends: MOCK_USERS.map((u) => asSuggestion(u, 'frequent')),
      mutualFollowSuggestions: MOCK_USERS.slice(1, 3).map((u) => asSuggestion(u, 'mutual')),
    };
  }
  if (path.startsWith('/api/search')) {
    return { users: MOCK_USERS, venues: MOCK_VENUES, events: MOCK_EVENTS, items: [], hasMore: false };
  }

  // ── Organizations / channels (raw-array endpoints) ───────
  if (path === '/api/organizations/my' || path === '/api/channels/my') {
    return [];
  }
  if (path === '/api/organizations' || path === '/api/channels') {
    return { organizations: [], channels: [], items: [], data: [], hasMore: false };
  }

  // Mutations (POST/PUT/PATCH/DELETE) — return a generic success envelope.
  if (method !== 'GET') {
    return { success: true, message: 'ok (mock)', id: 'mock', data: [] };
  }

  // Universal "list-ish" mock: an array (so `for…of`, `.map`, `.length` work)
  // wrapped in a Proxy so ANY unknown property access returns a safe empty
  // value (array/0/false) — consumers in the codebase read many different
  // wrapper shapes like `.data`, `.items`, `.followingUsers`, `.hasMore`,
  // `.totalFollowing`, etc. The Proxy absorbs all of them.
  const base: any[] & Record<string, any> = [] as any;
  base.hasMore = false;
  base.nextCursor = null;
  base.success = true;
  return new Proxy(base, {
    get(target, prop, receiver) {
      if (prop in target) return Reflect.get(target, prop, receiver);
      if (typeof prop !== 'string') return Reflect.get(target, prop, receiver);
      // Numeric/count-like property names → 0
      if (
        prop === 'total' ||
        prop === 'totalCount' ||
        prop === 'count' ||
        prop === 'page' ||
        prop === 'pageSize' ||
        prop.startsWith('total') ||
        prop.endsWith('Count')
      ) {
        return 0;
      }
      // Any other unknown read → empty array (safe for `.map`, `for…of`, `.length`)
      return [];
    },
  });
}

class ApiClient {
  baseUrl = '';
  timeout = 10000;
  private onAuthErrorCallback: (() => void) | null = null;
  private tokenCache: string | null = 'mock-access-token';
  private refreshCache: string | null = 'mock-refresh-token';

  setOnAuthError(callback: () => void): void {
    this.onAuthErrorCallback = callback;
  }

  clearOnAuthError(): void {
    this.onAuthErrorCallback = null;
  }

  async getAccessToken(): Promise<string | null> {
    return this.tokenCache;
  }
  async setAccessToken(token: string | undefined): Promise<void> {
    this.tokenCache = token ?? 'mock-access-token';
  }
  async clearAccessToken(): Promise<void> {
    this.tokenCache = null;
  }
  async getRefreshToken(): Promise<string | null> {
    return this.refreshCache;
  }
  async setRefreshToken(token: string | undefined): Promise<void> {
    this.refreshCache = token ?? 'mock-refresh-token';
  }
  async clearRefreshToken(): Promise<void> {
    this.refreshCache = null;
  }

  private async request<T>(method: string, endpoint: string, body?: unknown): Promise<T> {
    if (config.api.mode === 'mock' || !config.api.networkEnabled) {
      return mockResponse(method, endpoint) as T;
    }
    try {
      return await httpRequest<T>(method, endpoint, body, () => this.getAccessToken());
    } catch (err) {
      if (config.api.fallbackToMock) {
        return mockResponse(method, endpoint) as T;
      }
      throw err;
    }
  }
  async get<T>(endpoint: string, _config?: RequestConfig): Promise<T> {
    return this.request<T>('GET', endpoint);
  }
  async post<T>(endpoint: string, body?: unknown, _config?: RequestConfig): Promise<T> {
    return this.request<T>('POST', endpoint, body);
  }
  async put<T>(endpoint: string, body?: unknown, _config?: RequestConfig): Promise<T> {
    return this.request<T>('PUT', endpoint, body);
  }
  async patch<T>(endpoint: string, body?: unknown, _config?: RequestConfig): Promise<T> {
    return this.request<T>('PATCH', endpoint, body);
  }
  async delete<T>(endpoint: string, _config?: RequestConfig): Promise<T> {
    return this.request<T>('DELETE', endpoint);
  }
  async uploadFile<T>(
    endpoint: string,
    _file: { uri: string; name: string; type: string },
    _fieldName: string = 'file',
    _config?: RequestConfig,
  ): Promise<T> {
    return this.request<T>('POST', endpoint);
  }
}

export const apiClient = new ApiClient();

// ── CENTRALIZED DOMAIN REGISTRY (ported from ios-final r6-api-1) ─────
// Domain-grouped API objects are mounted on `apiClient.*` so every
// hook routes through one place. Implementations live in
// `lib/api/_internal/*-impl.ts`.

import { athletePayoutsApi as _athletePayoutsApi } from './_internal/athlete-payouts-impl';
import { disclosuresApi as _disclosuresApi } from './_internal/disclosures-impl';
import { nilCompsApi as _nilCompsApi } from './_internal/nil-comps-impl';
import {
  schoolApi as _schoolApi,
  getSchoolDashboardSnapshot as _getSchoolDashboardSnapshot,
} from './_internal/school-impl';
import type {
  SchoolDashboardSnapshot as _SchoolDashboardSnapshot,
  SchoolDealRollup as _SchoolDealRollup,
  SchoolSnapshotSource as _SchoolSnapshotSource,
  GetSchoolDashboardSnapshotOptions as _GetSchoolDashboardSnapshotOptions,
  NilManagerSnapshot as _NilManagerSnapshot,
} from './_internal/school-impl';

(apiClient as ApiClient & {
  athletePayouts: typeof _athletePayoutsApi;
  disclosures: typeof _disclosuresApi;
  nilComps: typeof _nilCompsApi;
  school: typeof _schoolApi;
}).athletePayouts = _athletePayoutsApi;
(apiClient as ApiClient & { disclosures: typeof _disclosuresApi }).disclosures =
  _disclosuresApi;
(apiClient as ApiClient & { nilComps: typeof _nilCompsApi }).nilComps =
  _nilCompsApi;
(apiClient as ApiClient & { school: typeof _schoolApi }).school = _schoolApi;

export const athletePayoutsApi = _athletePayoutsApi;
export const disclosuresApi = _disclosuresApi;
export const nilCompsApi = _nilCompsApi;
export const schoolApi = _schoolApi;
export const getSchoolDashboardSnapshot = _getSchoolDashboardSnapshot;
export type SchoolDashboardSnapshot = _SchoolDashboardSnapshot;
export type SchoolDealRollup = _SchoolDealRollup;
export type SchoolSnapshotSource = _SchoolSnapshotSource;
export type GetSchoolDashboardSnapshotOptions = _GetSchoolDashboardSnapshotOptions;
export type NilManagerSnapshot = _NilManagerSnapshot;

// Keep ApiClientError exported-adjacent usage stable for any importers.
export { ApiClientError };
