import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Keyboard,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useUnifiedSearch } from '@/hooks/use-unified-search';
import { useFollowUser } from '@/hooks/use-follow-user';
import { useAuth } from '@/lib/providers/auth-provider';
import { useAppTheme } from '@/hooks/use-app-theme';
import type {
  UnifiedSearchItem,
  SearchSuggestion,
} from '@/lib/types/search.types';
import { format } from 'date-fns';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DefaultAvatarImage = require('@/assets/images/default-avatar.png');

// ── Row components (same logic as search-screen) ──

function PersonRow({ item, onPress }: { item: UnifiedSearchItem; onPress: () => void }) {
  const { user } = useAuth();
  const isSelf = user?.id === item.id;
  const { isFollowing, follow, unfollow, isFollowInProgress, isUnfollowInProgress } = useFollowUser(item.id);
  const name = `${item.firstName || ''} ${item.lastName || ''}`.trim();

  return (
    <TouchableOpacity style={styles.resultRow} onPress={onPress} activeOpacity={0.7}>
      {item.avatar?.url ? (
        <Image source={{ uri: item.avatar.url }} style={styles.avatar} />
      ) : (
        <Image source={DefaultAvatarImage} style={styles.avatar} />
      )}
      <View style={styles.resultInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.resultTitle} numberOfLines={1}>{name || 'User'}</Text>
          {item.isVerified && <MaterialCommunityIcons name="check-decagram" size={15} color="#1a1a1a" style={{ marginLeft: 4 }} />}
        </View>
        {item.userName && <Text style={styles.resultSubtitle} numberOfLines={1}>@{item.userName}</Text>}
        {(item.mutualCount ?? 0) > 0 && <Text style={styles.mutualText}>{item.mutualCount} mutual {item.mutualCount === 1 ? 'friend' : 'friends'}</Text>}
      </View>
      {!isSelf && (
        <TouchableOpacity
          style={[styles.followButton, isFollowing && styles.followButtonFollowing]}
          onPress={() => isFollowing ? unfollow() : follow()}
          disabled={isFollowInProgress || isUnfollowInProgress}
          activeOpacity={0.7}
        >
          <Text style={[styles.followButtonText, isFollowing && styles.followButtonTextFollowing]}>
            {isFollowInProgress || isUnfollowInProgress ? '...' : isFollowing ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

function EventRow({ item, onPress }: { item: UnifiedSearchItem; onPress: () => void }) {
  const dateLabel = item.startDate ? format(new Date(item.startDate), 'MMM d, yyyy') : 'Date TBA';
  return (
    <TouchableOpacity style={styles.resultRow} onPress={onPress} activeOpacity={0.7}>
      {item.flyer?.url ? (
        <Image source={{ uri: item.flyer.url }} style={styles.eventThumb} />
      ) : (
        <View style={[styles.eventThumb, styles.placeholderThumb]}><Ionicons name="calendar" size={24} color="#ccc" /></View>
      )}
      <View style={styles.resultInfo}>
        <Text style={styles.resultTitle} numberOfLines={1}>{item.name || 'Event'}</Text>
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={12} color="#999" />
          <Text style={styles.resultSubtitle}>{dateLabel}</Text>
        </View>
        {item.venueName && (
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={12} color="#bbb" />
            <Text style={[styles.resultSubtitle, { color: '#bbb' }]} numberOfLines={1}>{item.venueName}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

function VenueRow({ item, onPress }: { item: UnifiedSearchItem; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.resultRow} onPress={onPress} activeOpacity={0.7}>
      {item.logo?.url ? (
        <Image source={{ uri: item.logo.url }} style={styles.venueThumb} />
      ) : (
        <View style={[styles.venueThumb, styles.placeholderThumb]}><Ionicons name="business" size={22} color="#ccc" /></View>
      )}
      <View style={styles.resultInfo}>
        <Text style={styles.resultTitle} numberOfLines={1}>{item.name || 'Venue'}</Text>
        {item.address && (
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={12} color="#bbb" />
            <Text style={[styles.resultSubtitle, { color: '#bbb' }]} numberOfLines={1}>{item.address}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

function RecentSearchRow({ item, onPress, onDelete }: { item: SearchSuggestion; onPress: () => void; onDelete: () => void }) {
  const imageUrl = item.displayImage || item.avatar?.url;
  const isPerson = item.selectedType === 'person';
  const name = isPerson ? `${item.firstName || ''} ${item.lastName || ''}`.trim() || item.displayName || 'User' : item.displayName || item.query || 'Search';

  return (
    <TouchableOpacity style={styles.resultRow} onPress={onPress} activeOpacity={0.7}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={isPerson ? styles.avatar : styles.venueThumb} />
      ) : isPerson ? (
        <Image source={DefaultAvatarImage} style={styles.avatar} />
      ) : (
        <View style={styles.recentIcon}><Ionicons name="time-outline" size={18} color="#999" /></View>
      )}
      <View style={styles.resultInfo}>
        <Text style={styles.resultTitle} numberOfLines={1}>{name}</Text>
        {isPerson && item.userName && <Text style={styles.resultSubtitle} numberOfLines={1}>@{item.userName}</Text>}
      </View>
      <TouchableOpacity onPress={onDelete} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Ionicons name="close" size={18} color="#bbb" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function FrequentAvatarRow({ items, onPress }: { items: SearchSuggestion[]; onPress: (item: SearchSuggestion) => void }) {
  if (items.length === 0) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.frequentRow}>
      {items.map((item) => (
        <TouchableOpacity key={item.id} style={styles.frequentItem} onPress={() => onPress(item)} activeOpacity={0.7}>
          {item.avatar?.url ? (
            <Image source={{ uri: item.avatar.url }} style={styles.frequentAvatar} />
          ) : (
            <Image source={DefaultAvatarImage} style={styles.frequentAvatar} />
          )}
          <Text style={styles.frequentName} numberOfLines={1}>{item.firstName || item.userName || 'User'}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ── Main Sheet ──

interface SearchSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function SearchSheet({ visible, onClose }: SearchSheetProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);
  const translateY = useSharedValue(SCREEN_HEIGHT);

  const {
    searchQuery, setSearchQuery, debouncedQuery,
    results, isSearching, suggestions,
    recordSearch, deleteSearchEntry, clearSearchHistory,
  } = useUnifiedSearch();

  const hasQuery = debouncedQuery.length > 0;
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardWillShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardWillHide', () => setKeyboardVisible(false));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) });
      setTimeout(() => inputRef.current?.focus(), 400);
    } else {
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250, easing: Easing.in(Easing.ease) });
      Keyboard.dismiss();
      setSearchQuery('');
    }
  }, [visible]);

  const handleClose = useCallback(() => {
    Keyboard.dismiss();
    translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250, easing: Easing.in(Easing.ease) });
    setTimeout(onClose, 260);
  }, [onClose]);

  const handleResultPress = useCallback((item: UnifiedSearchItem) => {
    recordSearch({
      query: searchQuery,
      selectedType: item.type,
      selectedId: item.id,
      displayName: item.type === 'person' ? `${item.firstName || ''} ${item.lastName || ''}`.trim() : item.name || item.text || undefined,
      displayImage: item.avatar?.url || item.flyer?.url || item.logo?.url || undefined,
    });
    handleClose();
    setTimeout(() => {
      switch (item.type) {
        case 'person': router.push({ pathname: '/user/[username]', params: { username: item.userName || `user-${item.id}`, userId: String(item.id) } }); break;
        case 'event': router.push({ pathname: '/event/[id]', params: { id: String(item.id) } }); break;
        case 'venue': router.push({ pathname: '/(tabs)/search', params: { venueName: item.name || '' } }); break;
      }
    }, 300);
  }, [searchQuery, recordSearch, handleClose, router]);

  const handleRecentPress = useCallback((item: SearchSuggestion) => {
    if (item.selectedId && item.selectedType) {
      handleClose();
      setTimeout(() => {
        switch (item.selectedType) {
          case 'person': router.push({ pathname: '/user/[username]', params: { username: `user-${item.selectedId}`, userId: String(item.selectedId) } }); break;
          case 'event': router.push({ pathname: '/event/[id]', params: { id: String(item.selectedId) } }); break;
          case 'venue': router.push({ pathname: '/(tabs)/search', params: { venueName: item.displayName || '' } }); break;
        }
      }, 300);
    } else if (item.query) {
      setSearchQuery(item.query);
    }
  }, [handleClose, router, setSearchQuery]);

  const handleSuggestionPress = useCallback((item: SearchSuggestion) => {
    recordSearch({ selectedType: 'person', selectedId: item.id, displayName: `${item.firstName || ''} ${item.lastName || ''}`.trim(), displayImage: item.avatar?.url });
    handleClose();
    setTimeout(() => {
      router.push({ pathname: '/user/[username]', params: { username: item.userName || `user-${item.id}`, userId: String(item.id) } });
    }, 300);
  }, [recordSearch, handleClose, router]);

  const groupedSections = React.useMemo(() => {
    if (results.length === 0) return [];
    const groups: Record<string, UnifiedSearchItem[]> = {};
    for (const item of results) { if (!groups[item.type]) groups[item.type] = []; groups[item.type].push(item); }
    const labels: Record<string, string> = { person: 'People', event: 'Events', venue: 'Venues', post: 'Posts' };
    return Object.entries(groups).map(([type, items]) => ({ type, label: labels[type] || type, data: items, topScore: Math.max(...items.map(i => i.score)) })).sort((a, b) => b.topScore - a.topScore);
  }, [results]);

  const renderResultRow = useCallback((item: UnifiedSearchItem) => {
    const onPress = () => handleResultPress(item);
    switch (item.type) {
      case 'person': return <PersonRow key={`p-${item.id}`} item={item} onPress={onPress} />;
      case 'event': return <EventRow key={`e-${item.id}`} item={item} onPress={onPress} />;
      case 'venue': return <VenueRow key={`v-${item.id}`} item={item} onPress={onPress} />;
      default: return null;
    }
  }, [handleResultPress]);

  const recentSearches = suggestions?.recentSearches ?? [];
  const frequentFriends = suggestions?.frequentFriends ?? [];
  const mutualSuggestions = suggestions?.mutualFollowSuggestions ?? [];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) return null;

  return (
      <Animated.View style={[styles.sheet, animatedStyle]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Top bar */}
        <View style={[styles.topBar, { paddingTop: insets.top + 4 }]}>
          <TouchableOpacity style={styles.iconBtn} onPress={clearSearchHistory} activeOpacity={0.7}>
            <Ionicons name="time-outline" size={24} color="#1a1a1a" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={handleClose} activeOpacity={0.7}>
            <Ionicons name="close" size={24} color="#1a1a1a" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.mainContent}>
          {hasQuery ? (
            isSearching && results.length === 0 ? (
              <View style={styles.loadingState}><ActivityIndicator size="large" color="#1a1a1a" /></View>
            ) : results.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No results for "{debouncedQuery}"</Text>
              </View>
            ) : (
              <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {groupedSections.map(section => (
                  <View key={section.type}>
                    <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{section.label}</Text></View>
                    {section.data.map(item => renderResultRow(item))}
                  </View>
                ))}
              </ScrollView>
            )
          ) : (
            <ScrollView contentContainerStyle={styles.suggestionsContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {recentSearches.length > 0 && (
                <Animated.View entering={FadeInDown.duration(300)}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent</Text>
                    <TouchableOpacity onPress={clearSearchHistory}><Text style={styles.clearText}>Clear all</Text></TouchableOpacity>
                  </View>
                  {recentSearches.map(item => (
                    <RecentSearchRow key={item.id} item={item} onPress={() => handleRecentPress(item)} onDelete={() => deleteSearchEntry(item.id)} />
                  ))}
                </Animated.View>
              )}

              {frequentFriends.length > 0 && (
                <Animated.View entering={FadeInDown.delay(100).duration(300)}>
                  <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Frequently searched</Text></View>
                  <FrequentAvatarRow items={frequentFriends} onPress={handleSuggestionPress} />
                </Animated.View>
              )}

              {mutualSuggestions.length > 0 && (
                <Animated.View entering={FadeInDown.delay(200).duration(300)}>
                  <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Suggested for you</Text></View>
                  {mutualSuggestions.map(item => (
                    <PersonRow key={item.id} item={item as any} onPress={() => handleSuggestionPress(item)} />
                  ))}
                </Animated.View>
              )}
            </ScrollView>
          )}
        </View>

        {/* Bottom input */}
        <View style={[styles.bottomInput, { paddingBottom: keyboardVisible ? 8 : insets.bottom + 16 }]}>
          <View style={styles.inputContainer}>
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              placeholder="Search or ask anything"
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardAppearance="light"
            />
            <View style={styles.inputActions}>
              <TouchableOpacity style={styles.plusBtn} activeOpacity={0.7}>
                <Ionicons name="add" size={20} color="#666" />
              </TouchableOpacity>
              <View style={{ flex: 1 }} />
              <TouchableOpacity style={searchQuery.length > 0 ? styles.arrowBtn : styles.arrowBtnInactive} activeOpacity={0.7}>
                <Ionicons name="arrow-forward" size={18} color={searchQuery.length > 0 ? '#fff' : '#ccc'} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
      </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#f7f7f7',
    zIndex: 999,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContent: { flex: 1 },
  heroTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#1a1a1a',
    lineHeight: 40,
    marginBottom: 24,
  },
  disclaimer: {
    fontSize: 13,
    color: '#999',
    paddingHorizontal: 20,
    paddingBottom: 8,
    lineHeight: 18,
  },
  bottomInput: { paddingHorizontal: 16 },
  inputContainer: {
    backgroundColor: '#eee',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 10,
  },
  searchInput: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  inputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
  },
  plusBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.06)',
    justifyContent: 'center', alignItems: 'center',
  },
  arrowBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center', alignItems: 'center',
  },
  arrowBtnInactive: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.06)',
    justifyContent: 'center', alignItems: 'center',
  },
  listContent: { paddingHorizontal: 20, paddingTop: 4 },
  suggestionsContent: { paddingHorizontal: 20, paddingTop: 8 },
  resultRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.06)' },
  resultInfo: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  resultTitle: { fontSize: 15, fontWeight: '600', color: '#1a1a1a', flexShrink: 1 },
  resultSubtitle: { fontSize: 13, color: '#999', marginTop: 1 },
  mutualText: { fontSize: 12, color: '#bbb', marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  followButton: { backgroundColor: '#1a1a1a', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 7 },
  followButtonFollowing: { backgroundColor: 'rgba(0,0,0,0.06)', borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  followButtonText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  followButtonTextFollowing: { color: '#666' },
  eventThumb: { width: 56, height: 56, borderRadius: 10 },
  venueThumb: { width: 48, height: 48, borderRadius: 10 },
  placeholderThumb: { justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.06)' },
  recentIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.05)' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
  clearText: { fontSize: 13, color: '#999' },
  frequentRow: { gap: 16, paddingVertical: 8 },
  frequentItem: { alignItems: 'center', width: 64 },
  frequentAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(0,0,0,0.06)', marginBottom: 6 },
  frequentName: { fontSize: 11, textAlign: 'center', color: '#999' },
  loadingState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 80 },
  emptyText: { fontSize: 14, marginTop: 12, textAlign: 'center', paddingHorizontal: 40, color: '#999' },
});
