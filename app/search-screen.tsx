import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { eventsApi } from '@/lib/api/events';
import { useChat } from '@/lib/providers/chat-provider';
import type { Event, Venue } from '@/lib/types/events.types';

type SearchTab = 'all' | 'events' | 'people' | 'venues';

interface PersonResult {
  id: string;
  name: string;
  image?: string;
  online?: boolean;
}

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { client: chatClient, status: chatStatus } = useChat();

  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTab>('all');
  const [isSearching, setIsSearching] = useState(false);

  const [eventResults, setEventResults] = useState<Event[]>([]);
  const [peopleResults, setPeopleResults] = useState<PersonResult[]>([]);
  const [venueResults, setVenueResults] = useState<Venue[]>([]);

  // Search across all sources
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setEventResults([]);
      setPeopleResults([]);
      setVenueResults([]);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    const performSearch = async () => {
      setIsSearching(true);

      // Search events + venues
      try {
        const events = await eventsApi.searchEvents(trimmed);
        if (!cancelled) {
          setEventResults(events);

          // Extract unique venues from event results
          const venueMap = new Map<number, Venue>();
          events.forEach((event) => {
            if (event.venue && event.venue.id) {
              venueMap.set(event.venue.id, event.venue);
            }
          });
          setVenueResults(Array.from(venueMap.values()));
        }
      } catch (err) {
        console.error('[Search] Events search error:', err);
        if (!cancelled) {
          setEventResults([]);
          setVenueResults([]);
        }
      }

      // Search people via Stream Chat
      if (chatClient && chatStatus === 'connected') {
        try {
          const response = await chatClient.queryUsers(
            {
              $or: [
                { name: { $autocomplete: trimmed } },
                { id: { $autocomplete: trimmed } },
              ],
              id: { $ne: chatClient.userID || '' },
            },
            { name: 1 },
            { limit: 20 }
          );

          if (!cancelled) {
            setPeopleResults(
              response.users.map((u) => ({
                id: u.id,
                name: (u.name as string) || u.id,
                image: u.image as string | undefined,
                online: u.online,
              }))
            );
          }
        } catch (err) {
          console.error('[Search] People search error:', err);
          if (!cancelled) {
            setPeopleResults([]);
          }
        }
      }

      if (!cancelled) {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(performSearch, 350);

    return () => {
      cancelled = true;
      clearTimeout(debounce);
    };
  }, [query, chatClient, chatStatus]);

  const handleEventPress = useCallback((event: Event) => {
    router.push({
      pathname: '/event/[id]',
      params: {
        id: event.id.toString(),
        title: event.name,
        date: event.startDate || '',
        imageUrl: event.imageUrl || event.flyer?.url || '',
        venueName: event.venue?.name || event.location || '',
        isPaid: event.isPaid ? 'true' : 'false',
        isUserRegistered: event.isUserRegistered ? 'true' : 'false',
      },
    });
  }, [router]);

  const handlePersonPress = useCallback((person: PersonResult) => {
    router.push({
      pathname: '/user/[username]',
      params: {
        username: person.name || person.id,
        userId: person.id,
      },
    });
  }, [router]);

  const handleVenuePress = useCallback((venue: Venue) => {
    // Navigate to map search tab with venue location
    router.push({
      pathname: '/(tabs)/search',
      params: {
        venueName: venue.name,
        lat: venue.latitude?.toString() || '',
        lng: venue.longitude?.toString() || '',
      },
    });
  }, [router]);

  const hasResults = eventResults.length > 0 || peopleResults.length > 0 || venueResults.length > 0;
  const hasQuery = query.trim().length > 0;

  const filteredEvents = (activeTab === 'all' || activeTab === 'events') ? eventResults : [];
  const filteredPeople = (activeTab === 'all' || activeTab === 'people') ? peopleResults : [];
  const filteredVenues = (activeTab === 'all' || activeTab === 'venues') ? venueResults : [];

  const TABS: { key: SearchTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'events', label: `Events${eventResults.length > 0 ? ` (${eventResults.length})` : ''}` },
    { key: 'people', label: `People${peopleResults.length > 0 ? ` (${peopleResults.length})` : ''}` },
    { key: 'venues', label: `Venues${venueResults.length > 0 ? ` (${venueResults.length})` : ''}` },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header with search bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={28} color="#1a1a1a" />
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="rgba(0,0,0,0.4)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search events, people, venues"
            placeholderTextColor="rgba(0,0,0,0.35)"
            value={query}
            onChangeText={setQuery}
            autoFocus
            autoCorrect={false}
            autoCapitalize="none"
          />
          {isSearching && (
            <ActivityIndicator size="small" color="rgba(0,0,0,0.4)" />
          )}
          {query.length > 0 && !isSearching && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color="rgba(0,0,0,0.3)" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tab filter bar - only show when we have results */}
      {hasQuery && hasResults && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabBar}
          contentContainerStyle={styles.tabBarContent}
        >
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabChip, activeTab === tab.key && styles.tabChipActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabChipText, activeTab === tab.key && styles.tabChipTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Results */}
      <ScrollView
        style={styles.results}
        contentContainerStyle={styles.resultsContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* No query state */}
        {!hasQuery && (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color="rgba(0,0,0,0.12)" />
            <Text style={styles.emptyTitle}>Search for anything</Text>
            <Text style={styles.emptySubtitle}>
              Find events, people, and venues all in one place
            </Text>
          </View>
        )}

        {/* Loading state */}
        {hasQuery && isSearching && !hasResults && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="rgba(0,0,0,0.3)" />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        )}

        {/* No results state */}
        {hasQuery && !isSearching && !hasResults && (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color="rgba(0,0,0,0.12)" />
            <Text style={styles.emptyTitle}>No results found</Text>
            <Text style={styles.emptySubtitle}>
              Try a different search term
            </Text>
          </View>
        )}

        {/* Events section */}
        {filteredEvents.length > 0 && (
          <View style={styles.section}>
            {activeTab === 'all' && (
              <View style={styles.sectionHeader}>
                <Ionicons name="calendar-outline" size={16} color="#3897F0" />
                <Text style={styles.sectionTitle}>Events</Text>
                <Text style={styles.sectionCount}>{eventResults.length}</Text>
              </View>
            )}
            {filteredEvents.map((event) => (
              <TouchableOpacity
                key={event.id}
                style={styles.resultRow}
                onPress={() => handleEventPress(event)}
                activeOpacity={0.7}
              >
                <View style={styles.eventImageContainer}>
                  {event.imageUrl || event.flyer?.url ? (
                    <Image
                      source={{ uri: event.imageUrl || event.flyer?.url }}
                      style={styles.eventImage}
                    />
                  ) : (
                    <View style={[styles.eventImage, styles.eventImagePlaceholder]}>
                      <Ionicons name="calendar" size={20} color="rgba(0,0,0,0.2)" />
                    </View>
                  )}
                </View>
                <View style={styles.resultInfo}>
                  <Text style={styles.resultName} numberOfLines={1}>{event.name}</Text>
                  <Text style={styles.resultMeta} numberOfLines={1}>
                    {event.venue?.name || event.location || 'Venue TBA'}
                    {event.startDate && ` · ${formatDate(event.startDate)}`}
                  </Text>
                  {event.attendeeCount != null && event.attendeeCount > 0 && (
                    <Text style={styles.resultDetail}>
                      {event.attendeeCount} going
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={16} color="rgba(0,0,0,0.2)" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* People section */}
        {filteredPeople.length > 0 && (
          <View style={styles.section}>
            {activeTab === 'all' && (
              <View style={styles.sectionHeader}>
                <Ionicons name="people-outline" size={16} color="#3897F0" />
                <Text style={styles.sectionTitle}>People</Text>
                <Text style={styles.sectionCount}>{peopleResults.length}</Text>
              </View>
            )}
            {filteredPeople.map((person) => (
              <TouchableOpacity
                key={person.id}
                style={styles.resultRow}
                onPress={() => handlePersonPress(person)}
                activeOpacity={0.7}
              >
                <View style={styles.personAvatarContainer}>
                  {person.image ? (
                    <Image
                      source={{ uri: person.image }}
                      style={styles.personAvatar}
                    />
                  ) : (
                    <View style={[styles.personAvatar, styles.personAvatarPlaceholder]}>
                      <Ionicons name="person" size={18} color="rgba(0,0,0,0.3)" />
                    </View>
                  )}
                  {person.online && <View style={styles.onlineDot} />}
                </View>
                <View style={styles.resultInfo}>
                  <Text style={styles.resultName} numberOfLines={1}>{person.name}</Text>
                  {person.online && (
                    <Text style={styles.onlineText}>Online</Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={16} color="rgba(0,0,0,0.2)" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Venues section */}
        {filteredVenues.length > 0 && (
          <View style={styles.section}>
            {activeTab === 'all' && (
              <View style={styles.sectionHeader}>
                <Ionicons name="location-outline" size={16} color="#3897F0" />
                <Text style={styles.sectionTitle}>Venues</Text>
                <Text style={styles.sectionCount}>{venueResults.length}</Text>
              </View>
            )}
            {filteredVenues.map((venue) => (
              <TouchableOpacity
                key={venue.id}
                style={styles.resultRow}
                onPress={() => handleVenuePress(venue)}
                activeOpacity={0.7}
              >
                <View style={styles.venueIconContainer}>
                  {venue.imageUrl ? (
                    <Image
                      source={{ uri: venue.imageUrl }}
                      style={styles.venueIcon}
                    />
                  ) : (
                    <View style={[styles.venueIcon, styles.venueIconPlaceholder]}>
                      <Ionicons name="location" size={18} color="#3897F0" />
                    </View>
                  )}
                </View>
                <View style={styles.resultInfo}>
                  <Text style={styles.resultName} numberOfLines={1}>{venue.name}</Text>
                  {(venue.address || venue.city) && (
                    <Text style={styles.resultMeta} numberOfLines={1}>
                      {[venue.address, venue.city, venue.state].filter(Boolean).join(', ')}
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={16} color="rgba(0,0,0,0.2)" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Bottom padding */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  } catch {
    return '';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
    gap: 4,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    color: '#1a1a1a',
    paddingVertical: 0,
  },
  tabBar: {
    maxHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  tabBarContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  tabChipActive: {
    backgroundColor: 'rgba(56,151,240,0.1)',
    borderColor: 'rgba(56,151,240,0.2)',
  },
  tabChipText: {
    fontSize: 13,
    fontFamily: 'Lato_600SemiBold',
    color: 'rgba(0,0,0,0.5)',
  },
  tabChipTextActive: {
    color: '#3897F0',
  },
  results: {
    flex: 1,
  },
  resultsContent: {
    flexGrow: 1,
  },
  section: {
    paddingTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    color: '#1a1a1a',
    flex: 1,
  },
  sectionCount: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(0,0,0,0.35)',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 15,
    fontFamily: 'Lato_600SemiBold',
    color: '#1a1a1a',
  },
  resultMeta: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(0,0,0,0.45)',
    marginTop: 2,
  },
  resultDetail: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(0,0,0,0.35)',
    marginTop: 2,
  },
  // Event image
  eventImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 10,
    overflow: 'hidden',
  },
  eventImage: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },
  eventImagePlaceholder: {
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Person avatar
  personAvatarContainer: {
    position: 'relative',
  },
  personAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  personAvatarPlaceholder: {
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#34C759',
    borderWidth: 2,
    borderColor: '#fff',
  },
  onlineText: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: '#34C759',
    marginTop: 2,
  },
  // Venue icon
  venueIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    overflow: 'hidden',
  },
  venueIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  venueIconPlaceholder: {
    backgroundColor: 'rgba(56,151,240,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Empty / loading states
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: 'Lato_600SemiBold',
    color: 'rgba(0,0,0,0.4)',
    textAlign: 'center',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(0,0,0,0.3)',
    textAlign: 'center',
    marginTop: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(0,0,0,0.35)',
    marginTop: 12,
  },
});
