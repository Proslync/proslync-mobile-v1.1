// Snap Map-style interactive map screen with Mapbox
// Requires development build: expo run:ios or expo run:android

import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { useStableRouter } from '@/hooks/use-stable-router';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Image,
  Platform,
  Linking,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import Constants from 'expo-constants';
import { GlassView } from 'expo-glass-effect';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { NearbyNativeSheet } from '@/components/map/nearby-native-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import { LiquidGlassView } from '@callstack/liquid-glass';
import { eventsApi } from '@/lib/api/events';
import { locationsApi, HeatmapPoint } from '@/lib/api/locations';
import type { Event } from '@/lib/types/events.types';
import { EventStatus } from '@/lib/types/events.types';
import Mapbox, { MapView, Camera, MarkerView, LocationPuck, SymbolLayer, ShapeSource, HeatmapLayer, FillExtrusionLayer, VectorSource } from '@rnmapbox/maps';
import { useLiveLocation } from '@/lib/providers/live-location-provider';
import { ShareLocationSheet } from '@/components/map/share-location-sheet';
import { NativeShareLocationSheet, canUseNativeSheet } from '@/components/map/share-location-native-sheet';
import { MapFabMenu } from '@/components/map/map-fab-menu';
import { config } from '@/lib/config';
import { useAuth } from '@/lib/providers/auth-provider';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useTabNavigation } from '@/lib/providers/tab-navigation-provider';


// Check if running in Expo Go (native modules not available)
const isExpoGo = Constants.executionEnvironment === 'storeClient' ? false : Constants.appOwnership === 'expo';

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
  isUserRegistered: boolean;
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
    latitude: event.locationDetails?.coordinates?.lat || Number(event.venue?.latitude) || (event as any).latitude || 0,
    longitude: event.locationDetails?.coordinates?.lng || Number(event.venue?.longitude) || (event as any).longitude || 0,
    imageUrl: event.flyer?.url || event.imageUrl || '',
    date: dateStr,
    time: timeStr,
    rawDate: event.startDate, // Keep original ISO date for event page
    attendees: attendeeCount,
    isLive,
    popularity: Math.min(100, attendeeCount > 0 ? Math.floor(attendeeCount / 5) : 0),
    type: 'event',
    isUserRegistered: event.isUserRegistered ?? false,
  };
}

// Horizontal event card for bottom sheet
// Event flyer card marker for map (rectangular flyer style)
const EventMarker = React.memo(function EventMarker({ event, onPress }: { event: MapEvent; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.eventMarkerContainer} accessibilityLabel={`Event: ${event.title} at ${event.venue}`} accessibilityRole="button">
      <View style={styles.eventMarker}>
        <Image source={{ uri: event.imageUrl }} style={styles.eventMarkerImage} />
      </View>
      <View style={styles.eventMarkerPointer} />
    </TouchableOpacity>
  );
});

// Fake scores per mock venue id — parsed from event.title into two team rows
type ScoreRow = { team: string; score: number };
type MockScore = { away: ScoreRow; home: ScoreRow; status: 'LIVE' | 'FINAL' | 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'OT' | 'HALF' };

// Extended game stats for the preview card (Kiyan line + team splits)
type GameStats = {
  clock?: string;             // "4:32 · Q4"
  kiyan?: { pts: number; reb: number; ast: number; stl?: number; blk?: number; fg: string; threes: string; ft: string; min: number };
  teamLeaders?: { name: string; line: string }[]; // when Kiyan isn't playing
  teamStats?: { label: string; away: string; home: string }[];
};

