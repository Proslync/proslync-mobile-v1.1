import { useState, useCallback, useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { GlassSurface } from '@/components/glass/glass-surface';
import { ContactTagSheet } from '@/components/dashboard/contact-tag-sheet';
import { TAG_COLORS } from '@/components/check-ins/utils';
import { useDebounce, useMyVenues, useVenueContactTags } from '@/hooks';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { useAuth } from '@/lib/providers/auth-provider';
import { eventsApi } from '@/lib/api/events';
import type { OwnerContact, OwnerContactsResponse } from '@/lib/types/events.types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function getInitials(contact: OwnerContact): string {
  const first = contact.firstName?.[0] || '';
  const last = contact.lastName?.[0] || '';
  if (first || last) return `${first}${last}`.toUpperCase();
  return '?';
}

function getDisplayName(contact: OwnerContact): string {
  if (contact.firstName || contact.lastName) {
    return `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
  }
  return 'Guest';
}

function getSubtext(contact: OwnerContact): string {
  if (contact.userName) return `@${contact.userName}`;
  if (contact.phoneNumber) return contact.phoneNumber;
  return '';
}

function sourceLabel(contact: OwnerContact): string {
  if (contact.isGuest) return 'Guest';
  if (contact.source === 'rsvp') return 'RSVP';
  if (contact.source === 'ticket_purchase') return 'Ticket';
  return '';
}

const PAGE_SIZE = 20;

export default function ContactsListScreen() {
  const router = useRouter();
  const { organizationId: orgIdParam } = useLocalSearchParams<{ organizationId?: string }>();
  const orgId = orgIdParam ? parseInt(orgIdParam, 10) : undefined;
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const { user } = useAuth();

  const [searchText, setSearchText] = useState('');
  const [selectedContact, setSelectedContact] = useState<OwnerContact | null>(null);
  const debouncedSearch = useDebounce(searchText, 300);
  const { data: venues } = useMyVenues();
  const venueId = venues?.[0]?.id;
  const { data: tagRecords } = useVenueContactTags(venueId);

  // Build a quick lookup: userId → tags[]
  const tagsByUserId = useMemo(() => {
    const map = new Map<number, string[]>();
    if (tagRecords) {
      for (const r of tagRecords) {
        map.set(r.userId, r.tags);
      }
    }
    return map;
  }, [tagRecords]);

  const query = useInfiniteQuery<OwnerContactsResponse, Error>({
    queryKey: ['owner-contacts', debouncedSearch, orgId],
    queryFn: async ({ pageParam }) => {
      return eventsApi.getOwnerContacts({
        page: pageParam as number,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
        organizationId: orgId,
      });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.hasNext && lastPage.page) return lastPage.page + 1;
      return undefined;
    },
    staleTime: 1000 * 60 * 2,
  });

  const contacts: OwnerContact[] = query.data?.pages.flatMap((page) => page.contacts) ?? [];
  const total = query.data?.pages[0]?.total ?? 0;
  const isLoading = query.isLoading;
  const isFetchingNextPage = query.isFetchingNextPage;
  const hasNextPage = query.hasNextPage;
  const fetchNextPage = query.fetchNextPage;
  const refetch = query.refetch;

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

  const renderContact = useCallback(
    ({ item, index }: { item: OwnerContact; index: number }) => {
      const name = getDisplayName(item);
      const subtext = getSubtext(item);
      const userTags = item.userId ? tagsByUserId.get(item.userId) ?? [] : [];

      return (
        <TouchableOpacity activeOpacity={0.7} onPress={() => setSelectedContact(item)}>
        <Animated.View entering={FadeInDown.delay(Math.min(index * 30, 300)).duration(250)}>
          <GlassSurface fill="subtle" border="subtle" cornerRadius="lg" style={styles.contactRow}>
            {item.avatar ? (
              <Image source={{ uri: item.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarFallback, { backgroundColor: isDark ? undefined : colors.backgroundSecondary, overflow: 'hidden' as const }]}>
                {isDark && <GlassView {...liquidGlass.fillFaint} borderRadius={20} style={StyleSheet.absoluteFillObject} />}
                <Text style={[styles.avatarInitials, { color: colors.text }]}>
                  {getInitials(item)}
                </Text>
              </View>
            )}
            <View style={styles.contactInfo}>
              <Text style={[styles.contactName, { color: colors.text }]} numberOfLines={1}>
                {name}
              </Text>
              {subtext ? (
                <Text style={[styles.contactSubtext, { color: colors.textTertiary }]} numberOfLines={1}>
                  {subtext}
                </Text>
              ) : null}
            </View>
            {userTags.length > 0 ? (
              <View style={styles.tagsRow}>
                {userTags.slice(0, 2).map((tag) => {
                  const color = TAG_COLORS[tag] || '#6b7280';
                  return (
                    <View key={tag} style={[styles.tagBadge, { backgroundColor: `${color}25` }]}>
                      <Text style={[styles.tagBadgeText, { color }]}>
                        {tag.replace(/_/g, ' ').toUpperCase()}
                      </Text>
                    </View>
                  );
                })}
                {userTags.length > 2 && (
                  <View style={[styles.tagBadge, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                    <Text style={[styles.tagBadgeText, { color: 'rgba(255,255,255,0.5)' }]}>
                      +{userTags.length - 2}
                    </Text>
                  </View>
                )}
              </View>
            ) : item.eventCount > 1 ? (
              <View style={[styles.eventCountBadge, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
                <Text style={[styles.eventCountText, { color: colors.text }]}>
                  {item.eventCount} events
                </Text>
              </View>
            ) : null}
          </GlassSurface>
        </Animated.View>
        </TouchableOpacity>
      );
    },
    [colors, isDark, tagsByUserId],
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>My List</Text>
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
            { overflow: 'hidden', borderColor: colors.inputBorder },
          ]}
        >
          <GlassView {...liquidGlass.fill} borderRadius={12} style={StyleSheet.absoluteFillObject} />
          <Ionicons name="search" size={18} color={colors.placeholder} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search contacts..."
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
      </View>

      {/* Contacts List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.text} />
        </View>
      ) : contacts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={48} color={colors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No contacts</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
            {searchText
              ? 'No contacts match your search'
              : 'People who RSVP or buy tickets to your events will appear here'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={contacts}
          renderItem={renderContact}
          keyExtractor={(item) => String(item.id)}
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

      <ContactTagSheet
        contact={selectedContact}
        venueId={venueId}
        onDismiss={() => setSelectedContact(null)}
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
    paddingBottom: 8,
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
  contactRow: {
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
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
  },
  contactSubtext: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    marginTop: 1,
  },
  eventCountBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  eventCountText: {
    fontSize: 11,
    fontFamily: 'Lato_700Bold',
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 4,
    flexShrink: 1,
    maxWidth: '45%',
    justifyContent: 'flex-end',
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tagBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});
