import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import { useStableRouter } from '@/hooks/use-stable-router';
import { useMyEvents } from '@/hooks/use-events-query';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { EventStatus } from '@/lib/types/events.types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function getStatusColor(status: string): string {
  switch (status) {
    case 'draft': return '#f59e0b';
    case 'published': return '#3b82f6';
    case 'active': return '#22c55e';
    case 'finished': return 'rgba(255,255,255,0.4)';
    case 'cancelled': return '#ef4444';
    default: return 'rgba(255,255,255,0.4)';
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'draft': return 'Draft';
    case 'published': return 'Published';
    case 'active': return 'Live';
    case 'finished': return 'Ended';
    case 'cancelled': return 'Cancelled';
    default: return status;
  }
}

export default function VenueEventsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const venueId = id ? Number(id) : undefined;
  const router = useStableRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  const { data: allEvents = [], isLoading, refetch } = useMyEvents();
  const { refreshControl } = useRefreshControl({ onRefresh: refetch });

  const venueEvents = React.useMemo(
    () => allEvents.filter((e) => e.venue?.id === venueId),
    [allEvents, venueId],
  );

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Venue Events</Text>
        <View style={styles.headerButton} />
      </Animated.View>

      {isLoading ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Loading events...</Text>
        </View>
      ) : venueEvents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={56} color={colors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Events</Text>
          <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
            No events linked to this venue yet
          </Text>
        </View>
      ) : (
        <FlatList
          data={venueEvents}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
          renderItem={({ item, index }) => {
            const dateStr = new Date(item.startDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            });

            return (
              <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
                <TouchableOpacity
                  style={styles.eventCard}
                  activeOpacity={0.7}
                  onPress={() => router.push(`/manage-event/${item.id}`)}
                >
                  <GlassView {...liquidGlass.surface} borderRadius={12} style={StyleSheet.absoluteFillObject} />
                  {item.imageUrl ? (
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={[styles.eventImage, { backgroundColor: colors.backgroundSecondary }]}
                    />
                  ) : (
                    <View style={[styles.eventImage, styles.eventImagePlaceholder, { backgroundColor: colors.backgroundSecondary }]}>
                      <Ionicons name="calendar" size={24} color={colors.textTertiary} />
                    </View>
                  )}
                  <View style={styles.eventContent}>
                    <Text style={[styles.eventName, { color: colors.text }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={[styles.eventDate, { color: colors.textSecondary }]}>
                      {dateStr}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                      <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                </TouchableOpacity>
              </Animated.View>
            );
          }}
        />
      )}
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Lato_700Bold',
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    paddingRight: 12,
  },
  eventImage: {
    width: 72,
    height: 72,
  },
  eventImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventContent: {
    flex: 1,
    padding: 12,
    gap: 3,
  },
  eventName: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
  },
  eventDate: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
    textTransform: 'uppercase',
  },
});
