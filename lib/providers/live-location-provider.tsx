// Live Location Provider - Telegram-style temporary location sharing
// Uses Socket.io for real-time communication with backend

import * as React from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import * as Location from 'expo-location';
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { config } from '../config';
import { useAuth } from './auth-provider';
import type {
  FriendLocation,
  SharingState,
  ShareDuration,
  ConnectionState,
  ClientToServerEvents,
  ServerToClientEvents,
} from '../types/live-location.types';

// Storage key for persisting sharing state across app restarts
const SHARING_STATE_KEY = 'live_location_sharing_state';

// Location update interval (in ms) - balance between accuracy and battery
const LOCATION_UPDATE_INTERVAL = 5000; // 5 seconds

interface LiveLocationContextType {
  // Connection state
  connectionState: ConnectionState;

  // Current user's sharing state
  sharingState: SharingState;
  remainingTime: number | null; // seconds remaining

  // Friends' locations
  friendLocations: Map<string, FriendLocation>;

  // Actions
  startSharing: (duration: ShareDuration) => Promise<void>;
  stopSharing: () => Promise<void>;

  // Permission state
  hasLocationPermission: boolean;
  requestLocationPermission: () => Promise<boolean>;
}

const LiveLocationContext = React.createContext<LiveLocationContextType | null>(null);

export function useLiveLocation() {
  const context = React.useContext(LiveLocationContext);
  if (!context) {
    throw new Error('useLiveLocation must be used within a LiveLocationProvider');
  }
  return context;
}

interface LiveLocationProviderProps {
  children: React.ReactNode;
}

