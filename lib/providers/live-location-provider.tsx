// Live Location Provider - Telegram-style temporary location sharing
// Uses Socket.io for real-time communication with backend
// Supports background location updates via expo-task-manager

import * as React from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import * as Location from 'expo-location';
let TaskManager: typeof import('expo-task-manager') | null = null;
try {
  TaskManager = require('expo-task-manager');
} catch {
  // Native module not available (Expo Go or missing native rebuild)
}
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../api/client';
import { config } from '../config';
import { useAuth } from './auth-provider';
import type {
  FriendLocation,
  SharingState,
  ShareDurationSeconds,
  ConnectionState,
  ClientToServerEvents,
  ServerToClientEvents,
} from '../types/live-location.types';

// Storage key for persisting sharing state across app restarts
const SHARING_STATE_KEY = 'live_location_sharing_state';

// Background task name
const BACKGROUND_LOCATION_TASK = 'background-location-task';

// Location update interval (in ms) - balance between accuracy and battery
const LOCATION_UPDATE_INTERVAL = 5000; // 5 seconds

// Heartbeat interval to keep connection alive
const HEARTBEAT_INTERVAL = 30000; // 30 seconds

// Background location update interval (in ms) - less frequent to save battery
const BACKGROUND_LOCATION_INTERVAL = 15000; // 15 seconds
const BACKGROUND_LOCATION_DISTANCE = 20; // meters

// Module-level socket ref for background task access
let backgroundSocket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

// Define the background location task at module level (required by expo-task-manager)
TaskManager?.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }: any) => {
  if (error) {
    console.error('Background task error:', error.message);
    return;
  }

  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    const location = locations[0];
    if (!location) return;


    // Send via HTTP fallback if socket not available
    if (backgroundSocket?.connected) {
      backgroundSocket.emit('location_update', {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy ?? undefined,
        heading: location.coords.heading ?? undefined,
        speed: location.coords.speed ?? undefined,
      });
    } else {
      // HTTP fallback for when socket is disconnected in background
      try {
        const token = await apiClient.getAccessToken();
        if (token) {
          await fetch(`${config.api.baseUrl}/api/location`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              accuracy: location.coords.accuracy,
              heading: location.coords.heading,
              speed: location.coords.speed,
            }),
          });
        }
      } catch (err) {
        console.error('HTTP fallback failed:', err);
      }
    }
  }
});

interface LiveLocationContextType {
  // Connection state
  connectionState: ConnectionState;

  // Current user's sharing state
  sharingState: SharingState;
  remainingTime: number | null; // seconds remaining

  // Friends' locations (keyed by number since backend sends number userId)
  friendLocations: Map<number, FriendLocation>;

  // Actions
  startSharing: (duration: ShareDurationSeconds) => Promise<void>;
  stopSharing: () => Promise<void>;

  // Permission state
  hasLocationPermission: boolean;
  hasBackgroundPermission: boolean;
  requestLocationPermission: () => Promise<boolean>;
  requestBackgroundPermission: () => Promise<boolean>;
}

const LiveLocationContext =
  React.createContext<LiveLocationContextType | null>(null);

export function useLiveLocation() {
  const context = React.useContext(LiveLocationContext);
  if (!context) {
    throw new Error(
      'useLiveLocation must be used within a LiveLocationProvider'
    );
  }
  return context;
}

interface LiveLocationProviderProps {
  children: React.ReactNode;
}