const MOCK_GAME_STATS: Record<string, GameStats> = {
  'mock-venue-cuse': {
    clock: '4:32 · Q4',
    kiyan: { pts: 21, reb: 4, ast: 3, stl: 1, fg: '7-13', threes: '4-7', ft: '3-3', min: 31 },
    teamStats: [
      { label: 'FG %', away: '44.2%', home: '48.1%' },
      { label: '3PT %', away: '36.0%', home: '41.7%' },
      { label: 'REB', away: '28', home: '33' },
      { label: 'AST', away: '12', home: '15' },
      { label: 'TO', away: '11', home: '8' },
    ],
  },
  'mock-venue-cameron': {
    clock: 'Final',
    teamLeaders: [
      { name: 'T. Brown (UNC)', line: '24 PTS · 7 REB · 5 AST' },
      { name: 'C. Flagg (DUKE)', line: '29 PTS · 10 REB · 3 BLK' },
    ],
    teamStats: [
      { label: 'FG %', away: '46.8%', home: '49.3%' },
      { label: '3PT %', away: '35.7%', home: '39.1%' },
      { label: 'REB', away: '32', home: '38' },
    ],
  },
  'mock-venue-dean': {
    clock: 'Halftime',
    teamLeaders: [
      { name: 'R. Newell (UVA)', line: '14 PTS · 3 REB' },
      { name: 'T. Brown (UNC)', line: '17 PTS · 4 REB · 2 AST' },
    ],
    teamStats: [
      { label: 'FG %', away: '41.9%', home: '47.2%' },
      { label: '3PT %', away: '30.0%', home: '38.5%' },
    ],
  },
  'mock-venue-watsco': {
    clock: '6:14 · Q2',
    kiyan: { pts: 12, reb: 2, ast: 2, fg: '4-7', threes: '2-3', ft: '2-2', min: 14 },
    teamStats: [
      { label: 'FG %', away: '45.0%', home: '39.3%' },
      { label: '3PT %', away: '38.9%', home: '28.6%' },
      { label: 'REB', away: '14', home: '17' },
    ],
  },
  'mock-venue-msg': {
    clock: 'Tip-off Sun 6:30 PM',
    teamLeaders: [
      { name: 'K. Anthony (CUSE)', line: 'Season avg · 14.2 PPG' },
      { name: 'S. Castle (UCONN)', line: 'Season avg · 13.8 PPG' },
    ],
  },
  'mock-venue-barclays': {
    clock: 'Sun · 2:00 PM',
    teamLeaders: [
      { name: 'Kiyan Anthony', line: 'HS alum · Class of 2024' },
    ],
  },
  'mock-venue-louisville': {
    clock: 'Final',
    teamLeaders: [
      { name: 'B. Jennings (SMU)', line: '22 PTS · 6 AST' },
      { name: 'T. Edwards (LOU)', line: '19 PTS · 9 REB' },
    ],
    teamStats: [
      { label: 'FG %', away: '47.2%', home: '44.8%' },
      { label: '3PT %', away: '38.5%', home: '33.3%' },
    ],
  },
  'mock-venue-petersen': {
    clock: '3:18 · Q3',
    teamLeaders: [
      { name: 'B. Horne (PITT)', line: '18 PTS · 4 AST' },
      { name: 'M. Poole Jr. (NCST)', line: '16 PTS · 5 REB' },
    ],
  },
  'mock-venue-jpj': {
    clock: '1:42 · Q4',
    teamLeaders: [
      { name: 'M. Trimble (UVA)', line: '20 PTS · 5 AST' },
      { name: 'M. Burton (ND)', line: '17 PTS · 4 REB' },
    ],
  },
  'mock-venue-chase': {
    clock: '5:08 · Q3',
    teamLeaders: [
      { name: 'S. Curry (GSW)', line: '28 PTS · 6 AST · 4-8 3P' },
      { name: 'L. James (LAL)', line: '22 PTS · 7 REB · 5 AST' },
    ],
    teamStats: [
      { label: 'FG %', away: '45.3%', home: '49.1%' },
      { label: '3PT %', away: '33.3%', home: '42.9%' },
      { label: 'REB', away: '31', home: '34' },
    ],
  },
  'mock-venue-haas': {
    clock: '2:45 · Q4',
    teamLeaders: [
      { name: 'F. Cissoko (CAL)', line: '18 PTS · 6 REB' },
      { name: 'M. Raynaud (STAN)', line: '21 PTS · 8 REB' },
    ],
  },
  'mock-venue-maples': {
    clock: 'Halftime',
    teamLeaders: [
      { name: 'M. Raynaud (STAN)', line: '14 PTS · 5 REB' },
      { name: 'I. Collier (USC)', line: '12 PTS · 3 AST' },
    ],
  },
  'mock-venue-pauley': {
    clock: '6:50 · Q4',
    teamLeaders: [
      { name: 'D. Bona (UCLA)', line: '24 PTS · 5 REB · 2 BLK' },
      { name: 'C. Love (ARIZ)', line: '19 PTS · 4 AST' },
    ],
  },
  'mock-venue-mckale': {
    clock: '1:24 · Q3',
    teamLeaders: [
      { name: 'C. Love (ARIZ)', line: '15 PTS · 6 AST' },
      { name: 'J. Richardson (ORE)', line: '13 PTS · 5 REB' },
    ],
  },
  'mock-venue-sf-billgraham': {
    clock: '7:12 · Q3',
    kiyan: { pts: 15, reb: 3, ast: 2, fg: '5-9', threes: '3-5', ft: '2-2', min: 22 },
    teamStats: [
      { label: 'FG %', away: '42.5%', home: '46.9%' },
      { label: '3PT %', away: '33.3%', home: '40.0%' },
    ],
  },
  'mock-venue-sf-warfield': {
    clock: 'Today · 7:00 PM',
    teamLeaders: [
      { name: 'Kiyan Anthony', line: 'Appearance + signing' },
    ],
  },
  'mock-venue-sf-union': {
    clock: 'Tomorrow · 12:00 PM',
    teamLeaders: [
      { name: 'PUMA Hoops × Kiyan', line: 'Pop-up · MB.04 NY Edition' },
    ],
  },
  'mock-venue-sf-oracle': {
    clock: 'Sat · 10:00 AM',
    teamLeaders: [
      { name: 'NIL x Athletes Summit', line: 'Panels · workshops · brand deals' },
    ],
  },
  'mock-venue-sf-mission': {
    clock: '4:21 · Q2',
    teamLeaders: [
      { name: 'J. Rivera (NORTH)', line: '11 PTS · 4 AST' },
      { name: 'D. Chen (SOUTH)', line: '9 PTS · 3 REB' },
    ],
  },
};

const MOCK_SCORES: Record<string, MockScore> = {
  'mock-venue-cuse': { away: { team: 'DUKE', score: 54 }, home: { team: 'CUSE', score: 62 }, status: 'Q4' },
  'mock-venue-cameron': { away: { team: 'UNC', score: 68 }, home: { team: 'DUKE', score: 71 }, status: 'FINAL' },
  'mock-venue-dean': { away: { team: 'UVA', score: 44 }, home: { team: 'UNC', score: 51 }, status: 'HALF' },
  'mock-venue-watsco': { away: { team: 'CUSE', score: 38 }, home: { team: 'MIA', score: 33 }, status: 'Q2' },
  'mock-venue-msg': { away: { team: 'UCONN', score: 0 }, home: { team: 'CUSE', score: 0 }, status: 'FINAL' },
  'mock-venue-barclays': { away: { team: 'TEAM A', score: 0 }, home: { team: 'TEAM B', score: 0 }, status: 'FINAL' },
  'mock-venue-louisville': { away: { team: 'SMU', score: 72 }, home: { team: 'LOU', score: 65 }, status: 'FINAL' },
  'mock-venue-petersen': { away: { team: 'NCST', score: 47 }, home: { team: 'PITT', score: 52 }, status: 'Q3' },
  'mock-venue-jpj': { away: { team: 'ND', score: 59 }, home: { team: 'UVA', score: 64 }, status: 'Q4' },
  'mock-venue-chase': { away: { team: 'LAL', score: 88 }, home: { team: 'GSW', score: 94 }, status: 'Q3' },
  'mock-venue-haas': { away: { team: 'STAN', score: 61 }, home: { team: 'CAL', score: 58 }, status: 'Q4' },
  'mock-venue-maples': { away: { team: 'USC', score: 42 }, home: { team: 'STAN', score: 49 }, status: 'HALF' },
  'mock-venue-pauley': { away: { team: 'ARIZ', score: 66 }, home: { team: 'UCLA', score: 71 }, status: 'Q4' },
  'mock-venue-mckale': { away: { team: 'ORE', score: 53 }, home: { team: 'ARIZ', score: 56 }, status: 'Q3' },
  'mock-venue-sf-billgraham': { away: { team: 'DUKE', score: 48 }, home: { team: 'CUSE', score: 51 }, status: 'Q3' },
  'mock-venue-sf-warfield': { away: { team: 'POP', score: 0 }, home: { team: 'KA7', score: 0 }, status: 'FINAL' },
  'mock-venue-sf-union': { away: { team: 'PUMA', score: 0 }, home: { team: 'HOOP', score: 0 }, status: 'FINAL' },
  'mock-venue-sf-oracle': { away: { team: 'WST', score: 0 }, home: { team: 'EAST', score: 0 }, status: 'FINAL' },
  'mock-venue-sf-mission': { away: { team: 'NORTH', score: 21 }, home: { team: 'SOUTH', score: 18 }, status: 'Q2' },
};

