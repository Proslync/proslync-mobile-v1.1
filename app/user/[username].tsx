import * as React from 'react';
import { useStableRouter } from '@/hooks/use-stable-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useToast } from '@/components/shared/toast';
import { ActionSheet, type ActionSheetOption } from '@/components/shared/action-sheet';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import { chatApi } from '@/lib/api/chat';
import { usersApi } from '@/lib/api/users';

import { useUserFeed } from '@/hooks/use-user-feed';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useFollowUser } from '@/hooks/use-follow-user';
import { useMutualFollowers } from '@/hooks/use-mutual-followers';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { useAuth } from '@/lib/providers/auth-provider';
import { LinkifiedText } from '@/components/shared/linkified-text';
import { FollowersSheet } from '@/components/feed/followers-sheet';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { VideoThumbnailImage } from '@/components/shared/video-thumbnail';
import { useAppTheme } from '@/hooks/use-app-theme';

const DEFAULT_AVATAR = require('@/assets/images/default-avatar.png');
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const POST_GAP = 2;
const POST_SIZE = (SCREEN_WIDTH - POST_GAP * 2) / 3;

function StatButton({
  value,
  label,
  onPress,
  colors,
}: {
  value: number | string;
  label: string;
  onPress?: () => void;
  colors: any;
}) {
  return (
    <TouchableOpacity
      style={styles.statButton}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function UserProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useStableRouter();
  const { username, userId } = useLocalSearchParams<{ username: string; userId?: string }>();
  const { showError, showSuccess } = useToast();
  const { colors, isDark } = useAppTheme();
  const { data: user, isLoading, error: queryError, refetch: refetchUser } = useUserProfile({ username, userId });
  const [isCreatingChat, setIsCreatingChat] = React.useState(false);
  const [followersSheetVisible, setFollowersSheetVisible] = React.useState(false);
  const [followersSheetTab, setFollowersSheetTab] = React.useState<'followers' | 'following'>('followers');
  const [showMenu, setShowMenu] = React.useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = React.useState(false);
  const [showReportConfirm, setShowReportConfirm] = React.useState(false);

  // Fetch user posts from our backend
  const { activities: userPosts, isLoading: postsLoading, refetch: refetchPosts } = useUserFeed(user?.id);
  const followerCount = user?.followStats?.followers ?? 0;
  const followingCount = user?.followStats?.following ?? 0;

  // Pull-to-refresh with haptic feedback
  const { refreshControl } = useRefreshControl({
    onRefresh: async () => { await Promise.all([refetchUser(), refetchPosts()]); },
  });

  // Follow/unfollow via backend
  const {
    isFollowing,
    follow,
    unfollow,
    isFollowInProgress,
    isUnfollowInProgress,
  } = useFollowUser(user?.id);

  const { user: currentUser } = useAuth();
  const { mutuals, totalCount: mutualCount } = useMutualFollowers(
    currentUser?.id !== user?.id ? user?.id : undefined
  );

  const error = queryError?.message || (!user && !isLoading ? 'User not found' : null);

  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`
    : username || 'User';

  const avatarUrl = user?.avatar?.url;

  const handleFollow = async () => {
    if (!user?.id || isFollowInProgress || isUnfollowInProgress) return;
    try {
      if (isFollowing) {
        await unfollow();
      } else {
        await follow();
      }
      await refetchPosts();
    } catch (err: any) {
      console.error('Follow error:', err);
      showError(err?.message || 'Failed to update follow status');
    }
  };

  const handleMessage = async () => {
    if (!user?.id) {
      showError('Unable to start chat. Please try again.');
      return;
    }

    if (isCreatingChat) return;

    setIsCreatingChat(true);
    try {
      // Create conversation (backend will dedup existing DMs)
      const conversation = await chatApi.createConversation([user.id]);

      router.push({
        pathname: '/chat/[conversationId]',
        params: { conversationId: conversation.id },
      });
    } catch (err: any) {
      console.error('Error creating chat:', err);
      showError(err?.message || 'Failed to start conversation');
    } finally {
      setIsCreatingChat(false);
    }
  };

  const isSelf = currentUser && user?.id && String(currentUser.id) === String(user.id);

  const menuOptions: ActionSheetOption[] = [
    {
      label: 'Share this profile',
      icon: 'share-outline',
      onPress: async () => {
        try {
          await Share.share({
            message: `Check out ${displayName}'s profile on Status!`,
            url: `status://user/${username}`,
          });
        } catch {}
      },
    },
    {
      label: 'Block',
      icon: 'ban',
      destructive: true,
      onPress: () => setShowBlockConfirm(true),
    },
    {
      label: 'Report',
      icon: 'flag-outline',
      destructive: true,
      onPress: () => setShowReportConfirm(true),
    },
  ];

  // Dynamic styles based on theme
  const dynamicStyles = {
    container: {
      backgroundColor: colors.background,
    },
    headerUsername: {
      color: colors.text,
    },
    avatar: {
      borderColor: colors.borderStrong,
    },
    displayName: {
      color: colors.text,
    },
    bio: {
      color: colors.textSecondary,
    },
    gridHeader: {
      borderTopColor: colors.border,
    },
    gridTabActive: {
      borderBottomColor: colors.text,
    },
    postImage: {
      backgroundColor: colors.backgroundSecondary,
    },
    noPostsText: {
      color: colors.textTertiary,
    },
    errorIconContainer: {
      borderColor: colors.borderStrong,
    },
    errorTitle: {
      color: colors.text,
    },
    errorSubtitle: {
      color: colors.textTertiary,
    },
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer, dynamicStyles.container]}>
        <ActivityIndicator size="large" color={colors.text} />
      </View>
    );
  }

  if (error || !user) {
    return (
      <View style={[styles.container, dynamicStyles.container, { paddingTop: insets.top + 8 }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerIcon}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerUsername, dynamicStyles.headerUsername]}>Profile</Text>
          <View style={styles.headerIcon} />
        </View>
        <View style={styles.errorContainer}>
          <View style={[styles.errorIconContainer, dynamicStyles.errorIconContainer]}>
            <Ionicons name="person-outline" size={48} color={colors.textTertiary} />
          </View>
          <Text style={[styles.errorTitle, dynamicStyles.errorTitle]}>User Not Found</Text>
          <Text style={[styles.errorSubtitle, dynamicStyles.errorSubtitle]}>
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
    <View style={[styles.container, dynamicStyles.container]}>
      {isDark && <DarkGradientBg />}
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
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.headerNameRow}>
            <Text style={[styles.headerUsername, dynamicStyles.headerUsername]} numberOfLines={1}>
              {user.userName ? `@${user.userName}` : displayName}
            </Text>
            {user.isVerified && (
              <MaterialCommunityIcons name="check-decagram" size={16} color={colors.verified} />
            )}
          </View>

          {!isSelf ? (
            <TouchableOpacity
              style={styles.headerIcon}
              activeOpacity={0.7}
              onPress={() => setShowMenu(true)}
            >
              <Ionicons name="ellipsis-horizontal" size={24} color={colors.text} />
            </TouchableOpacity>
          ) : (
            <View style={styles.headerIcon} />
          )}
        </Animated.View>

        {/* Profile Info Row - Same as own profile */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(500).springify()}
          style={styles.profileRow}
        >
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={[styles.avatar, dynamicStyles.avatar]} />
          ) : (
            <Image source={DEFAULT_AVATAR} style={[styles.avatar, dynamicStyles.avatar]} />
          )}
          <View style={styles.statsRow}>
            <StatButton value={userPosts.length} label="Posts" colors={colors} />
            <StatButton
              value={followerCount}
              label="Followers"
              colors={colors}
              onPress={() => { setFollowersSheetTab('followers'); setFollowersSheetVisible(true); }}
            />
            <StatButton
              value={followingCount}
              label="Following"
              colors={colors}
              onPress={() => { setFollowersSheetTab('following'); setFollowersSheetVisible(true); }}
            />
          </View>
        </Animated.View>

        {/* Name and Bio - Same as own profile */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(500).springify()}
          style={styles.bioSection}
        >
          <Text style={[styles.displayName, dynamicStyles.displayName]}>{displayName}</Text>
          {user.bio ? <LinkifiedText style={[styles.bio, dynamicStyles.bio] as any}>{user.bio}</LinkifiedText> : null}
        </Animated.View>

        {/* Mutual Followers */}
        {mutualCount > 0 && (
          <Animated.View
            entering={FadeInDown.delay(250).duration(500).springify()}
            style={styles.mutualsSection}
          >
            <TouchableOpacity
              style={styles.mutualsRow}
              activeOpacity={0.7}
              onPress={() => { setFollowersSheetTab('followers'); setFollowersSheetVisible(true); }}
            >
              <View style={styles.mutualsAvatars}>
                {mutuals.slice(0, 3).map((m, i) => (
                  <Image
                    key={m.id}
                    source={m.avatarUrl ? { uri: m.avatarUrl } : DEFAULT_AVATAR}
                    style={[
                      styles.mutualAvatar,
                      { marginLeft: i > 0 ? -8 : 0, zIndex: 3 - i, borderColor: colors.background },
                    ]}
                  />
                ))}
              </View>
              <Text style={[styles.mutualsText, { color: colors.textSecondary }]} numberOfLines={2}>
                Followed by{' '}
                <Text style={{ fontFamily: 'Lato_700Bold' }}>
                  {mutuals.slice(0, 2).map(m => m.userName || m.firstName || 'User').join(', ')}
                </Text>
                {mutualCount > 2 && (
                  <Text>, and {mutualCount - 2} {mutualCount - 2 === 1 ? 'other' : 'others'}</Text>
                )}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Action Buttons - Follow + Message */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(500).springify()}
          style={styles.actionButtons}
        >
          <TouchableOpacity
            style={[
              styles.actionButton,
              isFollowing ? [styles.actionButtonSecondary, { backgroundColor: colors.buttonSecondary }] : styles.actionButtonPrimary,
              (isFollowInProgress || isUnfollowInProgress) && styles.actionButtonDisabled,
            ]}
            onPress={handleFollow}
            activeOpacity={0.8}
            disabled={isFollowInProgress || isUnfollowInProgress}
          >
            {isFollowInProgress || isUnfollowInProgress ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <Text
                style={[
                  styles.actionButtonText,
                  isFollowing ? { color: colors.text } : styles.actionButtonTextPrimary,
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
              { backgroundColor: colors.buttonSecondary },
              isCreatingChat && styles.actionButtonDisabled,
            ]}
            onPress={handleMessage}
            activeOpacity={0.8}
            disabled={isCreatingChat}
          >
            {isCreatingChat ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <Text style={[styles.actionButtonText, { color: colors.text }]}>Message</Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Grid Header - Same as own profile */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(500).springify()}
          style={[styles.gridHeader, dynamicStyles.gridHeader]}
        >
          <View style={[styles.gridTab, styles.gridTabActive, dynamicStyles.gridTabActive]}>
            <Ionicons name="grid-outline" size={24} color={colors.text} />
          </View>
        </Animated.View>

        {/* Posts Grid */}
        <Animated.View
          entering={FadeInDown.delay(500).duration(500).springify()}
          style={styles.postsGrid}
        >
          {postsLoading ? (
            <View style={styles.postsLoadingContainer}>
              <ActivityIndicator color={colors.text} size="small" />
            </View>
          ) : userPosts.length > 0 ? (
            userPosts.map((post) => (
              <TouchableOpacity
                key={post.id}
                activeOpacity={0.9}
                style={styles.postContainer}
                onPress={() => router.push({ pathname: '/post/[id]', params: { id: post.id } })}
              >
                {post.mediaType === 'video' && post.videoUrl ? (
                  <VideoThumbnailImage
                    videoUrl={post.videoUrl}
                    fallbackUri={post.thumbUrl || post.imageUrl}
                    style={[styles.postImage, dynamicStyles.postImage]}
                  />
                ) : (
                  <Image
                    source={{ uri: post.imageUrl }}
                    style={[styles.postImage, dynamicStyles.postImage]}
                  />
                )}
                {post.mediaType === 'video' && (
                  <View style={styles.videoIndicator}>
                    <Ionicons name="play" size={16} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.noPostsContainer}>
              <Ionicons name="images-outline" size={48} color={colors.textTertiary} />
              <Text style={[styles.noPostsText, dynamicStyles.noPostsText]}>No posts yet</Text>
            </View>
          )}
        </Animated.View>

        {/* Bottom spacing */}
        <View style={{ height: insets.bottom + 100 }} />
      </ScrollView>

      <ActionSheet
        visible={showMenu}
        onClose={() => setShowMenu(false)}
        options={menuOptions}
      />

      <ConfirmModal
        visible={showBlockConfirm}
        onClose={() => setShowBlockConfirm(false)}
        onConfirm={async () => {
          setShowBlockConfirm(false);
          if (!user?.id) return;
          try {
            await usersApi.blockUser(user.id);
            showSuccess(`Blocked ${displayName}`);
            router.back();
          } catch {
            showError('Failed to block user');
          }
        }}
        title="Block User"
        message="They won't be able to find your profile, see your posts, or message you."
        confirmLabel="Block"
        destructive
        icon="ban"
      />

      <ConfirmModal
        visible={showReportConfirm}
        onClose={() => setShowReportConfirm(false)}
        onConfirm={async () => {
          setShowReportConfirm(false);
          if (!user?.id) return;
          try {
            await usersApi.reportUser(user.id, 'inappropriate');
            showSuccess('Report submitted');
          } catch {
            showError('Failed to submit report');
          }
        }}
        title="Report User"
        message="We'll review this report and take action if it violates our guidelines."
        confirmLabel="Report"
        destructive
        icon="flag-outline"
      />

      {user?.id && (
        <FollowersSheet
          visible={followersSheetVisible}
          onClose={() => setFollowersSheetVisible(false)}
          initialTab={followersSheetTab}
          userId={user.id}
          followersCount={followerCount}
          followingCount={followingCount}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  headerNameRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  headerUsername: {
    fontSize: 22,
    fontFamily: 'Lato_700Bold',
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
  },
  statLabel: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    marginTop: 2,
  },
  bioSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  displayName: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    marginBottom: 4,
  },
  bio: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
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
    // backgroundColor set dynamically
  },
  actionButtonDisabled: {
    opacity: 0.7,
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
  },
  actionButtonTextPrimary: {
    color: '#fff',
  },
  gridHeader: {
    flexDirection: 'row',
    borderTopWidth: 1,
  },
  gridTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  gridTabActive: {
    borderBottomWidth: 1,
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: POST_GAP,
  },
  postContainer: {
    position: 'relative',
    width: POST_SIZE,
    height: POST_SIZE,
  },
  postImage: {
    width: '100%',
    height: '100%',
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
  },
  mutualsSection: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  mutualsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mutualsAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mutualAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
  },
  mutualsText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    lineHeight: 16,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 22,
    fontFamily: 'Lato_700Bold',
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
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
