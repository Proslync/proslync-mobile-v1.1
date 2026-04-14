// Snap Map-style interactive map screen with Mapbox
// Requires development build: expo run:ios or expo run:android

import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { useStableRouter } from '@/hooks/use-stable-router';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Pressable,
  Image,
  ActivityIndicator,
  ScrollView,
  FlatList,
} from 'react-native';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import Constants from 'expo-constants';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass, glassTint } from '@/constants/glass/liquid-glass';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { NearbyNativeSheet } from '@/components/map/nearby-native-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import { LiquidGlassView } from '@callstack/liquid-glass';
import { eventsApi } from '@/lib/api/events';
import { locationsApi, HeatmapPoint } from '@/lib/api/locations';
import type { Event } from '@/lib/types/events.types';
import { EventStatus } from '@/lib/types/events.types';
import Mapbox, { MapView, Camera, MarkerView, LocationPuck, SymbolLayer, ShapeSource, HeatmapLayer } from '@rnmapbox/maps';
import { useLiveLocation } from '@/lib/providers/live-location-provider';
import { ShareLocationSheet } from '@/components/map/share-location-sheet';
import { NativeShareLocationSheet, canUseNativeSheet } from '@/components/map/share-location-native-sheet';
import { FriendProfileSheet } from '@/components/map/friend-profile-sheet';
import { MapFabMenu } from '@/components/map/map-fab-menu';
import { config } from '@/lib/config';
import { useAuth } from '@/lib/providers/auth-provider';
import { useAppTheme } from '@/hooks/use-app-theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Check if running in Expo Go (native modules not available)
const isExpoGo = Constants.appOwnership === 'expo';

// Initialize Mapbox with token from environment
const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
if (MAPBOX_TOKEN && !isExpoGo) {
  Mapbox.setAccessToken(MAPBOX_TOKEN);
}

// Custom dark nightlife map style URL for Mapbox
const DARK_STYLE_URL = 'mapbox://styles/mapbox/dark-v11';

// Friend marker interface
interface FriendMarker {
  id: string;
  name: string;
  imageUrl: string;
  latitude: number;
  longitude: number;
  updatedAt: number; // Unix timestamp ms
}

// Types
interface MapEvent {
  id: string;
  title: string;
  venue: string;
  latitude: number;
  longitude: number;
  imageUrl: string;
  date: string;
  time: string;
  rawDate: string; // Original ISO date string for event page
  attendees: number;
  isLive: boolean;
  popularity: number;
  type: 'event' | 'venue' | 'hotspot';
}

