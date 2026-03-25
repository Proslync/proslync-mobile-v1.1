import * as React from 'react';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { ConfirmSheet } from '@/components/ui/confirm-sheet';
import { useStableRouter } from '@/hooks/use-stable-router';
import { GlassSurface } from '@/components/glass/glass-surface';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import { useEvent, useEventMarketingStats, usePublishEvent, useDeleteEvent, useEventPermissions } from '@/hooks';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { EventStatus } from '@/lib/types/events.types';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Linking,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Mapbox, { MapView, Camera, MarkerView } from '@rnmapbox/maps';

const isExpoGo = Constants.appOwnership === 'expo';
const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
if (MAPBOX_TOKEN && !isExpoGo) {
  Mapbox.setAccessToken(MAPBOX_TOKEN);
}
const DARK_STYLE_URL = 'mapbox://styles/mapbox/dark-v11';

const STATS_CONFIG = [
  { key: 'totalRSVPs', label: 'Total RSVPs', icon: 'people-outline' as const },
  { key: 'eventLinkViews', label: 'Page Views', icon: 'eye-outline' as const },
  { key: 'uniqueVisitors', label: 'Unique Visitors', icon: 'person-outline' as const },
  { key: 'conversionRate', label: 'Conversion Rate', icon: 'trending-up-outline' as const },
] as const;

