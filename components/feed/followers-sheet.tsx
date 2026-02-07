import * as React from 'react';
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
import { useRouter } from 'expo-router';
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
  const router = useRouter();
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
        pathname: '/user-profile/[userId]',
        params: { userId: item.id.toString(), name: item.name, avatarUrl: item.imageUrl || '' },
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
        <View style={styles.avatarWrap}>
          <Image
            source={item.imageUrl ? { uri: item.imageUrl } : DefaultAvatarImage}
            style={styles.avatar}
          />
        </View>
        <View style={styles.rowInfo}>
          <Text style={styles.rowName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.rowType}>{item.type === 'venue' ? 'Venue' : 'User'}</Text>
        </View>
      </TouchableOpacity>
    ),
    []
  );

  const ListEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="rgba(0,0,0,0.3)" />
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
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
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.sheetIndicator}
      enableDynamicSizing={false}
    >
      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'followers' && styles.tabActive]}
          onPress={() => setActiveTab('followers')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabCount, activeTab === 'followers' && styles.tabCountActive]}>
            {followersCount}
          </Text>
          <Text style={[styles.tabLabel, activeTab === 'followers' && styles.tabLabelActive]}>
            Followers
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'following' && styles.tabActive]}
          onPress={() => setActiveTab('following')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabCount, activeTab === 'following' && styles.tabCountActive]}>
            {followingCount}
          </Text>
          <Text style={[styles.tabLabel, activeTab === 'following' && styles.tabLabelActive]}>
            Following
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <BottomSheetFlatList
        data={data}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        renderItem={renderItem}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={[
          styles.listContent,
          data.length === 0 && styles.listContentEmpty,
          { paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  sheetIndicator: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    width: 40,
    height: 4,
    borderRadius: 2,
  },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#1a1a1a',
  },
  tabCount: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    color: 'rgba(0, 0, 0, 0.35)',
  },
  tabCountActive: {
    color: '#1a1a1a',
  },
  tabLabel: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(0, 0, 0, 0.35)',
    marginTop: 1,
  },
  tabLabelActive: {
    color: '#1a1a1a',
  },

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
    backgroundColor: '#fff',
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
    color: '#1a1a1a',
  },
  rowType: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(0, 0, 0, 0.4)',
    marginTop: 1,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
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
    color: 'rgba(0, 0, 0, 0.4)',
  },
});
