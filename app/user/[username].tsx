import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { authApi } from '@/lib/api/auth';
import { useToast } from '@/components/shared/toast';
import { useChat } from '@/lib/providers/chat-provider';
import { useChannels } from '@/hooks/use-channels';
import { useUserFeedStats } from '@/hooks/use-user-feed-stats';
import { useFollowUser } from '@/hooks/use-follow-user';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { LinkifiedText } from '@/components/shared/linkified-text';
import type { PublicUserProfile } from '@/lib/types/auth.types';

const DEFAULT_AVATAR = require('@/assets/images/default-avatar.png');
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const POST_SIZE = (SCREEN_WIDTH - 6) / 3;

function StatButton({
  value,
  label,
  onPress,
}: {
  value: number | string;
  label: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.statButton}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function UserProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { username } = useLocalSearchParams<{ username: string }>();
  const { showSuccess, showError } = useToast();
  const { client, status: chatStatus } = useChat();
  const { channelData } = useChannels();
  const [user, setUser] = React.useState<PublicUserProfile | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isCreatingChat, setIsCreatingChat] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Fetch follower/following counts and activities from Stream
  const { followerCount, followingCount, activities: userPosts, isLoading: statsLoading, refetch: refetchStats } = useUserFeedStats(user?.id);
  const postsLoading = statsLoading;

  // Pull-to-refresh with haptic feedback
  const { refreshControl } = useRefreshControl({
    onRefresh: refetchStats,
  });

  // Use Stream SDK directly for follow/unfollow (same as web frontend)
  const {
    isFollowing,
    follow,
    unfollow,
    isFollowInProgress,
    isUnfollowInProgress,
  } = useFollowUser(user?.id);

  React.useEffect(() => {
    async function loadUser() {
      if (!username) {
        setError('No username provided');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const searchResult = await authApi.getUserByUsername(username);
        if (!searchResult) {
          setError('User not found');
          return;
        }

        const fullProfile = await authApi.getUserById(searchResult.id);
        if (fullProfile) {
          setUser(fullProfile);
        } else {
          setUser(searchResult);
        }
      } catch (err: any) {
        console.error('[UserProfile] Error loading user:', err);
        setError(err?.message || 'User not found');
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, [username]);

  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`
    : username || 'User';

  const avatarUrl = user?.avatar?.url;

  const handleFollow = async () => {
    if (!user?.id || isFollowInProgress || isUnfollowInProgress) return;

    console.log('[UserProfile] handleFollow called, isFollowing:', isFollowing, 'userId:', user.id);
    try {
      if (isFollowing) {
        console.log('[UserProfile] Calling unfollow via Stream SDK...');
        await unfollow();
      } else {
        console.log('[UserProfile] Calling follow via Stream SDK...');
        await follow();
      }
      // Refetch stats to update follower count
      await refetchStats();
    } catch (err: any) {
      console.error('[UserProfile] Follow error:', err);
      showError(err?.message || 'Failed to update follow status');
    }
  };

  const handleMessage = async () => {
    if (!user?.id || !client || chatStatus !== 'connected') {
      showError('Unable to start chat. Please try again.');
      return;
    }

    if (isCreatingChat) return;

    setIsCreatingChat(true);
    try {
      const currentUserId = client.userID;
      if (!currentUserId) {
        showError('You need to be logged in to send messages');
        return;
      }

      const targetUserId = String(user.id);
      const channelId = [currentUserId, targetUserId].sort().join('-');

      const existingChannel = channelData.find((c) => c.id === channelId);
      if (existingChannel) {
        router.push({
          pathname: '/chat/[conversationId]',
          params: { conversationId: existingChannel.id },
        });
        return;
      }

      const channel = client.channel('messaging', channelId, {
        members: [currentUserId, targetUserId],
      });

      await channel.watch();

      router.push({
        pathname: '/chat/[conversationId]',
        params: { conversationId: channel.id || channelId },
      });
    } catch (err: any) {
      console.error('[UserProfile] Error creating chat:', err);
      showError(err?.message || 'Failed to start conversation');
    } finally {
      setIsCreatingChat(false);
    }
  };

  const handleMoreOptions = () => {
    showSuccess('More options coming soon');
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (error || !user) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerIcon}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerUsername}>Profile</Text>
          <View style={styles.headerIcon} />
        </View>
        <View style={styles.errorContainer}>
          <View style={styles.errorIconContainer}>
            <Ionicons name="person-outline" size={48} color="rgba(255,255,255,0.4)" />
          </View>
          <Text style={styles.errorTitle}>User Not Found</Text>
          <Text style={styles.errorSubtitle}>
            @{username} doesn't exist or has been removed
          </Text>
          <TouchableOpacity
            style={styles.goBackButton}
            onPress={() => router.back()}
          >
            <Text style={styles.goBackButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 8 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
      >
        {/* Header - Same style as own profile */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
          <TouchableOpacity
            style={styles.headerIcon}
            activeOpacity={0.7}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.headerUsername} numberOfLines={1}>
            {user.userName || username}
          </Text>

          <TouchableOpacity
            style={styles.headerIcon}
            activeOpacity={0.7}
            onPress={handleMoreOptions}
          >
            <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
          </TouchableOpacity>
        </Animated.View>

        {/* Profile Info Row - Same as own profile */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(500).springify()}
          style={styles.profileRow}
        >
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <Image source={DEFAULT_AVATAR} style={styles.avatar} />
          )}
          <View style={styles.statsRow}>
            <StatButton value={userPosts.length} label="Posts" />
            <StatButton value={followerCount} label="Followers" />
            <StatButton value={followingCount} label="Following" />
          </View>
        </Animated.View>

        {/* Name and Bio - Same as own profile */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(500).springify()}
          style={styles.bioSection}
        >
          <Text style={styles.displayName}>{displayName}</Text>
          {user.bio ? <LinkifiedText style={styles.bio}>{user.bio}</LinkifiedText> : null}
        </Animated.View>

        {/* Action Buttons - Follow + Message */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(500).springify()}
          style={styles.actionButtons}
        >
          <TouchableOpacity
            style={[
              styles.actionButton,
              isFollowing ? styles.actionButtonSecondary : styles.actionButtonPrimary,
              (isFollowInProgress || isUnfollowInProgress) && styles.actionButtonDisabled,
            ]}
            onPress={handleFollow}
            activeOpacity={0.8}
            disabled={isFollowInProgress || isUnfollowInProgress}
          >
            {isFollowInProgress || isUnfollowInProgress ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text
                style={[
                  styles.actionButtonText,
                  !isFollowing && styles.actionButtonTextPrimary,
                ]}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.actionButtonSecondary,
              isCreatingChat && styles.actionButtonDisabled,
            ]}
            onPress={handleMessage}
            activeOpacity={0.8}
            disabled={isCreatingChat}
          >
            {isCreatingChat ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.actionButtonText}>Message</Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Grid Header - Same as own profile */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(500).springify()}
          style={styles.gridHeader}
        >
          <View style={[styles.gridTab, styles.gridTabActive]}>
            <Ionicons name="grid-outline" size={24} color="#fff" />
          </View>
        </Animated.View>

        {/* Posts Grid */}
        <Animated.View
          entering={FadeInDown.delay(500).duration(500).springify()}
          style={styles.postsGrid}
        >
          {postsLoading ? (
            <View style={styles.postsLoadingContainer}>
              <ActivityIndicator color="#fff" size="small" />
            </View>
          ) : userPosts.length > 0 ? (
            userPosts.map((post) => (
              <TouchableOpacity key={post.id} activeOpacity={0.9} style={styles.postContainer}>
                <Image
                  source={{ uri: post.imageUrl || post.videoUrl }}
                  style={styles.postImage}
                />
                {post.mediaType === 'video' && (
                  <View style={styles.videoIndicator}>
                    <Ionicons name="play" size={16} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.noPostsContainer}>
              <Ionicons name="images-outline" size={48} color="rgba(255,255,255,0.3)" />
              <Text style={styles.noPostsText}>No posts yet</Text>
            </View>
          )}
        </Animated.View>

        {/* Bottom spacing */}
        <View style={{ height: insets.bottom + 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  headerUsername: {
    flex: 1,
    fontSize: 22,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  headerIcon: {
    padding: 4,
    width: 40,
    alignItems: 'center',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  statsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginLeft: 24,
  },
  statButton: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  bioSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  displayName: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
    marginBottom: 4,
  },
  bio: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
  actionButtonPrimary: {
    backgroundColor: '#0095f6',
  },
  actionButtonSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  actionButtonDisabled: {
    opacity: 0.7,
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  actionButtonTextPrimary: {
    color: '#fff',
  },
  gridHeader: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  gridTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  gridTabActive: {
    borderBottomWidth: 1,
    borderBottomColor: '#fff',
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 1,
  },
  postContainer: {
    position: 'relative',
  },
  postImage: {
    width: POST_SIZE,
    height: POST_SIZE,
    margin: 1,
    backgroundColor: '#1a1a1a',
  },
  videoIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 4,
    padding: 4,
  },
  postsLoadingContainer: {
    width: '100%',
    paddingVertical: 40,
    alignItems: 'center',
  },
  noPostsContainer: {
    width: '100%',
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  noPostsText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 22,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 24,
  },
  goBackButton: {
    backgroundColor: '#0095f6',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  goBackButtonText: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
});