// Transform API Event to MapEvent
function transformEventToMapEvent(event: Event): MapEvent {
  const now = new Date();
  const startDate = new Date(event.startDate);
  const endDate = event.endDate ? new Date(event.endDate) : null;

  // Calculate if event is today or tomorrow
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowStart = new Date(todayStart.getTime() + 86400000);
  const dayAfterTomorrow = new Date(todayStart.getTime() + 2 * 86400000);

  const isToday = startDate >= todayStart && startDate < tomorrowStart;
  const isTomorrow = startDate >= tomorrowStart && startDate < dayAfterTomorrow;
  const isPast = startDate < todayStart;

  // Check if event is currently live (happening RIGHT NOW)
  // Event is live ONLY if:
  // 1. Event status is ACTIVE (set by backend when event is happening)
  // OR
  // 2. Start time has passed AND end time hasn't (with reasonable defaults)
  let isLive = false;

  // Primary check: Use backend status if available
  if (event.status === EventStatus.ACTIVE) {
    isLive = true;
  } else if (event.status === EventStatus.FINISHED || event.status === EventStatus.CANCELLED) {
    isLive = false;
  } else {
    // Fallback: Calculate based on time if status is PUBLISHED
    // Only consider it live if currently within the event timeframe
    if (startDate <= now && event.status === EventStatus.PUBLISHED) {
      if (endDate) {
        // Has explicit end date - check if we're before it
        isLive = now <= endDate;
      } else {
        // No end date - assume event lasts 6 hours max from start
        const assumedEndDate = new Date(startDate.getTime() + 6 * 60 * 60 * 1000);
        isLive = now <= assumedEndDate;
      }
    }
  }

  // Never show past events as live
  if (isPast) {
    isLive = false;
  }

  // Format date string
  let dateStr = 'Upcoming';
  if (isPast) {
    dateStr = 'Past';
  } else if (isToday) {
    // Check if it's evening/night (after 6pm) to say "Tonight" vs "Today"
    const hour = startDate.getHours();
    dateStr = hour >= 18 ? 'Tonight' : 'Today';
  } else if (isTomorrow) {
    dateStr = 'Tomorrow';
  } else {
    // Show day of week for this week, or full date for later
    const daysUntil = Math.floor((startDate.getTime() - todayStart.getTime()) / 86400000);
    if (daysUntil <= 7) {
      dateStr = startDate.toLocaleDateString([], { weekday: 'long' });
    } else {
      dateStr = startDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  }

  // Format time - use actual event start time
  const timeStr = startDate.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  // Get actual attendee count from API
  const attendeeCount = event.attendeeCount ?? 0;

  return {
    id: event.id.toString(),
    title: event.name,
    venue: event.venue?.name || event.location || 'TBA',
    latitude: Number(event.venue?.latitude) || 40.7580, // Default to NYC
    longitude: Number(event.venue?.longitude) || -73.9855,
    imageUrl: event.flyer?.url || event.imageUrl || '',
    date: dateStr,
    time: timeStr,
    rawDate: event.startDate, // Keep original ISO date for event page
    attendees: attendeeCount,
    isLive,
    popularity: Math.min(100, attendeeCount > 0 ? Math.floor(attendeeCount / 5) : 0),
    type: 'event',
  };
}

// Horizontal event card for bottom sheet
// Event flyer card marker for map (rectangular flyer style)
const EventMarker = React.memo(function EventMarker({ event, onPress }: { event: MapEvent; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.eventMarkerContainer}>
      <View style={styles.eventMarker}>
        <Image source={{ uri: event.imageUrl }} style={styles.eventMarkerImage} />
        {event.isLive && (
          <View style={styles.eventMarkerLiveBadge}>
            <Text style={styles.eventMarkerLiveText}>LIVE</Text>
          </View>
        )}
      </View>
      <View style={styles.eventMarkerPointer} />
    </TouchableOpacity>
  );
});

// Friend profile marker for map (circular profile photo)
const FriendMarkerView = React.memo(function FriendMarkerView({ friend, onPress }: { friend: FriendMarker; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={12} style={styles.friendMarkerContainer}>
      <View style={styles.friendMarker}>
        <Image source={{ uri: friend.imageUrl }} style={styles.friendMarkerImage} />
      </View>
      <View style={styles.friendMarkerPointer} />
    </Pressable>
  );
});

// Current user's own location marker (green border)
const MyLocationMarker = React.memo(function MyLocationMarker({ imageUrl }: { imageUrl: string }) {
  return (
    <View style={styles.friendMarkerContainer}>
      <View style={styles.myLocationMarker}>
        <Image source={{ uri: imageUrl }} style={styles.friendMarkerImage} />
      </View>
      <View style={styles.myLocationPointer} />
    </View>
  );
});