export function LiveLocationProvider({ children }: LiveLocationProviderProps) {
  const { user, isAuthenticated } = useAuth();

  // Socket reference
  const socketRef = React.useRef<Socket<
    ServerToClientEvents,
    ClientToServerEvents
  > | null>(null);

  // Location subscription reference
  const locationSubRef = React.useRef<Location.LocationSubscription | null>(
    null
  );

  // Timer references
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const heartbeatRef = React.useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  // Current location for start_sharing
  const currentLocationRef = React.useRef<Location.LocationObject | null>(null);

  // State
  const [connectionState, setConnectionState] =
    React.useState<ConnectionState>('disconnected');
  const [sharingState, setSharingState] = React.useState<SharingState>({
    isSharing: false,
    startedAt: null,
    expiresAt: null,
    duration: null,
  });
  const [remainingTime, setRemainingTime] = React.useState<number | null>(null);
  const [friendLocations, setFriendLocations] = React.useState<
    Map<number, FriendLocation>
  >(new Map());
  const [hasLocationPermission, setHasLocationPermission] =
    React.useState(false);
  const [hasBackgroundPermission, setHasBackgroundPermission] =
    React.useState(false);

  // Check location permission on mount
  React.useEffect(() => {
    checkLocationPermission();
  }, []);

  // Restore sharing state from storage on mount
  React.useEffect(() => {
    restoreSharingState();
  }, []);

  // Connect socket when authenticated (only if feature is enabled)
  React.useEffect(() => {
    if (!config.websocket.enabled) {
      return;
    }

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
    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange
    );
    return () => {
      subscription.remove();
    };
  }, [sharingState.isSharing, hasBackgroundPermission]);

  // Update remaining time every second when sharing
  React.useEffect(() => {
    if (sharingState.isSharing && sharingState.expiresAt) {
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(
          0,
          Math.floor((sharingState.expiresAt! - now) / 1000)
        );
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
    const { status: fgStatus } = await Location.getForegroundPermissionsAsync();
    setHasLocationPermission(fgStatus === 'granted');

    const { status: bgStatus } = await Location.getBackgroundPermissionsAsync();
    setHasBackgroundPermission(bgStatus === 'granted');
  };

  const requestLocationPermission = async (): Promise<boolean> => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    const granted = status === 'granted';
    setHasLocationPermission(granted);
    return granted;
  };

  const requestBackgroundPermission = async (): Promise<boolean> => {
    // Must have foreground permission first
    if (!hasLocationPermission) {
      const fgGranted = await requestLocationPermission();
      if (!fgGranted) return false;
    }

    const { status } = await Location.requestBackgroundPermissionsAsync();
    const granted = status === 'granted';
    setHasBackgroundPermission(granted);
    return granted;
  };

  const restoreSharingState = async () => {
    try {
      const stored = await AsyncStorage.getItem(SHARING_STATE_KEY);
      if (stored) {
        const state: SharingState = JSON.parse(stored);
        // Check if still valid (not expired) — permanent shares have null expiresAt
        if (state.isSharing && (state.expiresAt === null || state.expiresAt > Date.now())) {
          setSharingState(state);
          // Will resume location updates when socket connects
        } else if (state.isSharing && state.expiresAt && state.expiresAt <= Date.now()) {
          // Expired, clear storage
          await AsyncStorage.removeItem(SHARING_STATE_KEY);
        }
      }
    } catch (error) {
      console.error('Failed to restore sharing state:', error);
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
      console.error('Failed to persist sharing state:', error);
    }
  };

  const handleAppStateChange = (nextState: AppStateStatus) => {
    if (nextState === 'active' && sharingState.isSharing) {
      // App came to foreground — switch to foreground location updates (more accurate)
      stopBackgroundLocationUpdates();
      startLocationUpdates();
    } else if (nextState === 'background' && sharingState.isSharing) {
      // App went to background — start background location task
      stopLocationUpdates();
      startBackgroundLocationUpdates();
    }
  };

  const startBackgroundLocationUpdates = async () => {
    if (!TaskManager) return; // Native module not available
    if (!hasBackgroundPermission) {
      return;
    }

    const isTaskRunning = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK).catch(() => false);
    if (isTaskRunning) {
      return;
    }

    try {
      await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: BACKGROUND_LOCATION_INTERVAL,
        distanceInterval: BACKGROUND_LOCATION_DISTANCE,
        deferredUpdatesInterval: BACKGROUND_LOCATION_INTERVAL,
        showsBackgroundLocationIndicator: true,
        foregroundService: Platform.OS === 'android' ? {
          notificationTitle: 'Status',
          notificationBody: 'Sharing your location',
          notificationColor: '#3897F0',
        } : undefined,
        pausesUpdatesAutomatically: false,
        activityType: Location.ActivityType.Other,
      });
    } catch (error) {
      console.error('Failed to start background location:', error);
    }
  };

  const stopBackgroundLocationUpdates = async () => {
    if (!TaskManager) return; // Native module not available
    try {
      const isTaskRunning = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK).catch(() => false);
      if (isTaskRunning) {
        await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      }
    } catch (error) {
      console.error('Failed to stop background location:', error);
    }
  };

  const connectSocket = async () => {
    if (socketRef.current?.connected) return;

    setConnectionState('connecting');

    try {
      // Get auth token from secure storage
      const token = await apiClient.getAccessToken();
      if (!token) {
        console.error('No auth token available');
        setConnectionState('error');
        return;
      }

      // Connect to /locations namespace
      const socketUrl = `${config.websocket.url}/locations`;

      const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
        socketUrl,
        {
          transports: ['websocket', 'polling'],
          auth: { token },
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        }
      );

      socket.on('connect', () => {
        setConnectionState('connected');

        // Subscribe to friends' locations
        socket.emit('subscribe_locations');

        // Resume sharing if we were sharing before
        if (sharingState.isSharing) {
          startLocationUpdates();
        }

        // Start heartbeat
        startHeartbeat();
      });

      socket.on('disconnect', (reason) => {
        setConnectionState('disconnected');
        stopHeartbeat();
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
        setConnectionState('error');
      });

      // Handle initial batch of friends' locations
      socket.on('friends_locations', (data) => {
        console.log(
          '[LiveLocation] Received initial friends locations:',
          data.users.length
        );
        const newMap = new Map<number, FriendLocation>();
        for (const friend of data.users) {
          newMap.set(friend.userId, friend);
        }
        setFriendLocations(newMap);
      });

      // Handle friend location updates
      socket.on('friend_location', (data) => {
        setFriendLocations((prev) => {
          const updated = new Map(prev);
          updated.set(data.userId, data);
          return updated;
        });
      });

      // Handle friend stopped sharing (backend sends friend_offline)
      socket.on('friend_offline', (data) => {
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
          expiresAt: data.sharingUntil,
          duration: sharingState.duration,
        };
        setSharingState(newState);
        persistSharingState(newState);
      });

      socket.on('sharing_stopped', (data) => {
        const newState: SharingState = {
          isSharing: false,
          startedAt: null,
          expiresAt: null,
          duration: null,
        };
        setSharingState(newState);
        persistSharingState(newState);
        stopLocationUpdates();
        stopBackgroundLocationUpdates();
      });

      // Handle heartbeat response
      socket.on('pong', (data) => {
      });

      socket.on('error', (data) => {
        console.error('Server error:', data.code, data.message);
      });

      socketRef.current = socket;
      // Set module-level ref for background task access
      backgroundSocket = socket;
    } catch (error) {
      console.error('Failed to connect socket:', error);
      setConnectionState('error');
    }
  };

  const disconnectSocket = () => {
    stopHeartbeat();
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      backgroundSocket = null;
    }
    setConnectionState('disconnected');
    stopLocationUpdates();
  };

  const startHeartbeat = () => {
    stopHeartbeat();
    heartbeatRef.current = setInterval(() => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('ping');
      }
    }, HEARTBEAT_INTERVAL);
  };

  const stopHeartbeat = () => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
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
          // Store current location for start_sharing
          currentLocationRef.current = location;

          if (socketRef.current?.connected && sharingState.isSharing) {
            socketRef.current.emit('location_update', {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              accuracy: location.coords.accuracy ?? undefined,
              heading: location.coords.heading ?? undefined,
              speed: location.coords.speed ?? undefined,
            });
          }
        }
      );
    } catch (error) {
      console.error('Failed to start location updates:', error);
    }
  };

  const stopLocationUpdates = () => {
    if (locationSubRef.current) {
      locationSubRef.current.remove();
      locationSubRef.current = null;
    }
  };

  const startSharing = async (duration: ShareDurationSeconds) => {
    if (!config.websocket.enabled) {
      console.warn('Live location feature is disabled');
      return;
    }

    if (!socketRef.current?.connected) {
      console.warn('Cannot start sharing - socket not connected');
      return;
    }

    if (!hasLocationPermission) {
      const granted = await requestLocationPermission();
      if (!granted) return;
    }

    // Request background permission for persistent location sharing
    if (!hasBackgroundPermission) {
      await requestBackgroundPermission();
      // Don't block sharing if denied — foreground still works
    }

    // Get current location first
    let location = currentLocationRef.current;
    if (!location) {
      try {
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        currentLocationRef.current = location;
      } catch (error) {
        console.error('Failed to get current location:', error);
        return;
      }
    }

    // Permanent sharing (0) = no expiry; timed = expiresAt set
    const isPermanent = duration === 0;
    const serverDuration = isPermanent ? 315360000 : duration; // 10 years fallback for backend

    // Optimistically update state (will be confirmed by server)
    const optimisticState: SharingState = {
      isSharing: true,
      startedAt: Date.now(),
      expiresAt: isPermanent ? null : Date.now() + duration * 1000,
      duration,
    };
    setSharingState(optimisticState);

    // Start foreground location updates
    startLocationUpdates();

    // Tell server with current location
    socketRef.current.emit('start_sharing', {
      duration: serverDuration as any,
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy ?? undefined,
      heading: location.coords.heading ?? undefined,
      speed: location.coords.speed ?? undefined,
    });
  };

  const stopSharing = async () => {
    // Stop all location updates
    stopLocationUpdates();
    stopBackgroundLocationUpdates();

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

  const value = React.useMemo<LiveLocationContextType>(
    () => ({
      connectionState,
      sharingState,
      remainingTime,
      friendLocations,
      startSharing,
      stopSharing,
      hasLocationPermission,
      hasBackgroundPermission,
      requestLocationPermission,
      requestBackgroundPermission,
    }),
    [connectionState, sharingState, remainingTime, friendLocations, startSharing, stopSharing, hasLocationPermission, hasBackgroundPermission, requestLocationPermission, requestBackgroundPermission],
  );

  return (
    <LiveLocationContext.Provider value={value}>
      {children}
    </LiveLocationContext.Provider>
  );
}
