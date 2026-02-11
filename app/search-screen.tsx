import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, FadeInRight } from 'react-native-reanimated';
import {
  useSearch,
  mapPersonToDiscover,
  mapEventToDiscover,
  mapVenueToDiscover,
} from '@/hooks/use-search';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { DiscoverCategory, DiscoverPerson, DiscoverEvent, DiscoverVenue } from '@/lib/types/search.types';

// Category tabs configuration
const CATEGORIES: { key: DiscoverCategory; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'people', label: 'People', icon: 'people-outline' },
  { key: 'events', label: 'Events', icon: 'calendar-outline' },
  { key: 'venues', label: 'Venues', icon: 'location-outline' },
];

// Person Card Component
function PersonCard({
  person,
  index,
  onPress,
  colors,
}: {
  person: DiscoverPerson;
  index: number;
  onPress: () => void;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
      <TouchableOpacity
        style={[styles.personCard, { backgroundColor: colors.cardElevated }]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.personAvatarContainer}>
          {person.avatar ? (
            <Image source={{ uri: person.avatar }} style={styles.personAvatar} />
          ) : (
            <View style={[styles.personAvatar, styles.personAvatarPlaceholder, { backgroundColor: colors.input }]}>
              <Ionicons name="person" size={24} color={colors.textTertiary} />
            </View>
          )}
        </View>
        <View style={styles.personInfo}>
          <View style={styles.personNameRow}>
            <Text style={[styles.personName, { color: colors.text }]} numberOfLines={1}>
              {person.name}
            </Text>
            {person.verified && (
              <Ionicons name="checkmark-circle" size={16} color="#3b82f6" style={{ marginLeft: 4 }} />
            )}
          </View>
          <Text style={[styles.personUsername, { color: colors.textSecondary }]}>@{person.username}</Text>
        </View>
        {person.followers > 0 && (
          <View style={styles.personFollowers}>
            <Text style={[styles.followerCount, { color: colors.text }]}>{formatNumber(person.followers)}</Text>
            <Text style={[styles.followerLabel, { color: colors.textTertiary }]}>followers</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
      </TouchableOpacity>
    </Animated.View>
  );
}

// Event Card Component
function EventCard({
  event,
  index,
  onPress,
  colors,
}: {
  event: DiscoverEvent;
  index: number;
  onPress: () => void;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
      <TouchableOpacity
        style={styles.eventCard}
        onPress={onPress}
        activeOpacity={0.9}
      >
        {event.image ? (
          <Image source={{ uri: event.image }} style={styles.eventImage} />
        ) : (
          <View style={[styles.eventImage, styles.eventImagePlaceholder, { backgroundColor: colors.input }]}>
            <Ionicons name="calendar" size={40} color={colors.textTertiary} />
          </View>
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.eventGradient}
        />
        <View style={styles.eventContent}>
          <Text style={styles.eventTitle} numberOfLines={2}>{event.title}</Text>
          <View style={styles.eventMeta}>
            <View style={styles.eventMetaItem}>
              <Ionicons name="calendar-outline" size={12} color="rgba(255,255,255,0.7)" />
              <Text style={styles.eventMetaText}>{event.date}</Text>
            </View>
            <View style={styles.eventMetaItem}>
              <Ionicons name="location-outline" size={12} color="rgba(255,255,255,0.7)" />
              <Text style={styles.eventMetaText} numberOfLines={1}>{event.location}</Text>
            </View>
          </View>
          <View style={styles.eventFooter}>
            {event.attendees > 0 && (
              <View style={styles.eventMetaItem}>
                <Ionicons name="people-outline" size={12} color="rgba(255,255,255,0.5)" />
                <Text style={[styles.eventMetaText, { color: 'rgba(255,255,255,0.5)' }]}>
                  {formatNumber(event.attendees)} going
                </Text>
              </View>
            )}
            <Text style={styles.eventPrice}>{event.price}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// Venue Card Component
function VenueCard({
  venue,
  index,
  onPress,
  colors,
}: {
  venue: DiscoverVenue;
  index: number;
  onPress: () => void;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
      <TouchableOpacity
        style={[styles.venueCard, { backgroundColor: colors.cardElevated }]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.venueImageContainer}>
          {venue.image ? (
            <Image source={{ uri: venue.image }} style={styles.venueImage} />
          ) : (
            <View style={[styles.venueImage, styles.venueImagePlaceholder, { backgroundColor: colors.input }]}>
              <Ionicons name="business" size={28} color={colors.textTertiary} />
            </View>
          )}
        </View>
        <View style={styles.venueInfo}>
          <Text style={[styles.venueName, { color: colors.text }]} numberOfLines={1}>{venue.name}</Text>
          <View style={styles.venueMetaRow}>
            <Ionicons name="musical-notes-outline" size={12} color={colors.textSecondary} />
            <Text style={[styles.venueMetaText, { color: colors.textSecondary }]}>{venue.type}</Text>
          </View>
          <View style={styles.venueMetaRow}>
            <Ionicons name="location-outline" size={12} color={colors.textTertiary} />
            <Text style={[styles.venueMetaText, { color: colors.textTertiary }]} numberOfLines={1}>
              {venue.location}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
      </TouchableOpacity>
    </Animated.View>
  );
}

// Empty State Component
function EmptyState({
  searchQuery,
  category,
  colors,
}: {
  searchQuery: string;
  category: DiscoverCategory;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  const icons: Record<DiscoverCategory, keyof typeof Ionicons.glyphMap> = {
    people: 'people-outline',
    events: 'calendar-outline',
    venues: 'location-outline',
  };

  return (
    <View style={styles.emptyState}>
      <Ionicons name={icons[category]} size={48} color={colors.textTertiary} />
      <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
        {searchQuery
          ? `No ${category} found for "${searchQuery}"`
          : `Start typing to search for ${category}...`}
      </Text>
    </View>
  );
}

// Helper function for formatting numbers
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useAppTheme();
  const [activeCategory, setActiveCategory] = useState<DiscoverCategory>('people');

  // Use search hook with limits based on active category
  const {
    data: searchData,
    isLoading,
    error,
    refetch,
    searchQuery,
    setSearchQuery,
  } = useSearch({
    eventsLimit: activeCategory === 'events' ? 10 : 3,
    venuesLimit: activeCategory === 'venues' ? 10 : 3,
    peopleLimit: activeCategory === 'people' ? 10 : 3,
  });

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Transform API data to UI format
  const people = useMemo(
    () => searchData?.people.map(mapPersonToDiscover) || [],
    [searchData?.people]
  );

  const events = useMemo(
    () => searchData?.events.map(mapEventToDiscover) || [],
    [searchData?.events]
  );

  const venues = useMemo(
    () => searchData?.venues.map(mapVenueToDiscover) || [],
    [searchData?.venues]
  );

  // Navigation handlers
  const handlePersonPress = useCallback((person: DiscoverPerson) => {
    router.push({
      pathname: '/user/[username]',
      params: { username: person.username, userId: String(person.id) },
    });
  }, [router]);

  const handleEventPress = useCallback((event: DiscoverEvent) => {
    router.push({
      pathname: '/event/[id]',
      params: { id: String(event.id), title: event.title },
    });
  }, [router]);

  const handleVenuePress = useCallback((venue: DiscoverVenue) => {
    // Navigate to map with venue location or venue detail
    router.push({
      pathname: '/(tabs)/search',
      params: { venueName: venue.name },
    });
  }, [router]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Discover</Text>
        <View style={styles.headerSpacer} />
      </Animated.View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.input }]}>
          <Ionicons name="search-outline" size={18} color={colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search people, events, venues..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryTabs}
        >
          {CATEGORIES.map((cat, index) => (
            <Animated.View key={cat.key} entering={FadeInRight.delay(index * 50).duration(200)}>
              <TouchableOpacity
                style={[
                  styles.categoryTab,
                  {
                    backgroundColor: activeCategory === cat.key ? colors.text : colors.input,
                    borderColor: activeCategory === cat.key ? colors.text : colors.border,
                  },
                ]}
                onPress={() => setActiveCategory(cat.key)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={cat.icon}
                  size={16}
                  color={activeCategory === cat.key ? colors.background : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.categoryTabText,
                    { color: activeCategory === cat.key ? colors.background : colors.textSecondary },
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.text}
          />
        }
      >
        {isLoading && !refreshing ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={colors.text} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Searching...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorState}>
            <Ionicons name="cloud-offline-outline" size={48} color={colors.textTertiary} />
            <Text style={[styles.errorText, { color: colors.textSecondary }]}>
              Error loading results. Pull to retry.
            </Text>
          </View>
        ) : (
          <>
            {/* People Tab */}
            {activeCategory === 'people' && (
              <View style={styles.tabContent}>
                {people.length === 0 ? (
                  <EmptyState searchQuery={searchQuery} category="people" colors={colors} />
                ) : (
                  people.map((person, index) => (
                    <PersonCard
                      key={person.id}
                      person={person}
                      index={index}
                      onPress={() => handlePersonPress(person)}
                      colors={colors}
                    />
                  ))
                )}
              </View>
            )}

            {/* Events Tab */}
            {activeCategory === 'events' && (
              <View style={styles.tabContent}>
                {events.length === 0 ? (
                  <EmptyState searchQuery={searchQuery} category="events" colors={colors} />
                ) : (
                  events.map((event, index) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      index={index}
                      onPress={() => handleEventPress(event)}
                      colors={colors}
                    />
                  ))
                )}
              </View>
            )}

            {/* Venues Tab */}
            {activeCategory === 'venues' && (
              <View style={styles.tabContent}>
                {venues.length === 0 ? (
                  <EmptyState searchQuery={searchQuery} category="venues" colors={colors} />
                ) : (
                  venues.map((venue, index) => (
                    <VenueCard
                      key={venue.id}
                      venue={venue}
                      index={index}
                      onPress={() => handleVenuePress(venue)}
                      colors={colors}
                    />
                  ))
                )}
              </View>
            )}
          </>
        )}

        {/* Bottom padding */}
        <View style={{ height: insets.bottom + 20 }} />
      </ScrollView>
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
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Lato_700Bold',
  },
  headerSpacer: {
    width: 40,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
  },
  categoryTabs: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryTabText: {
    fontSize: 14,
    fontFamily: 'Lato_600SemiBold',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  tabContent: {
    gap: 12,
  },
  // Person Card
  personCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  personAvatarContainer: {
    position: 'relative',
  },
  personAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  personAvatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  personInfo: {
    flex: 1,
    minWidth: 0,
  },
  personNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  personName: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
  },
  personUsername: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    marginTop: 2,
  },
  personFollowers: {
    alignItems: 'flex-end',
    marginRight: 4,
  },
  followerCount: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
  },
  followerLabel: {
    fontSize: 10,
    fontFamily: 'Lato_400Regular',
  },
  // Event Card
  eventCard: {
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
  },
  eventImage: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: 'cover',
  },
  eventImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  eventContent: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 14,
  },
  eventTitle: {
    fontSize: 18,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
    marginBottom: 6,
  },
  eventMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  eventMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventMetaText: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.7)',
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  eventPrice: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  // Venue Card
  venueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  venueImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
  },
  venueImage: {
    width: '100%',
    height: '100%',
  },
  venueImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  venueInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  venueName: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    marginBottom: 4,
  },
  venueMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  venueMetaText: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    flex: 1,
  },
  // States
  loadingState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    marginTop: 12,
  },
  errorState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    marginTop: 12,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    marginTop: 12,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