// Full Mapbox Map Screen
function FullMapScreen() {
  const insets = useSafeAreaInsets();
  const router = useStableRouter();
  const cameraRef = useRef<Camera>(null);
  const [events, setEvents] = useState<MapEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<MapEvent | null>(null);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [showNearbySheet, setShowNearbySheet] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<FriendMarker | null>(null);
  const [heatmapPoints, setHeatmapPoints] = useState<HeatmapPoint[]>([]);
  const [weather, setWeather] = useState<{ temp: number; icon: string } | null>(null);
  const [isCentered, setIsCentered] = useState(true);
  const weatherTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchWeather = useCallback(async (lat: number, lon: number) => {
    const key = process.env.EXPO_PUBLIC_WEATHER_API_KEY;
    if (!key) return;
    try {
      const res = await fetch(`https://api.weatherapi.com/v1/current.json?key=${key}&q=${lat},${lon}`);
      const data = await res.json();
      if (data.current) {
        setWeather({ temp: Math.round(data.current.temp_f), icon: `https:${data.current.condition.icon}` });
      }
    } catch {}
  }, []);
  const { colors, isDark } = useAppTheme();

  // Live location hook
  const { friendLocations, sharingState } = useLiveLocation();

  // Auth hook for current user's avatar
  const { user } = useAuth();

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          const coords: [number, number] = [location.coords.longitude, location.coords.latitude];
          setUserLocation(coords);
          cameraRef.current?.setCamera({
            centerCoordinate: coords,
            zoomLevel: 13,
            animationDuration: 800,
          });

          // Fetch weather for initial location
          fetchWeather(location.coords.latitude, location.coords.longitude);
        }
      } catch {
        // Location unavailable (e.g. simulator)
      }
    })();
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const apiEvents = await eventsApi.getEvents({ limit: 50 });
      const mapEvents = apiEvents.map(transformEventToMapEvent);
      setEvents(mapEvents);
    } catch (err) {
      console.error('Failed to fetch events:', err);
      setError('Failed to load events');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchHeatmap = useCallback(async () => {
    if (!userLocation) return;
    try {
      const points = await locationsApi.getHeatmapPoints(userLocation[1], userLocation[0]);
      setHeatmapPoints(points);
    } catch (err) {
      console.error('Failed to fetch heatmap:', err);
    }
  }, [userLocation]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // Fetch heatmap when user location is available, refresh every 60s
  useEffect(() => {
    if (!userLocation) return;
    fetchHeatmap();
    const interval = setInterval(fetchHeatmap, 60000);
    return () => clearInterval(interval);
  }, [userLocation, fetchHeatmap]);

  const filteredEvents = useMemo(() => {
    return events.filter(e => e.date !== 'Past');
  }, [events]);

  // Convert live location data to friend markers, exclude stale (>24h)
  const nearbyFriends = useMemo<FriendMarker[]>(() => {
    const staleThreshold = Date.now() - 24 * 60 * 60 * 1000;
    return Array.from(friendLocations.values())
      .filter((loc) => loc.updatedAt > staleThreshold)
      .map((loc) => {
        const displayName = loc.firstName || loc.lastName
          ? `${loc.firstName || ''} ${loc.lastName || ''}`.trim()
          : loc.userName || `User ${loc.userId}`;

        return {
          id: String(loc.userId),
          name: displayName,
          imageUrl: loc.avatarUrl || '',
          latitude: loc.latitude,
          longitude: loc.longitude,
          updatedAt: loc.updatedAt,
        };
      });
  }, [friendLocations]);

  const handleEventPress = useCallback((event: MapEvent) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/event/[id]', params: { id: event.id, title: event.title, date: event.rawDate, imageUrl: event.imageUrl, venueName: event.venue, isPaid: 'false', isUserRegistered: 'false' } });
  }, [router]);

  const handleMarkerPress = useCallback((event: MapEvent) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedEvent(event);
    cameraRef.current?.setCamera({ centerCoordinate: [event.longitude, event.latitude], zoomLevel: 14, animationDuration: 500 });
    setShowNearbySheet(true);
  }, []);

  const handleFriendMarkerPress = useCallback((friend: FriendMarker) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedFriend(friend);
    cameraRef.current?.setCamera({ centerCoordinate: [friend.longitude, friend.latitude], zoomLevel: 15, animationDuration: 500 });
  }, []);

  const handleRecenter = useCallback(() => { if (userLocation) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setIsCentered(true); cameraRef.current?.setCamera({ centerCoordinate: userLocation, zoomLevel: 13, animationDuration: 500 }); } }, [userLocation]);

  const liveCount = useMemo(() => events.filter(e => e.isLive).length, [events]);
  const defaultCenter: [number, number] = userLocation || [-73.9855, 40.7580];

  // Build heatmap GeoJSON from anonymous user locations
  const heatmapGeoJSON = useMemo(() => {
    const features = heatmapPoints.map((pt) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [pt.longitude, pt.latitude] },
      properties: { weight: pt.weight },
    }));
    return { type: 'FeatureCollection' as const, features };
  }, [heatmapPoints]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <MapView
        style={StyleSheet.absoluteFill}
        styleURL={DARK_STYLE_URL}
        logoEnabled={false}
        attributionEnabled={false}
        compassEnabled={false}
        scaleBarEnabled={false}
        zoomEnabled={true}
        pitchEnabled={true}
        rotateEnabled={true}
        onTouchStart={() => setIsCentered(false)}
        onRegionDidChange={(feature) => {
          if (weatherTimerRef.current) clearTimeout(weatherTimerRef.current);
          weatherTimerRef.current = setTimeout(() => {
            const [lon, lat] = feature.geometry.coordinates;
            fetchWeather(lat, lon);
          }, 1000);
        }}
      >
        <Camera ref={cameraRef} defaultSettings={{ centerCoordinate: defaultCenter, zoomLevel: 12 }} minZoomLevel={2} maxZoomLevel={20} />
        {/* Override POI/business label colors to white */}
        <SymbolLayer id="poi-label" existing={true} style={{ textColor: '#ffffff' }} />
        {/* Heatmap layer — Snapmap-style activity density */}
        {heatmapGeoJSON.features.length > 0 && (
          <ShapeSource id="heatmap-source" shape={heatmapGeoJSON as any}>
            <HeatmapLayer
              id="heatmap-layer"
              sourceID="heatmap-source"
              belowLayerID="poi-label"
              style={{
                heatmapWeight: ['get', 'weight'],
                heatmapIntensity: [
                  'interpolate', ['linear'], ['zoom'],
                  0, 0.5,
                  9, 1,
                  14, 2,
                  18, 3,
                ],
                heatmapRadius: [
                  'interpolate', ['linear'], ['zoom'],
                  0, 4,
                  6, 15,
                  10, 30,
                  14, 50,
                  18, 70,
                ],
                heatmapColor: [
                  'interpolate', ['linear'], ['heatmap-density'],
                  0, 'rgba(0,0,0,0)',
                  0.1, 'rgba(33,102,172,0.2)',
                  0.3, 'rgba(103,169,207,0.4)',
                  0.5, 'rgba(109,205,163,0.5)',
                  0.7, 'rgba(253,219,127,0.6)',
                  0.85, 'rgba(239,138,98,0.7)',
                  1, 'rgba(178,24,43,0.8)',
                ],
                heatmapOpacity: [
                  'interpolate', ['linear'], ['zoom'],
                  0, 0.6,
                  14, 0.5,
                  18, 0.3,
                ],
              }}
            />
          </ShapeSource>
        )}

        {/* Show LocationPuck only when NOT sharing (avatar marker replaces it when sharing) */}
        {!sharingState.isSharing && (
          <LocationPuck puckBearing="heading" puckBearingEnabled={true} pulsing={{ isEnabled: true, color: '#34c759' }} />
        )}
        {filteredEvents.map((event) => (
          <MarkerView key={event.id} coordinate={[event.longitude, event.latitude]} anchor={{ x: 0.5, y: 1 }} allowOverlap={true} allowOverlapWithPuck={true}>
            <EventMarker event={event} onPress={() => handleMarkerPress(event)} />
          </MarkerView>
        ))}
        {nearbyFriends.map((friend) => (
          <MarkerView key={`friend-${friend.id}`} coordinate={[friend.longitude, friend.latitude]} anchor={{ x: 0.5, y: 1 }} allowOverlap={true} allowOverlapWithPuck={true}>
            <FriendMarkerView friend={friend} onPress={() => handleFriendMarkerPress(friend)} />
          </MarkerView>
        ))}
        {/* Show current user's marker when sharing location */}
        {sharingState.isSharing && userLocation && user?.avatar?.url && (
          <MarkerView coordinate={userLocation} anchor={{ x: 0.5, y: 1 }} allowOverlap={true} allowOverlapWithPuck={true}>
            <MyLocationMarker imageUrl={user.avatar.url} />
          </MarkerView>
        )}
      </MapView>

      {/* Top dim */}
      <LinearGradient
        colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0)']}
        style={styles.mapTopFade}
        pointerEvents="none"
      />

      {/* Weather pill — top left */}
      {weather && (
        <View style={[styles.weatherPill, { top: insets.top + 12 }]}>
          <LiquidGlassView effect="regular" style={StyleSheet.absoluteFill} />
          <Image source={{ uri: weather.icon }} style={styles.weatherIcon} />
          <Text style={styles.weatherTemp}>{weather.temp}°</Text>
        </View>
      )}

      {/* Glass pill with icons */}
      <MapFabMenu
        onShareLocation={async () => {
          try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted' && !userLocation) {
              const location = await Location.getCurrentPositionAsync({});
              setUserLocation([location.coords.longitude, location.coords.latitude]);
            }
          } catch {}
          setShowShareSheet(true);
        }}
        onRecenter={handleRecenter}
        onNearby={() => {
          setShowNearbySheet((prev) => !prev);
        }}
        isSharing={sharingState.isSharing}
        isCentered={isCentered}
        topInset={insets.top + 16}
      />

      {showNearbySheet && (
        <NearbyNativeSheet
          events={filteredEvents}
          isLoading={isLoading}
          liveCount={liveCount}
          nearbyFriends={nearbyFriends}
          isSharing={sharingState.isSharing}
          onFriendPress={(friend) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            cameraRef.current?.setCamera({
              centerCoordinate: [friend.longitude, friend.latitude],
              zoomLevel: 15,
              animationDuration: 500,
            });
          }}
          onEventPress={handleEventPress}
          onSharePress={async () => {
            try {
              await Location.requestForegroundPermissionsAsync();
            } catch {}
            setShowShareSheet(true);
          }}
          onDismiss={() => setShowNearbySheet(false)}
        />
      )}

      {/* Share Location Sheet — native SwiftUI on iOS 26+, fallback otherwise */}
      {canUseNativeSheet() ? (
        <NativeShareLocationSheet
          isVisible={showShareSheet}
          onClose={() => setShowShareSheet(false)}
        />
      ) : (
        <ShareLocationSheet
          isVisible={showShareSheet}
          onClose={() => setShowShareSheet(false)}
        />
      )}

      {/* Friend Profile Sheet */}
      <FriendProfileSheet
        visible={!!selectedFriend}
        onClose={() => setSelectedFriend(null)}
        onShareBack={async () => {
          try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted' && !userLocation) {
              const location = await Location.getCurrentPositionAsync({});
              setUserLocation([location.coords.longitude, location.coords.latitude]);
            }
          } catch {}
          setShowShareSheet(true);
        }}
        friend={selectedFriend}
      />
    </View>
  );
}

