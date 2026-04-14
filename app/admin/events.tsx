import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  ScrollView,
  Pressable,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStableRouter } from '@/hooks/use-stable-router';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useDebounce } from '@/hooks';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import { LiquidGlassView, isLiquidGlassSupported } from '@callstack/liquid-glass';
import { LinearGradient } from 'expo-linear-gradient';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import {
  useAdminEvents,
  useUpdateEventStatus,
  useAdminDeleteEvent,
} from '@/hooks/use-admin';

import { ActionSheet, type ActionSheetOption } from '@/components/ui/action-sheet';
import { ConfirmSheet } from '@/components/ui/confirm-sheet';
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
        <View style={[styles.eventImage, { overflow: 'hidden' as const, justifyContent: 'center', alignItems: 'center' }]}>
          <GlassView {...liquidGlass.fillFaint} borderRadius={10} style={StyleSheet.absoluteFillObject} />
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
  const { colors } = useAppTheme();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, refetch } = useAdminEvents({
    search: debouncedSearch || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    page,
    limit: 30,
  });

  const { refreshControl } = useRefreshControl({ onRefresh: async () => { await refetch(); } });

  const updateStatus = useUpdateEventStatus();
  const deleteEvent = useAdminDeleteEvent();

  const [actionEvent, setActionEvent] = useState<AdminEvent | null>(null);
  const [statusEvent, setStatusEvent] = useState<AdminEvent | null>(null);
  const [deleteConfirmEvent, setDeleteConfirmEvent] = useState<AdminEvent | null>(null);

  const showActions = useCallback(
    (event: AdminEvent) => {
      setActionEvent(event);
    },
    [],
  );

  const getEventActionItems = (e: AdminEvent): ActionSheetOption[] => [
    {
      label: 'Change Status',
      icon: 'swap-horizontal-outline',
      onPress: () => { setActionEvent(null); setStatusEvent(e); },
    },
    {
      label: 'Delete Event',
      icon: 'trash-outline',
      destructive: true,
      onPress: () => { setActionEvent(null); setDeleteConfirmEvent(e); },
    },
    {
      label: 'View Event',
      icon: 'eye-outline',
      onPress: () => { setActionEvent(null); router.push({ pathname: '/event/[id]', params: { id: String(e.id) } }); },
    },
  ];

  const getStatusItems = (e: AdminEvent): ActionSheetOption[] =>
    EVENT_STATUS_OPTIONS.filter((s) => s !== e.status).map((status) => ({
      label: status.charAt(0).toUpperCase() + status.slice(1),
      onPress: () => { setStatusEvent(null); updateStatus.mutate({ eventId: e.id, status }); },
    }));

  const events = data?.events ?? [];

  return (
    <View style={[styles.container, { backgroundColor: '#f2f2f2' }]}>

      {/* Top row */}
      {isSearchActive ? (
        <View style={[styles.pillRow, { paddingTop: insets.top + 16, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }]}>
          <View style={styles.searchBarInline}>
            <Ionicons name="search" size={18} color="rgba(0,0,0,0.4)" />
            <TextInput
              style={styles.searchInputInline}
              value={search}
              onChangeText={(t) => { setSearch(t); setPage(1); }}
              placeholder="Search events..."
              placeholderTextColor="rgba(0,0,0,0.35)"
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={18} color="rgba(0,0,0,0.3)" />
              </TouchableOpacity>
            )}
          </View>
          <Pressable style={styles.pillIcon} onPress={() => { setIsSearchActive(false); setSearch(''); }}>
            <Ionicons name="close" size={20} color="#000" />
          </Pressable>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.pillRow, { paddingTop: insets.top + 16 }]}
          style={styles.pillScroll}
        >
          <Pressable style={styles.pillIcon} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color="#000" />
          </Pressable>
          <Pressable style={styles.pillIcon} onPress={() => setIsSearchActive(true)}>
            <Ionicons name="search" size={18} color="#000" />
          </Pressable>
          {STATUS_FILTERS.map((f) => {
            const isActive = statusFilter === f.key;
            return (
              <Pressable
                key={f.key}
                style={styles.filterPill}
                onPress={() => { setStatusFilter(f.key); setPage(1); }}
              >
                {isLiquidGlassSupported ? (
                  <LiquidGlassView effect="regular" style={StyleSheet.absoluteFill} />
                ) : (
                  <View style={styles.filterPillGlass} pointerEvents="none">
                    <GlassView {...liquidGlass.surface} tintColor={isActive ? 'rgba(0,0,0,0.12)' : 'transparent'} borderRadius={19} style={StyleSheet.absoluteFill} />
                  </View>
                )}
                <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <LinearGradient colors={['#f2f2f2', 'rgba(242,242,242,0)']} style={styles.topFade} pointerEvents="none" />

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
          refreshControl={refreshControl}
          contentContainerStyle={{ paddingTop: insets.top + 70, paddingBottom: insets.bottom + 40 }}
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

      <ActionSheet
        visible={!!actionEvent}
        onClose={() => setActionEvent(null)}
        options={actionEvent ? getEventActionItems(actionEvent) : []}
      />

      <ActionSheet
        visible={!!statusEvent}
        onClose={() => setStatusEvent(null)}
        options={statusEvent ? getStatusItems(statusEvent) : []}
      />

      <ConfirmSheet
        visible={!!deleteConfirmEvent}
        onClose={() => setDeleteConfirmEvent(null)}
        onConfirm={() => { if (deleteConfirmEvent) { deleteEvent.mutate(deleteConfirmEvent.id); setDeleteConfirmEvent(null); } }}
        title="Delete Event"
        message={`Are you sure you want to delete "${deleteConfirmEvent?.name}"?`}
        confirmLabel="Delete"
        destructive
        icon="trash-outline"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  pillRow: { flexDirection: 'row', paddingHorizontal: 12, gap: 8, alignItems: 'center', paddingBottom: 8 },
  pillScroll: { flexGrow: 0, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  pillIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.06)', justifyContent: 'center', alignItems: 'center' },
  filterPill: { height: 38, borderRadius: 19, paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  filterPillGlass: { ...StyleSheet.absoluteFillObject, overflow: 'hidden', borderRadius: 19 },
  topFade: { position: 'absolute', top: 0, left: 0, right: 0, height: 160, zIndex: 9 },
  filterPillText: { fontSize: 14, fontWeight: '500', color: 'rgba(0,0,0,0.5)' },
  filterPillTextActive: { color: 'rgba(0,0,0,0.8)' },
  searchBarInline: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, height: 38, borderRadius: 19, backgroundColor: '#fff', paddingHorizontal: 14, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  searchInputInline: { flex: 1, fontSize: 15, fontFamily: 'Lato_400Regular', color: '#000', padding: 0 },
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
  },
  filterText: { fontSize: 13, fontFamily: 'Lato_400Regular', color: 'rgba(0,0,0,0.5)' },
  filterTextActive: { color: 'rgba(0,0,0,0.8)', fontFamily: 'Lato_700Bold' },
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
