// Live Location Types - Telegram-style temporary location sharing

// Duration options for sharing (in seconds for backend, display in minutes)
export type ShareDurationSeconds = 900 | 3600 | 28800; // 15min, 1h, 8h

export const SHARE_DURATION_OPTIONS: {
  label: string;
  value: ShareDurationSeconds;
  minutes: number;
}[] = [
  { label: '15 minutes', value: 900, minutes: 15 },
  { label: '1 hour', value: 3600, minutes: 60 },
  { label: '8 hours', value: 28800, minutes: 480 },
];

// Location update from a friend (matches backend ActiveSharer)
export interface FriendLocation {
  userId: number;
  userName: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  latitude: number;
  longitude: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
  sharingUntil: number; // Unix timestamp ms
  updatedAt: number; // Unix timestamp ms
}

// Current user's sharing state
export interface SharingState {
  isSharing: boolean;
  startedAt: number | null;
  expiresAt: number | null;
  duration: ShareDurationSeconds | null;
}

// WebSocket events (client -> server)
export interface ClientToServerEvents {
  // Start sharing location for specified duration
  start_sharing: (data: {
    duration: ShareDurationSeconds;
    latitude: number;
    longitude: number;
    accuracy?: number;
    heading?: number;
    speed?: number;
  }) => void;

  // Send location update while sharing
  location_update: (data: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    heading?: number;
    speed?: number;
  }) => void;

  // Stop sharing early
  stop_sharing: () => void;

  // Subscribe to friends' locations (call on connect)
  subscribe_locations: () => void;

  // Unsubscribe from friends' locations
  unsubscribe_locations: () => void;

  // Heartbeat
  ping: () => void;
}

// WebSocket events (server -> client)
export interface ServerToClientEvents {
  // Receive friend's location update
  friend_location: (data: FriendLocation) => void;

  // Friend stopped sharing (was friend_offline on backend)
  friend_offline: (data: { userId: number }) => void;

  // Initial batch of friends' locations on subscribe
  friends_locations: (data: { users: FriendLocation[] }) => void;

  // Confirmation that sharing started
  sharing_started: (data: {
    sharingUntil: number;
    remainingSeconds: number;
  }) => void;

  // Confirmation that sharing stopped
  sharing_stopped: (data: { reason: 'manual' | 'expired' }) => void;

  // Heartbeat response
  pong: (data: { serverTime: number }) => void;

  // Error from server
  error: (data: { code: string; message: string }) => void;
}

// Socket connection state
export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error';

// Helper to get display name from FriendLocation
export function getFriendDisplayName(friend: FriendLocation): string {
  if (friend.firstName || friend.lastName) {
    return `${friend.firstName || ''} ${friend.lastName || ''}`.trim();
  }
  return friend.userName || `User ${friend.userId}`;
}