export default function MapScreen() {
  return <FullMapScreen />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Map grid decoration
  mapGrid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.1,
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#ccc',
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#ccc',
  },
  // Marker previews
  markerPreviewContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  markerPreview: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: '#fff',
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  markerPreviewImage: {
    width: '100%',
    height: '100%',
  },
  markerPreviewLive: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#ff3b30',
    borderWidth: 2,
    borderColor: '#fff',
  },
  // Dev notice
  devNotice: {
    position: 'absolute',
    alignSelf: 'center',
    borderRadius: 16,
    overflow: 'hidden',
  },
  devNoticeGlass: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
  },
  devNoticeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  devNoticeText: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: '#fff',
  },
  // Bottom sheet
  bottomSheetBackground: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  bottomSheetIndicator: {
    width: 40,
  },
  bottomSheetHeader: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontFamily: 'Lato_700Bold',
    marginBottom: 12,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  liveIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff3b30',
  },
  liveIndicatorText: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(0,0,0,0.6)',
  },
  bottomSheetContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  // Section headers for bottom sheet
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  // Friends horizontal scroll
  friendsScrollContent: {
    gap: 16,
    paddingRight: 16,
  },
  friendAvatarItem: {
    alignItems: 'center',
    width: 64,
  },
  friendAvatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    marginBottom: 6,
  },
  friendAvatarName: {
    fontSize: 11,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
  },
  emptyFriendsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  emptyFriendsText: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
  },
  shareLocationInline: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  inlineButtonGlass: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 8,
  },
  inlineButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  shareLocationInlineText: {
    fontSize: 12,
    fontFamily: 'Lato_600SemiBold',
    color: '#fff',
  },
  // Event card - horizontal scrollable
  horizontalEventsContent: {
    gap: 12,
    paddingRight: 16,
  },
  eventCard: {
    width: 200,
    height: 260,
    borderRadius: 16,
    overflow: 'hidden',
  },
  eventCardImage: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: 'cover',
  },
  eventCardGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  eventCardContent: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 12,
  },
  eventCardLive: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#ff3b30',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 6,
    gap: 4,
  },
  eventCardLiveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#fff',
  },
  eventCardLiveText: {
    fontSize: 9,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  eventCardTitle: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
    marginBottom: 2,
  },
  eventCardVenue: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  eventCardMetaText: {
    fontSize: 11,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.7)',
  },
  // Loading state
  loadingState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingStateText: {
    marginTop: 16,
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
  },
  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
  },
  emptyStateSubtext: {
    marginTop: 8,
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  retryButtonText: {
    fontSize: 14,
    fontFamily: 'Lato_600SemiBold',
    color: '#fff',
  },
  // Event flyer card markers
  eventMarkerContainer: {
    alignItems: 'center',
  },
  eventMarker: {
    width: 70,
    height: 100,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#ffffff',
    overflow: 'hidden',
    backgroundColor: '#f2f2f2',
  },
  eventMarkerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  eventMarkerLiveBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: '#ff3b30',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  eventMarkerLiveText: {
    fontSize: 8,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  eventMarkerPointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#ffffff',
    marginTop: -1,
  },
  // Friend profile markers
  friendMarkerContainer: {
    alignItems: 'center',
  },
  friendMarker: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: '#ffffff',
    overflow: 'hidden',
    backgroundColor: '#f2f2f2',
  },
  friendMarkerImage: {
    width: '100%',
    height: '100%',
  },
  friendMarkerPointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#ffffff',
    marginTop: -1,
  },
  // Current user's location marker (green border)
  myLocationMarker: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: '#34c759',
    overflow: 'hidden',
    backgroundColor: '#f2f2f2',
  },
  myLocationPointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#34c759',
    marginTop: -1,
  },
  // Map overlay glass buttons
  mapButtonGlass: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 23,
  },
  mapButtonContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Recenter button
  recenterButton: {
    position: 'absolute',
    right: 16,
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
  },
  // Share location button
  shareLocationButton: {
    position: 'absolute',
    right: 16,
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
  },
  sharingIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#34c759',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.95)',
  },
  mapTopFade: { position: 'absolute', top: 0, left: 0, right: 0, height: 120, zIndex: 10 },
  weatherPill: { position: 'absolute', left: 16, zIndex: 20, flexDirection: 'row', alignItems: 'center', borderRadius: 20, overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 6, gap: 2 },
  weatherIcon: { width: 28, height: 28 },
  weatherTemp: { fontSize: 17, fontWeight: '700', color: '#fff' },
  nearbyModalOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 },
  nearbyModalSheet: { backgroundColor: '#1c1c1e', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '75%', minHeight: 300 },
  nearbyModalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, paddingHorizontal: 16 },
  nearbyModalTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  nearbyModalClose: { position: 'absolute', right: 16, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' },
  nearbyModalEmpty: { alignItems: 'center', paddingVertical: 40 },
  nearbyModalEmptyText: { fontSize: 14, color: 'rgba(255,255,255,0.35)' },
  nearbyListRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.08)' },
  nearbyListImage: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#2c2c2e' },
  nearbyListTitle: { fontSize: 15, fontWeight: '600', color: '#fff', flex: 1 },
  nearbyListSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  nearbyListMeta: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  nearbyListDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#34c759' },
});