export default function OverviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useStableRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  const eventId = id ? Number(id) : undefined;
  const { data: event, refetch: refetchEvent } = useEvent(eventId);
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useEventMarketingStats(eventId);
  const { refreshControl } = useRefreshControl({
    onRefresh: async () => {
      await Promise.all([refetchEvent(), refetchStats()]);
    },
  });
  const publishEvent = usePublishEvent();
  const deleteEvent = useDeleteEvent();
  const { canEditEvents } = useEventPermissions(eventId);

  const handleEdit = () => {
    router.push({ pathname: '/edit-event', params: { id: id! } });
  };

  const handleShare = async () => {
    const url = `status://event/${id}`;
    await Share.share({
      message: `Check out ${event?.name || 'this event'} on Status!`,
      url,
    });
  };

  const [showPublishConfirm, setShowPublishConfirm] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  const handlePublish = () => {
    if (!eventId) return;
    setShowPublishConfirm(true);
  };

  const handleDelete = () => {
    if (!eventId) return;
    setShowDeleteConfirm(true);
  };

  const formatStatValue = (key: string, value: number): string => {
    if (key === 'conversionRate') return `${value}%`;
    return value.toLocaleString();
  };

  const isDraft = event?.status === EventStatus.DRAFT;
  const isPastEvent = event?.status === EventStatus.FINISHED || event?.status === EventStatus.CANCELLED;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {isDark && <DarkGradientBg />}

      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}
      >
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Overview</Text>
        <View style={styles.headerButton} />
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
      >
        {/* Stats Section */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Statistics</Text>

        {statsLoading ? (
          <View style={styles.statsLoading}>
            <ActivityIndicator size="small" color={colors.text} />
          </View>
        ) : (
          <View style={styles.statsGrid}>
            {STATS_CONFIG.map((stat, index) => {
              const value = stats?.[stat.key] ?? 0;
              return (
                <Animated.View
                  key={stat.key}
                  entering={FadeInDown.delay(index * 60).duration(300)}
                  style={styles.statItem}
                >
                  <GlassSurface fill="subtle" border="subtle" cornerRadius="lg" style={styles.statCard}>
                    <View style={styles.statHeader}>
                      <Ionicons name={stat.icon} size={18} color={colors.textSecondary} />
                      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                        {stat.label}
                      </Text>
                    </View>
                    <Text style={[styles.statValue, { color: colors.text }]}>
                      {formatStatValue(stat.key, value)}
                    </Text>
                  </GlassSurface>
                </Animated.View>
              );
            })}
          </View>
        )}

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>

        <Animated.View entering={FadeInDown.delay(250).duration(300)} style={styles.actions}>
          {!isPastEvent && canEditEvents() && (
            <TouchableOpacity activeOpacity={0.7} onPress={handleEdit}>
              <GlassSurface fill="subtle" border="subtle" cornerRadius="lg" style={styles.actionRow}>
                <Ionicons name="create-outline" size={20} color={colors.text} />
                <Text style={[styles.actionLabel, { color: colors.text }]}>Edit Event</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
              </GlassSurface>
            </TouchableOpacity>
          )}

          <TouchableOpacity activeOpacity={0.7} onPress={handleShare}>
            <GlassSurface fill="subtle" border="subtle" cornerRadius="lg" style={styles.actionRow}>
              <Ionicons name="share-outline" size={20} color={colors.text} />
              <Text style={[styles.actionLabel, { color: colors.text }]}>Share Event</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </GlassSurface>
          </TouchableOpacity>

          {isDraft && canEditEvents() && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handlePublish}
              disabled={publishEvent.isPending}
            >
              <GlassSurface fill="subtle" border="subtle" cornerRadius="lg" style={styles.actionRow}>
                <Ionicons name="rocket-outline" size={20} color={colors.text} />
                <Text style={[styles.actionLabel, { color: colors.text }]}>
                  {publishEvent.isPending ? 'Publishing...' : 'Publish Event'}
                </Text>
                {publishEvent.isPending ? (
                  <ActivityIndicator size="small" color={colors.text} />
                ) : (
                  <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                )}
              </GlassSurface>
            </TouchableOpacity>
          )}

          {canEditEvents() && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleDelete}
              disabled={deleteEvent.isPending}
            >
              <GlassSurface fill="subtle" border="subtle" cornerRadius="lg" style={styles.actionRow}>
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
                <Text style={[styles.actionLabel, { color: '#ef4444' }]}>
                  {deleteEvent.isPending ? 'Deleting...' : 'Delete Event'}
                </Text>
                {deleteEvent.isPending ? (
                  <ActivityIndicator size="small" color="#ef4444" />
                ) : (
                  <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                )}
              </GlassSurface>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Venue Map */}
        {event?.venue?.latitude && event?.venue?.longitude && !isExpoGo && MAPBOX_TOKEN && (
          <Animated.View entering={FadeInDown.delay(350).duration(300)}>
            <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>Venue</Text>
            {event.venue.name && (
              <Text style={[styles.venueLabel, { color: colors.textSecondary }]}>{event.venue.name}</Text>
            )}
            {event.venue.address && (
              <Text style={[styles.venueAddress, { color: colors.textTertiary }]}>{event.venue.address}</Text>
            )}
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => {
                const lat = Number(event.venue!.latitude);
                const lng = Number(event.venue!.longitude);
                const coords = `${lat},${lng}`;
                const label = encodeURIComponent(event.venue!.name || event.name || 'Event');
                const url = Platform.select({
                  ios: `maps:0,0?q=${label}@${coords}`,
                  default: `geo:${coords}?q=${coords}(${label})`,
                });
                if (url) Linking.openURL(url);
              }}
            >
              <GlassSurface fill="subtle" border="subtle" cornerRadius="lg" style={styles.mapContainer}>
                <MapView
                  style={styles.map}
                  styleURL={DARK_STYLE_URL}
                  logoEnabled={false}
                  attributionEnabled={false}
                  compassEnabled={false}
                  scaleBarEnabled={false}
                  scrollEnabled={false}
                  zoomEnabled={false}
                  pitchEnabled={false}
                  rotateEnabled={false}
                >
                  <Camera
                    defaultSettings={{
                      centerCoordinate: [Number(event.venue.longitude), Number(event.venue.latitude)],
                      zoomLevel: 14,
                    }}
                  />
                  <MarkerView coordinate={[Number(event.venue.longitude), Number(event.venue.latitude)]}>
                    <View style={[styles.marker, { backgroundColor: isDark ? undefined : 'rgba(255,255,255,0.2)' }]}>
                      {isDark && <GlassView {...liquidGlass.fillMedium} borderRadius={18} style={StyleSheet.absoluteFillObject} />}
                      <Ionicons name="location" size={28} color="#fff" />
                    </View>
                  </MarkerView>
                </MapView>
              </GlassSurface>
            </TouchableOpacity>
            <Text style={[styles.mapHint, { color: colors.textTertiary }]}>Tap to open in Maps</Text>
          </Animated.View>
        )}
      </ScrollView>

      <ConfirmSheet
        visible={showPublishConfirm}
        onClose={() => setShowPublishConfirm(false)}
        onConfirm={() => {
          publishEvent.mutate(eventId!);
          setShowPublishConfirm(false);
        }}
        title="Publish Event"
        message="Are you sure you want to publish this event?"
        confirmLabel="Publish"
        icon="rocket-outline"
      />

      <ConfirmSheet
        visible={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          deleteEvent.mutate(eventId!, {
            onSuccess: () => {
              setShowDeleteConfirm(false);
              router.dismissAll();
              router.replace('/my-events');
            },
          });
        }}
        title="Delete Event"
        message={`Are you sure you want to delete "${event?.name || 'this event'}"? This action cannot be undone.`}
        confirmLabel="Delete"
        destructive
        isLoading={deleteEvent.isPending}
        icon="trash-outline"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Lato_700Bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    marginBottom: 12,
    marginTop: 8,
  },
  statsLoading: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statItem: {
    width: '47%',
    flexGrow: 1,
  },
  statCard: {
    padding: 16,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  statLabel: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
  },
  statValue: {
    fontSize: 28,
    fontFamily: 'Lato_700Bold',
  },
  actions: {
    gap: 10,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  actionLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
  },
  venueLabel: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
    marginBottom: 2,
  },
  venueAddress: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    marginBottom: 12,
  },
  mapContainer: {
    overflow: 'hidden',
  },
  map: {
    height: 200,
    borderRadius: 12,
  },
  marker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapHint: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
    marginTop: 8,
  },
});
