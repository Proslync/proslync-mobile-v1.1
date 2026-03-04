import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStableRouter } from '@/hooks/use-stable-router';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useDebounce } from '@/hooks';
import {
  useAdminEvents,
  useUpdateEventStatus,
  useAdminDeleteEvent,
} from '@/hooks/use-admin';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import type { AdminEvent } from '@/lib/api/admin';

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'published', label: 'Published' },
  { key: 'active', label: 'Active' },
  { key: 'finished', label: 'Finished' },
  { key: 'cancelled', label: 'Cancelled' },
];

const EVENT_STATUS_OPTIONS = ['draft', 'published', 'active', 'finished', 'cancelled'];

const STATUS_COLORS: Record<string, string> = {
  draft: 'rgba(255,255,255,0.15)',
  published: 'rgba(76,175,80,0.2)',
  active: 'rgba(33,150,243,0.2)',
  finished: 'rgba(158,158,158,0.2)',
  cancelled: 'rgba(239,68,68,0.2)',
};

function EventRow({
  event,
  onPress,
  colors,
}: {
  event: AdminEvent;
  onPress: () => void;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  const imageUrl = event.flyer?.url || event.imageUrl;
  const ownerName =
    event.owner?.userName ||
    [event.owner?.firstName, event.owner?.lastName].filter(Boolean).join(' ') ||
    `ID:${event.ownerId}`;
  const dateStr = event.startDate
    ? new Date(event.startDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  return (
    <TouchableOpacity style={[styles.row, { borderBottomColor: colors.border }]} onPress={onPress} activeOpacity={0.7}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.eventImage} />
      ) : (
        <View style={[styles.eventImage, { backgroundColor: colors.cardElevated, justifyContent: 'center', alignItems: 'center' }]}>
          <Ionicons name="calendar" size={20} color={colors.textTertiary} />
        </View>
      )}
      <View style={styles.rowContent}>
        <Text style={[styles.eventName, { color: colors.text }]} numberOfLines={1}>
          {event.name}
        </Text>
        <Text style={[styles.eventMeta, { color: colors.textSecondary }]} numberOfLines={1}>
          {ownerName} {dateStr ? `\u2022 ${dateStr}` : ''}
        </Text>
        {event.venue?.name && (
          <Text style={[styles.eventVenue, { color: colors.textTertiary }]} numberOfLines={1}>
            {event.venue.name}
          </Text>
        )}
      </View>
      <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[event.status] || 'rgba(255,255,255,0.1)' }]}>
        <Text style={[styles.statusText, { color: colors.text }]}>{event.status}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function AdminEventsScreen() {
  const insets = useSafeAreaInsets();
  const router = useStableRouter();
  const { colors, isDark } = useAppTheme();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useAdminEvents({
    search: debouncedSearch || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    page,
    limit: 30,
  });

  const updateStatus = useUpdateEventStatus();
  const deleteEvent = useAdminDeleteEvent();

  const showActions = useCallback(
    (event: AdminEvent) => {
      Alert.alert(event.name, `Status: ${event.status}`, [
        {
          text: 'Change Status',
          onPress: () => {
            Alert.alert(
              'Change Status',
              `Current: ${event.status}`,
              [
                ...EVENT_STATUS_OPTIONS.filter((s) => s !== event.status).map((status) => ({
                  text: status.charAt(0).toUpperCase() + status.slice(1),
                  onPress: () => updateStatus.mutate({ eventId: event.id, status }),
                })),
                { text: 'Cancel', style: 'cancel' as const },
              ],
            );
          },
        },
        {
          text: 'Delete Event',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Delete Event', `Are you sure you want to delete "${event.name}"?`, [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => deleteEvent.mutate(event.id),
              },
            ]);
          },
        },
        {
          text: 'View Event',
          onPress: () => router.push({ pathname: '/event/[id]', params: { id: String(event.id) } }),
        },
        { text: 'Cancel', style: 'cancel' },
      ]);
    },
    [updateStatus, deleteEvent, router],
  );

  const events = data?.events ?? [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {isDark && <DarkGradientBg />}

      <Animated.View
        entering={FadeIn.duration(400)}
        style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Events</Text>
        <View style={styles.backBtn}>
          {data && (
            <Text style={[styles.countBadge, { color: colors.textSecondary }]}>{data.total}</Text>
          )}
        </View>
      </Animated.View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
          <Ionicons name="search" size={18} color={colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search events..."
            placeholderTextColor={colors.textTertiary}
            value={search}
            onChangeText={(t) => { setSearch(t); setPage(1); }}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {STATUS_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, statusFilter === f.key && styles.filterChipActive]}
            onPress={() => { setStatusFilter(f.key); setPage(1); }}
          >
            <Text style={[styles.filterText, statusFilter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.text} />
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <EventRow event={item} onPress={() => showActions(item)} colors={colors} />
          )}
          contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No events found</Text>
            </View>
          }
          ListFooterComponent={
            data && data.totalPages > page ? (
              <TouchableOpacity style={styles.loadMore} onPress={() => setPage((p) => p + 1)}>
                <Text style={[styles.loadMoreText, { color: colors.text }]}>Load More</Text>
              </TouchableOpacity>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontFamily: 'Lato_700Bold' },
  countBadge: { fontSize: 13, fontFamily: 'Lato_400Regular' },
  searchContainer: { paddingHorizontal: 16, paddingVertical: 10 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: 'Lato_400Regular' },
  filterRow: { paddingHorizontal: 16, paddingBottom: 10, gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  filterChipActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  filterText: { fontSize: 13, fontFamily: 'Lato_400Regular', color: 'rgba(255,255,255,0.6)' },
  filterTextActive: { color: '#fff', fontFamily: 'Lato_700Bold' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  eventImage: { width: 52, height: 52, borderRadius: 10 },
  rowContent: { flex: 1 },
  eventName: { fontSize: 14, fontFamily: 'Lato_700Bold' },
  eventMeta: { fontSize: 12, fontFamily: 'Lato_400Regular', marginTop: 2 },
  eventVenue: { fontSize: 11, fontFamily: 'Lato_400Regular', marginTop: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 11, fontFamily: 'Lato_700Bold', textTransform: 'capitalize' },
  emptyText: { fontSize: 14, fontFamily: 'Lato_400Regular' },
  loadMore: { alignItems: 'center', paddingVertical: 16 },
  loadMoreText: { fontSize: 14, fontFamily: 'Lato_700Bold' },
});
