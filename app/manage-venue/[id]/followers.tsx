import { useState, useCallback } from 'react';
import { LiquidGlassView, isLiquidGlassSupported } from '@callstack/liquid-glass';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassSurface } from '@/components/glass/glass-surface';
import { useVenueFollowers, useDebounce } from '@/hooks';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import type { VenueFollower } from '@/lib/types/venues.types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
  Pressable,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function getInitials(follower: VenueFollower): string {
  const first = follower.firstName?.[0] || '';
  const last = follower.lastName?.[0] || '';
  if (first || last) return `${first}${last}`.toUpperCase();
  if (follower.userName) return follower.userName[0].toUpperCase();
  return '?';
}

function getDisplayName(follower: VenueFollower): string {
  if (follower.firstName || follower.lastName) {
    return `${follower.firstName || ''} ${follower.lastName || ''}`.trim();
  }
  return follower.userName || 'User';
}

function getRelativeTime(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  const diffYears = Math.floor(diffMonths / 12);
  return `${diffYears}y ago`;
}

export default function FollowersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  const [searchText, setSearchText] = useState('');
  const debouncedSearch = useDebounce(searchText, 300);

  const venueId = id ? Number(id) : undefined;

  const {
    followers,
    total,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useVenueFollowers({
    venueId,
    search: debouncedSearch || undefined,
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

  const renderFollower = useCallback(
    ({ item, index }: { item: VenueFollower; index: number }) => {
      const name = getDisplayName(item);

      return (
        <Animated.View entering={FadeInDown.delay(Math.min(index * 30, 300)).duration(250)}>
          <GlassSurface fill="subtle" border="subtle" cornerRadius="lg" style={styles.followerRow}>
            {item.avatarUrl ? (
              <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarFallback, { backgroundColor: isDark ? undefined : colors.backgroundSecondary, overflow: 'hidden' as const }]}>
                {isDark && <GlassView {...liquidGlass.fillFaint} borderRadius={20} style={StyleSheet.absoluteFillObject} />}
                <Text style={[styles.avatarInitials, { color: colors.text }]}>
                  {getInitials(item)}
                </Text>
              </View>
            )}
            <View style={styles.followerInfo}>
              <Text style={[styles.followerName, { color: colors.text }]} numberOfLines={1}>
                {name}
              </Text>
              {item.userName ? (
                <Text style={[styles.followerSubtext, { color: colors.textTertiary }]} numberOfLines={1}>
                  @{item.userName}
                </Text>
              ) : null}
            </View>
            <Text style={[styles.followedDate, { color: colors.textTertiary }]}>
              {getRelativeTime(item.followedAt)}
            </Text>
          </GlassSurface>
        </Animated.View>
      );
    },
    [colors],
  );

  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}>

      {/* Fixed pill row */}
      <View style={[styles.pillRow, { paddingTop: insets.top + 16 }]}>
        <Pressable style={styles.pillIcon} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="#000" />
        </Pressable>
        <Pressable style={styles.pillIcon} onPress={() => {}}>
          <Ionicons name="search" size={18} color="#000" />
        </Pressable>
        <View style={styles.pillLabel}>
          {isLiquidGlassSupported ? (
            <LiquidGlassView effect="regular" style={StyleSheet.absoluteFill} />
          ) : null}
          <Text style={styles.pillLabelText}>Followers{!isLoading ? ` ${total}` : ''}</Text>
        </View>
      </View>

      <LinearGradient colors={['#000000', 'rgba(0,0,0,0)']} style={styles.topFade} pointerEvents="none" />

      {/* Followers List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.text} />
        </View>
      ) : followers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={48} color={colors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No followers yet</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
            {searchText
              ? 'No followers match your search'
              : 'When people follow your venue, they\u2019ll appear here'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={followers}
          renderItem={renderFollower}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={[styles.listContent, { paddingTop: insets.top + 70, paddingBottom: insets.bottom + 20 }]}
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
  pillRow: { flexDirection: 'row', paddingHorizontal: 12, gap: 8, alignItems: 'center', paddingBottom: 8, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  pillIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.06)', justifyContent: 'center', alignItems: 'center' },
  pillLabel: { height: 38, borderRadius: 19, paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  pillLabelText: { fontSize: 14, fontWeight: '500', color: 'rgba(0,0,0,0.8)' },
  topFade: { position: 'absolute', top: 0, left: 0, right: 0, height: 160, zIndex: 9 },
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
  },
  countBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countText: {
    fontSize: 12,
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
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
    gap: 8,
  },
  followerRow: {
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
  },
  followerInfo: {
    flex: 1,
  },
  followerName: {
    fontSize: 15,
  },
  followerSubtext: {
    fontSize: 13,
    marginTop: 1,
  },
  followedDate: {
    fontSize: 12,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});