export function LiveLocationProvider({ children }: LiveLocationProviderProps) {
  const { user, isAuthenticated } = useAuth();

  // Socket reference
  const socketRef = React.useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);

  // Location subscription reference
  const locationSubRef = React.useRef<Location.LocationSubscription | null>(null);

  // Timer for remaining time updates
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  // State
  const [connectionState, setConnectionState] = React.useState<ConnectionState>('disconnected');
  const [sharingState, setSharingState] = React.useState<SharingState>({
    isSharing: false,
    startedAt: null,
    expiresAt: null,
    duration: null,
  });
  const [remainingTime, setRemainingTime] = React.useState<number | null>(null);
  const [friendLocations, setFriendLocations] = React.useState<Map<string, FriendLocation>>(
    new Map()
  );
  const [hasLocationPermission, setHasLocationPermission] = React.useState(false);

  // Check location permission on mount
  React.useEffect(() => {
    checkLocationPermission();
  }, []);

  // Restore sharing state from storage on mount
  React.useEffect(() => {
    restoreSharingState();
  }, []);

  // Connect socket when authenticated
  React.useEffect(() => {
    if (isAuthenticated && user) {
      connectSocket();
    } else {
      disconnectSocket();
    }

    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated, user]);

  // Handle app state changes (background/foreground)
  React.useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [sharingState.isSharing]);

  // Update remaining time every second when sharing
  React.useEffect(() => {
    if (sharingState.isSharing && sharingState.expiresAt) {
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((sharingState.expiresAt! - now) / 1000));
        setRemainingTime(remaining);

        // Auto-stop when time expires
        if (remaining <= 0) {
          stopSharing();
        }
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };
    } else {
      setRemainingTime(null);
    }
  }, [sharingState.isSharing, sharingState.expiresAt]);

  const checkLocationPermission = async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    setHasLocationPermission(status === 'granted');
  };

  const requestLocationPermission = async (): Promise<boolean> => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    const granted = status === 'granted';
    setHasLocationPermission(granted);
    return granted;
  };

  const restoreSharingState = async () => {
    try {
      const stored = await AsyncStorage.getItem(SHARING_STATE_KEY);
      if (stored) {
        const state: SharingState = JSON.parse(stored);
        // Check if still valid (not expired)
        if (state.isSharing && state.expiresAt && state.expiresAt > Date.now()) {
          setSharingState(state);
          // Will resume location updates when socket connects
        } else {
          // Expired, clear storage
          await AsyncStorage.removeItem(SHARING_STATE_KEY);
        }
      }
    } catch (error) {
      console.error('[LiveLocation] Failed to restore sharing state:', error);
    }
  };

  const persistSharingState = async (state: SharingState) => {
    try {
      if (state.isSharing) {
        await AsyncStorage.setItem(SHARING_STATE_KEY, JSON.stringify(state));
      } else {
        await AsyncStorage.removeItem(SHARING_STATE_KEY);
      }
    } catch (error) {
      console.error('[LiveLocation] Failed to persist sharing state:', error);
    }
  };

  const handleAppStateChange = (nextState: AppStateStatus) => {
    if (nextState === 'active' && sharingState.isSharing) {
      // App came to foreground, ensure location updates are running
      startLocationUpdates();
    }
  };

  const connectSocket = async () => {
    if (socketRef.current?.connected) return;

    setConnectionState('connecting');

    try {
      // Get auth token
      const token = await AsyncStorage.getItem(config.auth.tokenKey);
      if (!token) {
        setConnectionState('error');
        return;
      }

      const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(config.websocket.url, {
        path: '/socket.io',
        transports: ['websocket'],
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socket.on('connect', () => {
        console.log('[LiveLocation] Socket connected');
        setConnectionState('connected');

        // Subscribe to friends' locations
        socket.emit('subscribe_locations');

        // Resume sharing if we were sharing before
        if (sharingState.isSharing) {
          startLocationUpdates();
        }
      });

      socket.on('disconnect', (reason) => {
        console.log('[LiveLocation] Socket disconnected:', reason);
        setConnectionState('disconnected');
      });

      socket.on('connect_error', (error) => {
        console.error('[LiveLocation] Socket connection error:', error.message);
        setConnectionState('error');
      });

      // Handle friend location updates
      socket.on('friend_location', (data) => {
        setFriendLocations((prev) => {
          const updated = new Map(prev);
          updated.set(data.userId, data);
          return updated;
        });
      });

      // Handle friend stopped sharing
      socket.on('friend_stopped', (data) => {
        setFriendLocations((prev) => {
          const updated = new Map(prev);
          updated.delete(data.userId);
          return updated;
        });
      });

      // Handle sharing confirmations
      socket.on('sharing_started', (data) => {
        const newState: SharingState = {
          isSharing: true,
          startedAt: Date.now(),
          expiresAt: data.expiresAt,
          duration: sharingState.duration,
        };
        setSharingState(newState);
        persistSharingState(newState);
      });

      socket.on('sharing_stopped', () => {
        const newState: SharingState = {
          isSharing: false,
          startedAt: null,
          expiresAt: null,
          duration: null,
        };
        setSharingState(newState);
        persistSharingState(newState);
        stopLocationUpdates();
      });

      socket.on('error', (data) => {
        console.error('[LiveLocation] Server error:', data.message);
      });

      socketRef.current = socket;
    } catch (error) {
      console.error('[LiveLocation] Failed to connect socket:', error);
      setConnectionState('error');
    }
  };

  const disconnectSocket = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setConnectionState('disconnected');
    stopLocationUpdates();
  };

  const startLocationUpdates = async () => {
    // Stop existing subscription first
    stopLocationUpdates();

    if (!hasLocationPermission) {
      const granted = await requestLocationPermission();
      if (!granted) return;
    }

    try {
      locationSubRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: LOCATION_UPDATE_INTERVAL,
          distanceInterval: 10, // Also update if moved 10 meters
        },
        (location) => {
          if (socketRef.current?.connected && sharingState.isSharing) {
            socketRef.current.emit('location_update', {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              accuracy: location.coords.accuracy ?? undefined,
              heading: location.coords.heading ?? undefined,
            });
          }
        }
      );
    } catch (error) {
      console.error('[LiveLocation] Failed to start location updates:', error);
    }
  };

  const stopLocationUpdates = () => {
    if (locationSubRef.current) {
      locationSubRef.current.remove();
      locationSubRef.current = null;
    }
  };

  const startSharing = async (duration: ShareDuration) => {
    if (!socketRef.current?.connected) {
      console.warn('[LiveLocation] Cannot start sharing - socket not connected');
      return;
    }

    if (!hasLocationPermission) {
      const granted = await requestLocationPermission();
      if (!granted) return;
    }

    // Optimistically update state (will be confirmed by server)
    const optimisticState: SharingState = {
      isSharing: true,
      startedAt: Date.now(),
      expiresAt: Date.now() + duration * 60 * 1000,
      duration,
    };
    setSharingState(optimisticState);

    // Start location updates
    startLocationUpdates();

    // Tell server
    socketRef.current.emit('start_sharing', { duration });
  };

  const stopSharing = async () => {
    // Stop location updates immediately
    stopLocationUpdates();

    // Update local state
    const newState: SharingState = {
      isSharing: false,
      startedAt: null,
      expiresAt: null,
      duration: null,
    };
    setSharingState(newState);
    persistSharingState(newState);

    // Tell server (if connected)
    if (socketRef.current?.connected) {
      socketRef.current.emit('stop_sharing');
    }
  };

  const value: LiveLocationContextType = {
    connectionState,
    sharingState,
    remainingTime,
    friendLocations,
    startSharing,
    stopSharing,
    hasLocationPermission,
    requestLocationPermission,
  };

  return (
    <LiveLocationContext.Provider value={value}>
      {children}
    </LiveLocationContext.Provider>
  );
}
