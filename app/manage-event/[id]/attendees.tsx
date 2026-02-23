import { useState, useCallback } from 'react';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { GlassSurface } from '@/components/glass/glass-surface';
import { useEventAttendees, useDebounce } from '@/hooks';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import type { EventAttendee, EventUserStatus } from '@/lib/types/events.types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const STATUS_FILTERS = [
  { key: 'all', label: 'All', statuses: [] },
  { key: 'confirmed', label: 'Confirmed', statuses: ['confirmed', 'verified'] },
  { key: 'pending', label: 'Pending', statuses: ['pending'] },
  { key: 'requested', label: 'Requested', statuses: ['requested'] },
  { key: 'checked_in', label: 'Checked In', statuses: ['checked_in', 'seated'] },
  { key: 'rejected', label: 'Rejected', statuses: ['rejected', 'cancelled', 'no_show'] },
] as const;

function getStatusColor(status?: EventUserStatus): string {
  switch (status) {
    case 'confirmed':
    case 'verified':
    case 'checked_in':
    case 'seated':
      return '#22c55e';
    case 'requested':
    case 'pending':
      return '#f59e0b';
    case 'rejected':
    case 'cancelled':
    case 'no_show':
      return '#ef4444';
    default:
      return 'rgba(255,255,255,0.4)';
  }
}

function getStatusLabel(status?: EventUserStatus): string {
  switch (status) {
    case 'confirmed': return 'Confirmed';
    case 'verified': return 'Verified';
    case 'checked_in': return 'Checked In';
    case 'seated': return 'Seated';
    case 'requested': return 'Requested';
    case 'pending': return 'Pending';
    case 'rejected': return 'Rejected';
    case 'cancelled': return 'Cancelled';
    case 'no_show': return 'No Show';
    default: return 'Registered';
  }
}

function getInitials(attendee: EventAttendee): string {
  const first = attendee.firstName?.[0] || '';
  const last = attendee.lastName?.[0] || '';
  if (first || last) return `${first}${last}`.toUpperCase();
  if (attendee.guestName) return attendee.guestName[0].toUpperCase();
  return '?';
}

function getDisplayName(attendee: EventAttendee): string {
  if (attendee.firstName || attendee.lastName) {
    return `${attendee.firstName || ''} ${attendee.lastName || ''}`.trim();
  }
  return attendee.guestName || 'Guest';
}

function getSubtext(attendee: EventAttendee): string {
  if (attendee.userName) return `@${attendee.userName}`;
  if (attendee.phoneNumber) return attendee.phoneNumber;
  return '';
}

export default function AttendeesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const debouncedSearch = useDebounce(searchText, 300);

  const eventId = id ? Number(id) : undefined;
  const activeFilterObj = STATUS_FILTERS.find((f) => f.key === activeFilter);
  const statusFilter = activeFilterObj && activeFilterObj.statuses.length > 0
    ? [...activeFilterObj.statuses]
    : undefined;

  const {
    attendees,
    total,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useEventAttendees({
    eventId,
    search: debouncedSearch || undefined,
    status: statusFilter,
  });

  const { refreshControl } = useRefreshControl({
    onRefresh: async () => {
      await refetch();
    },
  });

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderAttendee = useCallback(
    ({ item, index }: { item: EventAttendee; index: number }) => {
      const avatarUri = item.avatarUrl || item.avatar;
      const name = getDisplayName(item);
      const subtext = getSubtext(item);

      return (
        <Animated.View entering={FadeInDown.delay(Math.min(index * 30, 300)).duration(250)}>
          <GlassSurface fill="subtle" border="subtle" cornerRadius="lg" style={styles.attendeeRow}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarFallback, { backgroundColor: colors.backgroundSecondary }]}>
                <Text style={[styles.avatarInitials, { color: colors.text }]}>
                  {getInitials(item)}
                </Text>
              </View>
            )}
            <View style={styles.attendeeInfo}>
              <Text style={[styles.attendeeName, { color: colors.text }]} numberOfLines={1}>
                {name}
              </Text>
              {subtext ? (
                <Text style={[styles.attendeeSubtext, { color: colors.textTertiary }]} numberOfLines={1}>
                  {subtext}
                </Text>
              ) : null}
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
            </View>
          </GlassSurface>
        </Animated.View>
      );
    },
    [colors],
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
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Attendees</Text>
          {!isLoading && (
            <View style={[styles.countBadge, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
              <Text style={[styles.countText, { color: colors.text }]}>{total}</Text>
            </View>
          )}
        </View>
        <View style={styles.headerButton} />
      </Animated.View>

      {/* Search */}
      <View style={styles.searchSection}>
        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.input, borderColor: colors.inputBorder },
          ]}
        >
          <Ionicons name="search" size={18} color={colors.placeholder} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search attendees..."
            placeholderTextColor={colors.placeholder}
            value={searchText}
            onChangeText={setSearchText}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={18} color={colors.placeholder} />
            </TouchableOpacity>
          )}
        </View>

        {/* Status Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
          style={styles.filtersRow}
        >
          {STATUS_FILTERS.map((filter) => {
            const isActive = activeFilter === filter.key;
            return (
              <TouchableOpacity
                key={filter.key}
                onPress={() => setActiveFilter(filter.key)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: isActive
                        ? 'rgba(255,255,255,0.2)'
                        : 'rgba(255,255,255,0.07)',
                      borderColor: isActive
                        ? 'rgba(255,255,255,0.3)'
                        : 'rgba(255,255,255,0.1)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterLabel,
                      { color: colors.text, opacity: isActive ? 1 : 0.6 },
                    ]}
                  >
                    {filter.label}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Attendees List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.text} />
        </View>
      ) : attendees.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={48} color={colors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No attendees</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
            {searchText || activeFilter !== 'all'
              ? 'No attendees match your filters'
              : 'No one has registered for this event yet'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={attendees}
          renderItem={renderAttendee}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={colors.text} />
              </View>
            ) : null
          }
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
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Lato_700Bold',
  },
  countBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countText: {
    fontSize: 12,
    fontFamily: 'Lato_700Bold',
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    padding: 0,
  },
  filtersRow: {
    marginTop: 10,
    marginBottom: 4,
  },
  filtersContent: {
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterLabel: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Lato_700Bold',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    marginTop: 6,
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
    gap: 8,
  },
  attendeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
  },
  attendeeInfo: {
    flex: 1,
  },
  attendeeName: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
  },
  attendeeSubtext: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
    textTransform: 'uppercase',
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});
