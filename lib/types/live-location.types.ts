// Live Location Types - Telegram-style temporary location sharing

// Duration options for sharing (in minutes)
export type ShareDuration = 15 | 60 | 480; // 15min, 1h, 8h

export const SHARE_DURATION_OPTIONS: { label: string; value: ShareDuration }[] = [
  { label: '15 minutes', value: 15 },
  { label: '1 hour', value: 60 },
  { label: '8 hours', value: 480 },
];

// Location update from a friend
export interface FriendLocation {
  userId: string;
  username: string;
  avatarUrl: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  heading?: number;
  timestamp: number; // Unix timestamp
  expiresAt: number; // When sharing ends
}

// Current user's sharing state
export interface SharingState {
  isSharing: boolean;
  startedAt: number | null;
  expiresAt: number | null;
  duration: ShareDuration | null;
}

// WebSocket events (client -> server)
export interface ClientToServerEvents {
  // Start sharing location for specified duration
  start_sharing: (data: { duration: ShareDuration }) => void;

  // Send location update while sharing
  location_update: (data: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    heading?: number;
  }) => void;

  // Stop sharing early
  stop_sharing: () => void;

  // Subscribe to friends' locations (call on connect)
  subscribe_locations: () => void;
}

// WebSocket events (server -> client)
export interface ServerToClientEvents {
  // Receive friend's location update
  friend_location: (data: FriendLocation) => void;

  // Friend stopped sharing
  friend_stopped: (data: { userId: string }) => void;

  // Confirmation that sharing started
  sharing_started: (data: { expiresAt: number }) => void;

  // Confirmation that sharing stopped
  sharing_stopped: () => void;

  // Error from server
  error: (data: { message: string; code?: string }) => void;
}

// Socket connection state
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';
