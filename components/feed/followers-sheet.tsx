import * as React from 'react';
import { useStableRouter } from '@/hooks/use-stable-router';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/hooks/use-app-theme';
import { followsApi } from '@/lib/api/follows';
import type { UserFollowItem, VenueFollowItem } from '@/lib/types/follows.types';

const DefaultAvatarImage = require('@/assets/images/default-avatar.png');

type SheetTab = 'followers' | 'following';

interface FollowersSheetProps {
  visible: boolean;
  onClose: () => void;
  initialTab: SheetTab;
  userId: number;
  followersCount: number;
  followingCount: number;
}

interface ListItem {
  id: number;
  name: string;
  imageUrl?: string | null;
  type: 'user' | 'venue';
}

export function FollowersSheet({
  visible,
  onClose,
  initialTab,
  userId,
  followersCount,
  followingCount,
}: FollowersSheetProps) {
  const bottomSheetRef = React.useRef<BottomSheet>(null);
  const insets = useSafeAreaInsets();
  const router = useStableRouter();
  const { colors, isDark } = useAppTheme();
  const snapPoints = React.useMemo(() => ['55%', '85%'], []);

  const [activeTab, setActiveTab] = React.useState<SheetTab>(initialTab);
  const [followers, setFollowers] = React.useState<ListItem[]>([]);
  const [following, setFollowing] = React.useState<ListItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasFetchedFollowers, setHasFetchedFollowers] = React.useState(false);
  const [hasFetchedFollowing, setHasFetchedFollowing] = React.useState(false);

  // Update tab when initialTab changes
  React.useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Open/close sheet
  React.useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.snapToIndex(0);
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible]);

  // Fetch data when tab changes or sheet opens
  React.useEffect(() => {
    if (!visible || !userId) return;

    if (activeTab === 'followers' && !hasFetchedFollowers) {
      fetchFollowers();
    } else if (activeTab === 'following' && !hasFetchedFollowing) {
      fetchFollowing();
    }
  }, [visible, activeTab, userId]);

  const fetchFollowers = async () => {
    setIsLoading(true);
    try {
      const res = await followsApi.getUserFollowers(userId);
      const items: ListItem[] = [
        ...res.userFollowers.map((u: UserFollowItem) => ({
          id: u.id,
          name: u.userName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'User',
          imageUrl: u.avatarUrl,
          type: 'user' as const,
        })),
        ...res.venueFollowers.map((v: VenueFollowItem) => ({
          id: v.id,
          name: v.name,
          imageUrl: v.logoUrl,
          type: 'venue' as const,
        })),
      ];
      setFollowers(items);
      setHasFetchedFollowers(true);
    } catch (err) {
      console.error('[FollowersSheet] Failed to fetch followers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFollowing = async () => {
    setIsLoading(true);
    try {
      const res = await followsApi.getUserFollowing(userId);
      const items: ListItem[] = [
        ...res.followingUsers.map((u: UserFollowItem) => ({
          id: u.id,
          name: u.userName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'User',
          imageUrl: u.avatarUrl,
          type: 'user' as const,
        })),
        ...res.followingVenues.map((v: VenueFollowItem) => ({
          id: v.id,
          name: v.name,
          imageUrl: v.logoUrl,
          type: 'venue' as const,
        })),
      ];
      setFollowing(items);
      setHasFetchedFollowing(true);
    } catch (err) {
      console.error('[FollowersSheet] Failed to fetch following:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // Reset fetch state so data refreshes next time
    setHasFetchedFollowers(false);
    setHasFetchedFollowing(false);
    onClose();
  };

  const handleUserPress = (item: ListItem) => {
    if (item.type === 'user') {
      router.push({
        pathname: '/user/[username]',
        params: { username: item.name || item.id.toString(), userId: item.id.toString() },
      });
      handleClose();
    }
  };

  const data = activeTab === 'followers' ? followers : following;

  const renderItem = React.useCallback(
    ({ item }: { item: ListItem }) => (
      <TouchableOpacity
        style={styles.row}
        onPress={() => handleUserPress(item)}
        activeOpacity={0.6}
      >
        <View style={[styles.avatarWrap, { backgroundColor: colors.backgroundSecondary }]}>
          <Image
            source={item.imageUrl ? { uri: item.imageUrl } : DefaultAvatarImage}
            style={styles.avatar}
          />
        </View>
        <View style={styles.rowInfo}>
          <Text style={[styles.rowName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
          <Text style={[styles.rowType, { color: colors.textTertiary }]}>{item.type === 'venue' ? 'Venue' : 'User'}</Text>
        </View>
      </TouchableOpacity>
    ),
    [colors]
  );

  const ListEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.textTertiary} />
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
          {activeTab === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
        </Text>
      </View>
    );
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={handleClose}
      backgroundStyle={[
        styles.sheetBackground,
        { backgroundColor: isDark ? '#1c1c1e' : '#fff' }
      ]}
      handleIndicatorStyle={[
        styles.sheetIndicator,
        { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)' }
      ]}
      enableDynamicSizing={false}
    >
      {/* Tabs */}
      <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'followers' && [styles.tabActive, { borderBottomColor: colors.text }]
          ]}
          onPress={() => setActiveTab('followers')}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.tabCount,
            { color: colors.textTertiary },
            activeTab === 'followers' && { color: colors.text }
          ]}>
            {followersCount}
          </Text>
          <Text style={[
            styles.tabLabel,
            { color: colors.textTertiary },
            activeTab === 'followers' && { color: colors.text }
          ]}>
            Followers
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'following' && [styles.tabActive, { borderBottomColor: colors.text }]
          ]}
          onPress={() => setActiveTab('following')}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.tabCount,
            { color: colors.textTertiary },
            activeTab === 'following' && { color: colors.text }
          ]}>
            {followingCount}
          </Text>
          <Text style={[
            styles.tabLabel,
            { color: colors.textTertiary },
            activeTab === 'following' && { color: colors.text }
          ]}>
            Following
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <BottomSheetFlatList
        data={data}
        keyExtractor={(item: ListItem) => `${item.type}-${item.id}`}
        renderItem={renderItem}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={[
          styles.listContent,
          data.length === 0 && styles.listContentEmpty,
          { paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: colors.separator }]} />}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetBackground: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  sheetIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {},
  tabCount: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
  },
  tabCountActive: {},
  tabLabel: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    marginTop: 1,
  },
  tabLabelActive: {},

  // List
  listContent: {
    paddingTop: 4,
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  rowInfo: {
    flex: 1,
    marginLeft: 12,
  },
  rowName: {
    fontSize: 15,
    fontFamily: 'Lato_600SemiBold',
  },
  rowType: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    marginTop: 1,
  },
  separator: {
    height: 1,
    marginLeft: 76,
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
  },
});