// Live score card — replaces the stadium illustration at each mock venue
const StadiumMarker = React.memo(function StadiumMarker({ event, onPress }: { event: MapEvent; onPress: () => void }) {
  const score = MOCK_SCORES[event.id];
  if (!score) return null;

  const isLive = score.status !== 'FINAL';
  const leaderIsAway = score.away.score > score.home.score;
  const leaderIsHome = score.home.score > score.away.score;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.scoreMarkerContainer}
      accessibilityLabel={`${event.title} · ${score.away.team} ${score.away.score}, ${score.home.team} ${score.home.score}`}
      accessibilityRole="button"
    >
      <View style={styles.scoreCard}>
        {/* Status pill */}
        <View style={[styles.scoreStatusPill, isLive && styles.scoreStatusPillLive]}>
          {isLive && <View style={styles.scoreStatusDot} />}
          <Text style={styles.scoreStatusText}>{score.status}</Text>
        </View>
        {/* Away row */}
        <View style={styles.scoreRow}>
          <Text style={[styles.scoreTeam, !leaderIsAway && styles.scoreTeamDim]} numberOfLines={1}>{score.away.team}</Text>
          <Text style={[styles.scoreNum, !leaderIsAway && styles.scoreNumDim]}>{score.away.score}</Text>
        </View>
        {/* Home row */}
        <View style={styles.scoreRow}>
          <Text style={[styles.scoreTeam, !leaderIsHome && styles.scoreTeamDim]} numberOfLines={1}>{score.home.team}</Text>
          <Text style={[styles.scoreNum, !leaderIsHome && styles.scoreNumDim]}>{score.home.score}</Text>
        </View>
      </View>
      <View style={styles.scoreMarkerPointer} />
    </TouchableOpacity>
  );
});

// Friend profile marker for map (circular profile photo)
const FriendMarkerView = React.memo(function FriendMarkerView({ friend, onPress }: { friend: FriendMarker; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={12} style={styles.friendMarkerContainer} accessibilityLabel={`Friend: ${friend.name}`} accessibilityRole="button">
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

// Mock stadiums + games — college basketball venues with upcoming games
const MOCK_STADIUM_GAMES: MapEvent[] = (() => {
  const now = Date.now();
  const days = (n: number) => new Date(now + n * 86400000);
  const hrs = (n: number) => new Date(now + n * 3600000);
  const fmtDate = (d: Date) => {
    const todayStart = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
    const daysUntil = Math.floor((d.getTime() - todayStart.getTime()) / 86400000);
    if (daysUntil === 0) return d.getHours() >= 18 ? 'Tonight' : 'Today';
    if (daysUntil === 1) return 'Tomorrow';
    if (daysUntil <= 7) return d.toLocaleDateString([], { weekday: 'long' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };
  const fmtTime = (d: Date) => d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  const make = (base: Omit<MapEvent, 'date' | 'time' | 'rawDate'> & { when: Date }): MapEvent => ({
    ...base,
    date: fmtDate(base.when),
    time: fmtTime(base.when),
    rawDate: base.when.toISOString(),
  });
  return [
    make({
      id: 'mock-venue-cuse',
      title: 'Syracuse vs. Duke',
      venue: 'JMA Wireless Dome',
      latitude: 43.0361,
      longitude: -76.1369,
      imageUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&q=80',
      when: hrs(3),
      attendees: 32400,
      isLive: false,
      popularity: 98,
      type: 'event',
      isUserRegistered: true,
    }),
    make({
      id: 'mock-venue-cameron',
      title: 'Duke vs. North Carolina',
      venue: 'Cameron Indoor Stadium',
      latitude: 36.0022,
      longitude: -78.9436,
      imageUrl: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=1200&q=80',
      when: days(2),
      attendees: 9314,
      isLive: false,
      popularity: 96,
      type: 'event',
      isUserRegistered: false,
    }),
    make({
      id: 'mock-venue-dean',
      title: 'UNC vs. Virginia',
      venue: 'Dean E. Smith Center',
      latitude: 35.9033,
      longitude: -79.0428,
      imageUrl: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=1200&q=80',
      when: days(4),
      attendees: 21750,
      isLive: false,
      popularity: 88,
      type: 'event',
      isUserRegistered: false,
    }),
    make({
      id: 'mock-venue-watsco',
      title: 'Miami vs. Syracuse',
      venue: 'Watsco Center',
      latitude: 25.7191,
      longitude: -80.2778,
      imageUrl: 'https://images.unsplash.com/photo-1577471489098-30e59e04d9cf?w=1200&q=80',
      when: days(6),
      attendees: 7972,
      isLive: false,
      popularity: 82,
      type: 'event',
      isUserRegistered: true,
    }),
    make({
      id: 'mock-venue-msg',
      title: 'Big East Tip-Off · Cuse vs. UConn',
      venue: 'Madison Square Garden',
      latitude: 40.7505,
      longitude: -73.9934,
      imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&q=80',
      when: days(9),
      attendees: 19812,
      isLive: false,
      popularity: 99,
      type: 'event',
      isUserRegistered: true,
    }),
    make({
      id: 'mock-venue-barclays',
      title: 'Kiyan Anthony HS Showcase',
      venue: 'Barclays Center',
      latitude: 40.6826,
      longitude: -73.9754,
      imageUrl: 'https://images.unsplash.com/photo-1509027572446-af8401acfdc3?w=1200&q=80',
      when: days(12),
      attendees: 17732,
      isLive: false,
      popularity: 91,
      type: 'event',
      isUserRegistered: false,
    }),
    make({
      id: 'mock-venue-louisville',
      title: 'Louisville vs. SMU',
      venue: 'KFC Yum! Center',
      latitude: 38.2462,
      longitude: -85.7527,
      imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&q=80',
      when: days(3),
      attendees: 22090,
      isLive: false,
      popularity: 75,
      type: 'event',
      isUserRegistered: false,
    }),
    make({
      id: 'mock-venue-petersen',
      title: 'Pitt vs. NC State',
      venue: 'Petersen Events Center',
      latitude: 40.4436,
      longitude: -79.9626,
      imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200&q=80',
      when: days(5),
      attendees: 12508,
      isLive: false,
      popularity: 71,
      type: 'event',
      isUserRegistered: false,
    }),
    make({
      id: 'mock-venue-jpj',
      title: 'Virginia vs. Notre Dame',
      venue: 'John Paul Jones Arena',
      latitude: 38.0368,
      longitude: -78.5234,
      imageUrl: 'https://images.unsplash.com/photo-1505666287802-931dc83a0fe4?w=1200&q=80',
      when: days(7),
      attendees: 14593,
      isLive: false,
      popularity: 78,
      type: 'event',
      isUserRegistered: false,
    }),
    // ── West coast (so the SF-default sim sees pins immediately) ──
    make({
      id: 'mock-venue-chase',
      title: 'Warriors vs. Lakers',
      venue: 'Chase Center',
      latitude: 37.7680,
      longitude: -122.3878,
      imageUrl: 'https://images.unsplash.com/photo-1577471489098-30e59e04d9cf?w=1200&q=80',
      when: hrs(6),
      attendees: 18064,
      isLive: false,
      popularity: 99,
      type: 'event',
      isUserRegistered: false,
    }),
    make({
      id: 'mock-venue-haas',
      title: 'Cal vs. Stanford',
      venue: 'Haas Pavilion',
      latitude: 37.8726,
      longitude: -122.2601,
      imageUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&q=80',
      when: days(1),
      attendees: 11858,
      isLive: false,
      popularity: 82,
      type: 'event',
      isUserRegistered: false,
    }),
    make({
      id: 'mock-venue-maples',
      title: 'Stanford vs. USC',
      venue: 'Maples Pavilion',
      latitude: 37.4318,
      longitude: -122.1718,
      imageUrl: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=1200&q=80',
      when: days(3),
      attendees: 7233,
      isLive: false,
      popularity: 74,
      type: 'event',
      isUserRegistered: false,
    }),
    make({
      id: 'mock-venue-pauley',
      title: 'UCLA vs. Arizona',
      venue: 'Pauley Pavilion',
      latitude: 34.0708,
      longitude: -118.4452,
      imageUrl: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=1200&q=80',
      when: days(4),
      attendees: 13800,
      isLive: false,
      popularity: 88,
      type: 'event',
      isUserRegistered: false,
    }),
    make({
      id: 'mock-venue-mckale',
      title: 'Arizona vs. Oregon',
      venue: 'McKale Center',
      latitude: 32.2315,
      longitude: -110.9501,
      imageUrl: 'https://images.unsplash.com/photo-1509027572446-af8401acfdc3?w=1200&q=80',
      when: days(5),
      attendees: 14655,
      isLive: false,
      popularity: 80,
      type: 'event',
      isUserRegistered: false,
    }),
    // ── Right around central SF (visible at sim default zoom) ──
    make({
      id: 'mock-venue-sf-billgraham',
      title: 'ACC Hoops Tour Stop · SF',
      venue: 'Bill Graham Civic Auditorium',
      latitude: 37.7784,
      longitude: -122.4186,
      imageUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&q=80',
      when: hrs(2),
      attendees: 7000,
      isLive: true,
      popularity: 94,
      type: 'event',
      isUserRegistered: false,
    }),
    make({
      id: 'mock-venue-sf-warfield',
      title: 'Kiyan Anthony Brand Pop-Up',
      venue: 'The Warfield',
      latitude: 37.7828,
      longitude: -122.4099,
      imageUrl: 'https://images.unsplash.com/photo-1577471489098-30e59e04d9cf?w=1200&q=80',
      when: hrs(5),
      attendees: 2200,
      isLive: false,
      popularity: 88,
      type: 'event',
      isUserRegistered: true,
    }),
    make({
      id: 'mock-venue-sf-union',
      title: 'Hoop Culture x PUMA · SF',
      venue: 'Union Square',
      latitude: 37.7880,
      longitude: -122.4076,
      imageUrl: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=1200&q=80',
      when: days(1),
      attendees: 3400,
      isLive: false,
      popularity: 90,
      type: 'event',
      isUserRegistered: false,
    }),
    make({
      id: 'mock-venue-sf-oracle',
      title: 'NIL x Athletes Summit',
      venue: 'Oracle Park',
      latitude: 37.7786,
      longitude: -122.3893,
      imageUrl: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=1200&q=80',
      when: days(2),
      attendees: 41915,
      isLive: false,
      popularity: 92,
      type: 'event',
      isUserRegistered: false,
    }),
    make({
      id: 'mock-venue-sf-mission',
      title: 'Mission District Streetball Finals',
      venue: 'Dolores Park Courts',
      latitude: 37.7596,
      longitude: -122.4269,
      imageUrl: 'https://images.unsplash.com/photo-1509027572446-af8401acfdc3?w=1200&q=80',
      when: days(3),
      attendees: 1200,
      isLive: false,
      popularity: 76,
      type: 'event',
      isUserRegistered: false,
    }),
  ];
})();

// Full Mapbox Map Screen
function FullMapScreen() {
  const insets = useSafeAreaInsets();
  const router = useStableRouter();
  const cameraRef = useRef<Camera>(null);
  const [events, setEvents] = useState<MapEvent[]>(MOCK_STADIUM_GAMES);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<MapEvent | null>(null);

  // Swipe-to-dismiss gesture for event preview card
  const cardTranslateY = useSharedValue(0);
  const cardOpacity = useSharedValue(1);

  const dismissCard = useCallback(() => {
    setSelectedEvent(null);
    setSelectedFriend(null);
    cardTranslateY.value = 0;
    cardOpacity.value = 1;
  }, []);

  const showCard = useCallback(() => {
    cardTranslateY.value = 200;
    cardOpacity.value = 1;
    cardTranslateY.value = withTiming(0, { duration: 300 });
  }, []);

  const cardPanGesture = useMemo(() => Gesture.Pan()
    .onUpdate((e) => {
      const ty = Math.max(0, e.translationY);
      cardTranslateY.value = ty;
      cardOpacity.value = 1 - Math.min(ty / 250, 0.6);
    })
    .onEnd((e) => {
      if (e.translationY > 100 || e.velocityY > 500) {
        cardTranslateY.value = withTiming(400, { duration: 200 });
        cardOpacity.value = withTiming(0, { duration: 200 }, () => {
          runOnJS(dismissCard)();
        });
      } else {
        cardTranslateY.value = withTiming(0, { duration: 200 });
        cardOpacity.value = withTiming(1, { duration: 200 });
      }
    }), [dismissCard]);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cardTranslateY.value }],
    opacity: cardOpacity.value,
  }));
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
  const { currentTab } = useTabNavigation();

  // Live location hook
  const { friendLocations, sharingState } = useLiveLocation();

  // Auth hook for current user's avatar
  const { user } = useAuth();

  const [locationDenied, setLocationDenied] = useState(false);

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
            pitch: 60,
            animationDuration: 800,
          });

          // Fetch weather for initial location
          fetchWeather(location.coords.latitude, location.coords.longitude);
        } else {
          setLocationDenied(true);
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
      const apiEvents = (await eventsApi.getEvents({ limit: 50 })).filter(
        (e) => (e.eventType || '').toLowerCase() !== 'club'
      );
      const mapEvents = apiEvents.map(transformEventToMapEvent);

      // Geocode events that have a custom location text (overrides venue coordinates)
      const token = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
      if (token) {
        const needsGeocode = mapEvents.filter(e => {
          const original = apiEvents.find(a => a.id.toString() === e.id);
          // Geocode if: no coordinates, OR has custom location text different from venue
          return (e.latitude === 0 && e.longitude === 0) || (original?.location && original.location !== original.venue?.address);
        });
        for (const evt of needsGeocode) {
          // Find the original event's location text
          const original = apiEvents.find(a => a.id.toString() === evt.id);
          const locationText = original?.location || original?.venue?.address;
          if (!locationText) continue;
          try {
            const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(locationText)}.json?access_token=${token}&limit=1`);
            const data = await res.json();
            if (data.features?.[0]?.center) {
              evt.longitude = data.features[0].center[0];
              evt.latitude = data.features[0].center[1];
            }
          } catch {}
        }
      }

      // Filter out events that still have no coordinates, merge with mock stadium games
      const real = mapEvents.filter(e => e.latitude !== 0 && e.longitude !== 0);
      setEvents([...MOCK_STADIUM_GAMES, ...real]);
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

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Cleanup weather debounce timer on unmount
  useEffect(() => {
    return () => {
      if (weatherTimerRef.current) clearTimeout(weatherTimerRef.current);
    };
  }, []);

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

  // Mock friend for UI testing
  const friendDriveTime = useMemo(() => {
    if (!userLocation || !selectedFriend) return '';
    const R = 6371;
    const dLat = (selectedFriend.latitude - userLocation[1]) * Math.PI / 180;
    const dLon = (selectedFriend.longitude - userLocation[0]) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(userLocation[1] * Math.PI / 180) * Math.cos(selectedFriend.latitude * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    const km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const mins = Math.max(1, Math.round(km / 0.5));
    return `${mins} min`;
  }, [userLocation, selectedFriend]);

  const allNearbyFriends = useMemo<FriendMarker[]>(() => [...nearbyFriends], [nearbyFriends]);

  const handleEventPress = useCallback((event: MapEvent) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/event/[id]', params: { id: event.id } });
  }, [router]);

  const handleMarkerPress = useCallback((event: MapEvent) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedEvent(event);
    showCard();
    cameraRef.current?.setCamera({ centerCoordinate: [event.longitude, event.latitude], zoomLevel: 14, pitch: 60, animationDuration: 500 });
  }, [showCard]);

  const handleFriendMarkerPress = useCallback((friend: FriendMarker) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedFriend(friend);
    showCard();
    cameraRef.current?.setCamera({ centerCoordinate: [friend.longitude, friend.latitude], zoomLevel: 15, pitch: 60, animationDuration: 500 });
  }, [showCard]);

  const handleRecenter = useCallback(() => {
    if (userLocation) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setIsCentered(true);
      cameraRef.current?.setCamera({ centerCoordinate: userLocation, zoomLevel: 13, pitch: 60, animationDuration: 500 });
    }
  }, [userLocation]);

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
        onTouchStart={() => { if (isCentered) setIsCentered(false); }}
        onRegionDidChange={(feature) => {
          if (weatherTimerRef.current) clearTimeout(weatherTimerRef.current);
          weatherTimerRef.current = setTimeout(() => {
            const [lon, lat] = feature.geometry.coordinates;
            fetchWeather(lat, lon);
          }, 1000);
        }}
      >
        <Camera ref={cameraRef} defaultSettings={{ centerCoordinate: defaultCenter, zoomLevel: 12, pitch: 60 }} minZoomLevel={2} maxZoomLevel={20} />
        {/* Override label colors so cities/states/countries are readable at all zoom levels */}
        <SymbolLayer
          id="country-label"
          existing={true}
          style={{
            textColor: '#ffffff',
            textHaloColor: 'rgba(0,0,0,0.7)',
            textHaloWidth: 1.4,
          }}
        />
        <SymbolLayer
          id="state-label"
          existing={true}
          style={{
            textColor: 'rgba(255,255,255,0.95)',
            textHaloColor: 'rgba(0,0,0,0.7)',
            textHaloWidth: 1.2,
          }}
        />
        <SymbolLayer
          id="settlement-major-label"
          existing={true}
          style={{
            textColor: '#ffffff',
            textHaloColor: 'rgba(0,0,0,0.7)',
            textHaloWidth: 1.2,
          }}
        />
        <SymbolLayer
          id="settlement-minor-label"
          existing={true}
          style={{
            textColor: 'rgba(255,255,255,0.9)',
            textHaloColor: 'rgba(0,0,0,0.7)',
            textHaloWidth: 1.1,
          }}
        />
        <SymbolLayer
          id="settlement-subdivision-label"
          existing={true}
          style={{
            textColor: 'rgba(255,255,255,0.75)',
            textHaloColor: 'rgba(0,0,0,0.6)',
            textHaloWidth: 1,
          }}
        />
        <SymbolLayer id="poi-label" existing={true} style={{ textColor: '#ffffff' }} />
        {/* 3D extruded buildings — fades in from zoom 14 so flat view stays clean */}
        <VectorSource id="composite-buildings" url="mapbox://mapbox.mapbox-streets-v8">
          <FillExtrusionLayer
            id="3d-buildings"
            sourceID="composite-buildings"
            sourceLayerID="building"
            filter={['==', ['get', 'extrude'], 'true']}
            minZoomLevel={14}
            style={{
              fillExtrusionColor: '#1e2028',
              fillExtrusionHeight: [
                'interpolate', ['linear'], ['zoom'],
                14, 0,
                15.05, ['get', 'height'],
              ],
              fillExtrusionBase: [
                'interpolate', ['linear'], ['zoom'],
                14, 0,
                15.05, ['get', 'min_height'],
              ],
              fillExtrusionOpacity: 0.85,
            }}
          />
        </VectorSource>
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
        {filteredEvents.map((event) => {
          const isStadium = event.id.startsWith('mock-venue-');
          return (
            <MarkerView key={event.id} coordinate={[event.longitude, event.latitude]} anchor={{ x: 0.5, y: 1 }} allowOverlap={true} allowOverlapWithPuck={true}>
              {isStadium ? (
                <StadiumMarker event={event} onPress={() => handleMarkerPress(event)} />
              ) : (
                <EventMarker event={event} onPress={() => handleMarkerPress(event)} />
              )}
            </MarkerView>
          );
        })}
        {allNearbyFriends.map((friend) => (
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
        <View style={[styles.weatherPill, { top: insets.top + 12 }]} accessibilityLabel={`Weather: ${weather?.temp || ''}°`}>
          <GlassView glassEffectStyle="regular" style={[StyleSheet.absoluteFill, { borderRadius: 20 }]} />
          <Image source={{ uri: weather.icon }} style={styles.weatherIcon} />
          <Text style={styles.weatherTemp}>{weather.temp}°</Text>
        </View>
      )}

      {/* Error state */}
      {error && events.length === 0 && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', zIndex: 30 }} pointerEvents="box-none">
          <View style={{ backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 16, padding: 20, alignItems: 'center', gap: 10 }}>
            <Ionicons name="cloud-offline-outline" size={28} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>Couldn't load events</Text>
            <TouchableOpacity
              style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 8 }}
              onPress={fetchEvents}
              activeOpacity={0.7}
            >
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Location denied banner */}
      {locationDenied && !userLocation && (
        <TouchableOpacity
          style={{ position: 'absolute', bottom: 110, left: 16, right: 16, zIndex: 30, backgroundColor: 'rgba(0,0,0,0.75)', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }}
          activeOpacity={0.8}
          accessibilityLabel="Enable location access. Tap to open Settings."
          accessibilityRole="button"
          onPress={() => Linking.openSettings()}
        >
          <Ionicons name="location-outline" size={22} color="#fff" />
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>Location access needed</Text>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Tap to open Settings</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.4)" />
        </TouchableOpacity>
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
          nearbyFriends={allNearbyFriends}
          isSharing={sharingState.isSharing}
          onFriendPress={(friend) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            cameraRef.current?.setCamera({
              centerCoordinate: [friend.longitude, friend.latitude],
              zoomLevel: 15,
              pitch: 60,
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

      {/* Event Preview Card */}
      {selectedEvent && !showNearbySheet && (() => {
        const isStadium = selectedEvent.id.startsWith('mock-venue-');
        const score = isStadium ? MOCK_SCORES[selectedEvent.id] : undefined;
        const stats = isStadium ? MOCK_GAME_STATS[selectedEvent.id] : undefined;

        if (isStadium && score) {
          const leaderIsAway = score.away.score > score.home.score;
          const leaderIsHome = score.home.score > score.away.score;
          const isLive = score.status !== 'FINAL';
          return (
            <View style={styles.eventPreviewOverlay} pointerEvents="box-none">
              <GestureDetector gesture={cardPanGesture}>
                <Animated.View style={[styles.gameStatsCard, cardAnimatedStyle]}>
                  <GlassView glassEffectStyle="clear" colorScheme="dark" tintColor="rgba(10,10,10,0.75)" borderRadius={20} style={StyleSheet.absoluteFill} pointerEvents="none" />
                  {/* Grab handle */}
                  <View style={{ alignItems: 'center', marginBottom: 6 }} pointerEvents="none">
                    <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                  </View>

                  {/* Header: status + venue + clock */}
                  <View style={styles.gameStatsHeader}>
                    <View style={[styles.gameStatsStatusPill, isLive && styles.gameStatsStatusPillLive]}>
                      {isLive && <View style={styles.gameStatsStatusDot} />}
                      <Text style={styles.gameStatsStatusText}>{score.status}</Text>
                    </View>
                    <Text style={styles.gameStatsVenue} numberOfLines={1}>{selectedEvent.venue}</Text>
                    {stats?.clock && <Text style={styles.gameStatsClock}>{stats.clock}</Text>}
                  </View>

                  {/* Scoreboard */}
                  <View style={styles.gameStatsScoreboard}>
                    <View style={styles.gameStatsTeamRow}>
                      <Text style={[styles.gameStatsTeamName, !leaderIsAway && styles.gameStatsTeamNameDim]}>{score.away.team}</Text>
                      <Text style={[styles.gameStatsTeamScore, !leaderIsAway && styles.gameStatsTeamScoreDim]}>{score.away.score}</Text>
                    </View>
                    <View style={styles.gameStatsTeamRow}>
                      <Text style={[styles.gameStatsTeamName, !leaderIsHome && styles.gameStatsTeamNameDim]}>{score.home.team}</Text>
                      <Text style={[styles.gameStatsTeamScore, !leaderIsHome && styles.gameStatsTeamScoreDim]}>{score.home.score}</Text>
                    </View>
                  </View>

                  {/* Kiyan line (if playing) */}
                  {stats?.kiyan && (
                    <View style={styles.gameStatsKiyanBlock}>
                      <Text style={styles.gameStatsKiyanLabel}>KIYAN ANTHONY · {stats.kiyan.min} MIN</Text>
                      <Text style={styles.gameStatsKiyanLine}>
                        {stats.kiyan.pts} PTS · {stats.kiyan.reb} REB · {stats.kiyan.ast} AST
                        {stats.kiyan.stl ? ` · ${stats.kiyan.stl} STL` : ''}
                      </Text>
                      <Text style={styles.gameStatsKiyanSplits}>
                        FG {stats.kiyan.fg}  ·  3P {stats.kiyan.threes}  ·  FT {stats.kiyan.ft}
                      </Text>
                    </View>
                  )}

                  {/* Team leaders fallback */}
                  {!stats?.kiyan && stats?.teamLeaders && (
                    <View style={styles.gameStatsLeadersBlock}>
                      {stats.teamLeaders.map((l, i) => (
                        <View key={i} style={{ gap: 1 }}>
                          <Text style={styles.gameStatsLeaderName}>{l.name}</Text>
                          <Text style={styles.gameStatsLeaderLine}>{l.line}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Team stat splits */}
                  {stats?.teamStats && stats.teamStats.length > 0 && (
                    <View style={styles.gameStatsTable}>
                      <View style={styles.gameStatsTableHeader}>
                        <Text style={[styles.gameStatsTableCell, styles.gameStatsTableHead, { textAlign: 'left' }]}>STAT</Text>
                        <Text style={[styles.gameStatsTableCell, styles.gameStatsTableHead]}>{score.away.team}</Text>
                        <Text style={[styles.gameStatsTableCell, styles.gameStatsTableHead]}>{score.home.team}</Text>
                      </View>
                      {stats.teamStats.map((row) => (
                        <View key={row.label} style={styles.gameStatsTableRow}>
                          <Text style={[styles.gameStatsTableCell, styles.gameStatsTableLabel, { textAlign: 'left' }]}>{row.label}</Text>
                          <Text style={styles.gameStatsTableCell}>{row.away}</Text>
                          <Text style={styles.gameStatsTableCell}>{row.home}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </Animated.View>
              </GestureDetector>
            </View>
          );
        }

        return (
          <View
            style={styles.eventPreviewOverlay}
            pointerEvents="box-none"
          >
            <GestureDetector gesture={cardPanGesture}>
            <Animated.View style={[styles.eventPreviewCard, { height: 155 }, cardAnimatedStyle]}>
              <Pressable style={StyleSheet.absoluteFill} onPress={() => { const ev = selectedEvent; setSelectedEvent(null); handleEventPress(ev); }} />
              <GlassView glassEffectStyle="clear" colorScheme="dark" tintColor="rgba(10,10,10,0.7)" borderRadius={20} style={StyleSheet.absoluteFill} pointerEvents="none" />
              {/* Grab handle */}
              <View style={{ position: 'absolute', top: 6, left: 0, right: 0, alignItems: 'center', zIndex: 10 }} pointerEvents="none">
                <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)' }} />
              </View>
              {/* Flyer — left */}
              {selectedEvent.imageUrl ? (
                <Image source={{ uri: selectedEvent.imageUrl }} style={styles.eventPreviewFlyer} pointerEvents="none" />
              ) : (
                <View style={[styles.eventPreviewFlyer, { backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' }]} pointerEvents="none">
                  <Ionicons name="calendar" size={28} color="rgba(255,255,255,0.3)" />
                </View>
              )}
              {/* Details — right */}
              <View style={styles.eventPreviewInfo} pointerEvents="box-none">
                <View style={{ flex: 1, justifyContent: 'center', gap: 2 }} pointerEvents="none">
                  <Text style={[styles.eventPreviewTitle, { fontSize: 18 }]} numberOfLines={2}>{selectedEvent.title}</Text>
                  <Text style={[styles.eventPreviewVenue, { fontSize: 15, fontWeight: '700' }]} numberOfLines={1}>{selectedEvent.venue}</Text>
                  <Text style={[styles.eventPreviewMeta, { fontSize: 13, fontWeight: '700' }]}>{selectedEvent.date} · {selectedEvent.time}</Text>
                </View>
                <View style={styles.eventPreviewActions}>
                  <TouchableOpacity
                    style={styles.eventPreviewRsvp}
                    activeOpacity={0.8}
                    accessibilityLabel={selectedEvent.isUserRegistered ? "Open RSVP'd event" : "RSVP to event"}
                    accessibilityRole="button"
                    onPress={() => {
                      const ev = selectedEvent;
                      setSelectedEvent(null);
                      handleEventPress(ev);
                    }}
                  >
                    <Text
                      style={[
                        styles.eventPreviewRsvpText,
                        selectedEvent.isUserRegistered && { color: 'rgba(0,0,0,0.55)' },
                      ]}
                    >
                      {selectedEvent.isUserRegistered ? "RSVP'd" : "RSVP"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ borderRadius: 14, overflow: 'hidden', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 14, gap: 2 }}
                    activeOpacity={0.7}
                    accessibilityLabel="Share event"
                    accessibilityRole="button"
                    onPress={() => {
                      if (!selectedEvent) return;
                      Share.share({
                        message: `Check out ${selectedEvent.title} at ${selectedEvent.venue}! ${selectedEvent.date} · ${selectedEvent.time}`,
                        url: `https://status.app/event/${selectedEvent.id}`,
                      });
                    }}
                  >
                    <GlassView glassEffectStyle="clear" colorScheme="dark" tintColor="rgba(255,255,255,0.12)" borderRadius={14} style={StyleSheet.absoluteFill} />
                    <Ionicons name="share-outline" size={18} color="#fff" />
                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>Share</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
            </GestureDetector>
          </View>
        );
      })()}

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

      {/* Friend Preview Card — same style as event preview */}
      {selectedFriend && !selectedEvent && (
        <View style={styles.eventPreviewOverlay} pointerEvents="box-none">
          <GestureDetector gesture={cardPanGesture}>
          <Animated.View style={[styles.eventPreviewCard, { flexDirection: 'column', height: 155 }, cardAnimatedStyle]}>
            <GlassView glassEffectStyle="clear" colorScheme="dark" tintColor="rgba(10,10,10,0.7)" borderRadius={20} style={StyleSheet.absoluteFill} />
            {/* Grab handle */}
            <View style={{ position: 'absolute', top: 6, left: 0, right: 0, alignItems: 'center', zIndex: 10 }}>
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)' }} />
            </View>
            {/* Content — vertical layout */}
            <View style={{ flex: 1, flexDirection: 'column', padding: 14, paddingTop: 14, justifyContent: 'space-between' }}>
              {/* Profile row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                {selectedFriend.imageUrl ? (
                  <Image source={{ uri: selectedFriend.imageUrl }} style={{ width: 56, height: 56, borderRadius: 28 }} />
                ) : (
                  <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="person" size={24} color="rgba(255,255,255,0.3)" />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.eventPreviewTitle, { fontSize: 20 }]} numberOfLines={1}>{selectedFriend.name}</Text>
                  <Text style={[styles.eventPreviewMeta, { fontSize: 14, marginTop: 5, fontWeight: '700' }]}>Last active {(() => {
                    const diff = Math.floor((Date.now() - selectedFriend.updatedAt) / 60000);
                    if (diff < 1) return 'Just now';
                    if (diff < 60) return `${diff}m ago`;
                    return `${Math.floor(diff / 60)}h ago`;
                  })()}</Text>
                </View>
              </View>
              {/* Actions row */}
              <View style={{ flexDirection: 'row', alignItems: 'stretch', gap: 8 }}>
                <TouchableOpacity
                  style={[styles.eventPreviewRsvp, { flexDirection: 'row', gap: 6, justifyContent: 'center', marginRight: 5 }]}
                  activeOpacity={0.8}
                  accessibilityLabel="Message friend"
                  accessibilityRole="button"
                  onPress={() => {
                    const friendId = selectedFriend.id;
                    setSelectedFriend(null);
                    router.push({ pathname: '/chat/[conversationId]', params: { conversationId: friendId } });
                  }}
                >
                  <Ionicons name="paper-plane" size={16} color="#000" />
                  <Text style={[styles.eventPreviewRsvpText, { fontSize: 17 }]}>Message</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ borderRadius: 14, overflow: 'hidden', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 14, gap: 2 }}
                  activeOpacity={0.7}
                  accessibilityLabel={`Get directions, ${friendDriveTime} away`}
                  accessibilityRole="button"
                  onPress={() => {
                    const { latitude, longitude } = selectedFriend;
                    const url = Platform.select({
                      ios: `maps:?daddr=${latitude},${longitude}&dirflg=d&t=m`,
                      default: `geo:${latitude},${longitude}`,
                    });
                    if (url) Linking.openURL(url);
                  }}
                >
                  <GlassView glassEffectStyle="clear" colorScheme="dark" tintColor="rgba(255,255,255,0.12)" borderRadius={14} style={StyleSheet.absoluteFill} />
                  <Ionicons name="car-outline" size={18} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>{friendDriveTime}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
          </GestureDetector>
        </View>
      )}
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
  // Event flyer card markers
  eventMarkerContainer: {
    alignItems: 'center',
  },
  stadiumMarkerContainer: {
    alignItems: 'center',
  },
  stadiumLiveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#FF6F3C',
    marginBottom: 4,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    zIndex: 3,
  },
  stadiumLiveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#FFF',
  },
  stadiumLiveText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.8,
  },
  stadiumIsoImage: {
    width: 96,
    height: 68,
  },
  // ── Live score card markers ──
  scoreMarkerContainer: {
    alignItems: 'center',
  },
  scoreCard: {
    minWidth: 88,
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 8,
    borderRadius: 10,
    backgroundColor: '#0F1114',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    gap: 3,
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  scoreStatusPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginBottom: 2,
  },
  scoreStatusPillLive: {
    backgroundColor: '#FF6F3C',
  },
  scoreStatusDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFF',
  },
  scoreStatusText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.7,
    color: '#FFF',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  scoreTeam: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.2,
  },
  scoreTeamDim: {
    color: 'rgba(255,255,255,0.55)',
  },
  scoreNum: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFF',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.2,
  },
  scoreNumDim: {
    color: 'rgba(255,255,255,0.55)',
  },
  scoreMarkerPointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#0F1114',
    marginTop: -0.5,
  },
  eventMarker: {
    width: 70,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: '#fff',
  },
  eventMarkerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  eventMarkerPointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#fff',
    alignSelf: 'center',
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
    backgroundColor: '#000000',
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
    backgroundColor: '#000000',
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
  eventPreviewOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 50, justifyContent: 'flex-end', paddingBottom: 100, paddingHorizontal: 16 },
  // ── Game stats card (replaces preview for mock venues) ──
  gameStatsCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.15)',
    padding: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  gameStatsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  gameStatsStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  gameStatsStatusPillLive: {
    backgroundColor: '#FF6F3C',
  },
  gameStatsStatusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#FFF',
  },
  gameStatsStatusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#FFF',
  },
  gameStatsVenue: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: -0.1,
  },
  gameStatsClock: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.2,
  },
  gameStatsScoreboard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 10,
    gap: 6,
  },
  gameStatsTeamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gameStatsTeamName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.3,
  },
  gameStatsTeamNameDim: {
    color: 'rgba(255,255,255,0.55)',
  },
  gameStatsTeamScore: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  gameStatsTeamScoreDim: {
    color: 'rgba(255,255,255,0.55)',
  },
  gameStatsKiyanBlock: {
    backgroundColor: 'rgba(255,111,60,0.12)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,111,60,0.4)',
    borderRadius: 12,
    padding: 10,
    gap: 3,
  },
  gameStatsKiyanLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#FF6F3C',
  },
  gameStatsKiyanLine: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: -0.1,
  },
  gameStatsKiyanSplits: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: -0.1,
    marginTop: 2,
  },
  gameStatsLeadersBlock: {
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 10,
  },
  gameStatsLeaderName: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    color: 'rgba(255,255,255,0.55)',
    textTransform: 'uppercase',
  },
  gameStatsLeaderLine: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: -0.1,
  },
  gameStatsTable: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  gameStatsTableHeader: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 8,
  },
  gameStatsTableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 10,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.07)',
  },
  gameStatsTableCell: {
    flex: 1,
    fontSize: 12,
    color: '#FFF',
    fontWeight: '600',
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  gameStatsTableHead: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: 'rgba(255,255,255,0.55)',
    textTransform: 'uppercase',
  },
  gameStatsTableLabel: {
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.4,
  },
  eventPreviewCard: { flexDirection: 'row', borderRadius: 20, overflow: 'hidden', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.15)', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12 },
  eventPreviewFlyer: { width: 110, height: 139, borderRadius: 12, margin: 8 },
  eventPreviewInfo: { flex: 1, paddingVertical: 12, paddingRight: 12, justifyContent: 'flex-end', gap: 3 },
  eventPreviewTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  eventPreviewVenue: { fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  eventPreviewMeta: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  eventPreviewActions: { flexDirection: 'row', alignItems: 'stretch', gap: 8, marginTop: 3 },
  eventPreviewRsvp: { flex: 1, backgroundColor: '#fff', borderRadius: 14, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  eventPreviewRsvpText: { fontSize: 14, fontWeight: '700', color: '#000' },
  mapTopFade: { position: 'absolute', top: 0, left: 0, right: 0, height: 120, zIndex: 10 },
  weatherPill: { position: 'absolute', left: 16, zIndex: 20, flexDirection: 'row', alignItems: 'center', borderRadius: 20, overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 6, gap: 2 },
  weatherIcon: { width: 28, height: 28 },
  weatherTemp: { fontSize: 17, fontWeight: '700', color: '#fff' },
});
