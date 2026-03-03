// User Profile Screen — Consolidated profile with full actions, posts grid, followers sheet

import React from 'react';
import { useStableRouter } from '@/hooks/use-stable-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  Share,
  Alert,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useToast } from '@/components/shared/toast';
import { useFollowUser } from '@/hooks/use-follow-user';
import { useUserFeed } from '@/hooks/use-user-feed';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { useMutualFollowers } from '@/hooks/use-mutual-followers';
import { FollowersSheet } from '@/components/feed/followers-sheet';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { chatApi } from '@/lib/api/chat';
import { useAuth } from '@/lib/providers/auth-provider';
import { authApi } from '@/lib/api/auth';
import { usersApi } from '@/lib/api/users';
import { eventsApi } from '@/lib/api/events';
import type { PublicUserProfile } from '@/lib/types/auth.types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const POST_SIZE = (SCREEN_WIDTH - 6) / 3;
const DefaultAvatarImage = require('@/assets/images/default-avatar.png');

const REPORT_REASONS = [
  { id: 'spam', label: 'Spam or scam' },
  { id: 'harassment', label: 'Harassment or bullying' },
  { id: 'inappropriate', label: 'Inappropriate content' },
  { id: 'impersonation', label: 'Pretending to be someone else' },
  { id: 'other', label: 'Something else' },
];

export default function UserProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useStableRouter();
  const { colors, isDark } = useAppTheme();
  const { showSuccess, showError } = useToast();
  const { user: currentUser } = useAuth();
  const params = useLocalSearchParams<{
    userId: string;
    username: string;
    name: string;
    avatarUrl: string;
    role: string;
  }>();

  const needsLookup = params.userId === 'lookup' && !!params.username;
  const [resolvedUserId, setResolvedUserId] = React.useState<string | undefined>(needsLookup ? undefined : params.userId);
  const userId = resolvedUserId;
  const isSelf = currentUser && userId && String(currentUser.id) === String(userId);

  const [profile, setProfile] = React.useState<PublicUserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = React.useState(true);
  const [isBlocked, setIsBlocked] = React.useState(false);
  const [isBlockLoading, setIsBlockLoading] = React.useState(false);
  const [isMessageLoading, setIsMessageLoading] = React.useState(false);
  const [showMoreMenu, setShowMoreMenu] = React.useState(false);
  const [showReportSheet, setShowReportSheet] = React.useState(false);
  const [recentEvents, setRecentEvents] = React.useState<any[]>([]);
  const [followersSheetVisible, setFollowersSheetVisible] = React.useState(false);
  const [followersSheetTab, setFollowersSheetTab] = React.useState<'followers' | 'following'>('followers');
  const [contentTab, setContentTab] = React.useState<'posts' | 'events'>('posts');

  const {
    isFollowing,
    isLoading: followLoading,
    follow,
    unfollow,
    isFollowInProgress,
    isUnfollowInProgress,
  } = useFollowUser(userId);

  const isFollowActionInProgress = isFollowInProgress || isUnfollowInProgress;

  // Posts grid
  const { activities: userPosts, isLoading: postsLoading, refetch: refetchPosts } = useUserFeed(userId);

  // Mutual followers
  const { mutualFollowers, totalMutualCount } = useMutualFollowers(!isSelf ? userId : undefined);

  const displayName = profile
    ? [profile.firstName, profile.lastName].filter(Boolean).join(' ') || profile.userName || params.name || 'User'
    : params.name || 'User';
  const username = profile?.userName;
  const avatarUrl = profile?.avatar?.url || params.avatarUrl || undefined;
  const bio = profile?.bio;
  const followers = profile?.followStats?.followers ?? 0;
  const following = profile?.followStats?.following ?? 0;
  const totalEvents = profile?.eventStats?.totalEvents ?? 0;

  // Username lookup (for @mention navigation where only username is known)
  React.useEffect(() => {
    if (params.userId && params.userId !== 'lookup') {
      setResolvedUserId(params.userId);
      return;
    }
    if (!params.username) return;

    let cancelled = false;
    async function lookupByUsername() {
      try {
        const result = await authApi.getUserByUsername(params.username);
        if (cancelled) return;
        if (result) {
          setResolvedUserId(String(result.id));
        } else {
          setIsLoadingProfile(false);
        }
      } catch {
        if (!cancelled) setIsLoadingProfile(false);
      }
    }
    lookupByUsername();
    return () => { cancelled = true; };
  }, [params.userId, params.username]);

  // Load profile + block status
  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!userId) return;
      setIsLoadingProfile(true);
      try {
        const numericId = Number(userId);
        if (isNaN(numericId)) return;
        const [profileData, blockStatus] = await Promise.all([
          authApi.getUserById(numericId),
          usersApi.getBlockStatus(numericId),
        ]);
        if (cancelled) return;
        if (profileData) setProfile(profileData);
        setIsBlocked(blockStatus.isBlocked);
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        if (!cancelled) setIsLoadingProfile(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [userId]);

  // Load recent events
  React.useEffect(() => {
    let cancelled = false;
    async function loadEvents() {
      if (!userId) return;
      try {
        const events = await eventsApi.getUserEvents(Number(userId), {
          limit: 8,
          sortBy: 'registered',
          sortOrder: 'desc',
        });
        if (cancelled) return;
        setRecentEvents(events || []);
      } catch {
        // Events section is optional
      }
    }
    loadEvents();
    return () => { cancelled = true; };
  }, [userId]);

  // Pull-to-refresh
  const handleRefresh = React.useCallback(async () => {
    if (!userId) return;
    const numericId = Number(userId);
    if (isNaN(numericId)) return;
    await Promise.all([
      authApi.getUserById(numericId).then(p => { if (p) setProfile(p); }).catch(() => {}),
      refetchPosts(),
    ]);
  }, [userId, refetchPosts]);

  const { refreshControl } = useRefreshControl({ onRefresh: handleRefresh });

  const handleFollowPress = async () => {
    if (isFollowActionInProgress || followLoading) return;
    try {
      if (isFollowing) {
        await unfollow();
        showSuccess('Unfollowed');
      } else {
        await follow();
        showSuccess('Following');
      }
    } catch (error: any) {
      showError(error?.message || 'Failed to update follow');
    }
  };

  const handleMessagePress = async () => {
    if (!userId) {
      showError('Chat not available');
      return;
    }
    setIsMessageLoading(true);
    try {
      const conversation = await chatApi.createConversation([Number(userId)]);
      router.push({
        pathname: '/chat/[conversationId]',
        params: { conversationId: conversation.id },
      });
    } catch (err) {
      console.error('Message error:', err);
      showError('Could not open conversation');
    } finally {
      setIsMessageLoading(false);
    }
  };

  const handleBlockPress = () => {
    const action = isBlocked ? 'Unblock' : 'Block';
    Alert.alert(
      `${action} ${displayName}?`,
      isBlocked
        ? 'They will be able to find your profile and message you again.'
        : 'They won\'t be able to find your profile, see your posts, or message you.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action,
          style: isBlocked ? 'default' : 'destructive',
          onPress: async () => {
            setIsBlockLoading(true);
            try {
              const numericId = Number(userId);
              if (isBlocked) {
                await usersApi.unblockUser(numericId);
                setIsBlocked(false);
                showSuccess(`Unblocked ${displayName}`);
              } else {
                await usersApi.blockUser(numericId);
                setIsBlocked(true);
                showSuccess(`Blocked ${displayName}`);
              }
            } catch {
              showError(`Failed to ${action.toLowerCase()} user`);
            } finally {
              setIsBlockLoading(false);
            }
          },
        },
      ],
    );
    setShowMoreMenu(false);
  };

  const handleReportPress = (reasonId: string) => {
    const reason = REPORT_REASONS.find(r => r.id === reasonId);
    setShowReportSheet(false);
    setShowMoreMenu(false);
    Alert.alert(
      'Report this account?',
      `Reason: ${reason?.label}\n\nWe'll review this report and take action if it violates our guidelines.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          style: 'destructive',
          onPress: async () => {
            try {
              await usersApi.reportUser(Number(userId), reasonId);
              showSuccess('Report submitted');
            } catch {
              showError('Failed to submit report');
            }
          },
        },
      ],
    );
  };

  const handleSharePress = async () => {
    setShowMoreMenu(false);
    try {
      await Share.share({
        message: `Check out ${displayName}'s profile on Status!`,
        url: `https://statusapp.us/user/${userId}`,
      });
    } catch { /* cancelled */ }
  };

  const handleCopyLink = () => {
    setShowMoreMenu(false);
    showSuccess('Profile link copied');
  };

  const handleRestrictPress = async () => {
    setShowMoreMenu(false);
    try {
      await usersApi.restrictUser(Number(userId));
      showSuccess(`Restricted ${displayName}`);
    } catch {
      showError('Failed to restrict user');
    }
  };

  function formatStat(n: number): string {
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 10000) return (n / 1000).toFixed(0) + 'K';
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return String(n);
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      {isDark && <DarkGradientBg />}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {username ? `@${username}` : displayName}
        </Text>

        {!isSelf ? (
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => setShowMoreMenu(!showMoreMenu)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="ellipsis-horizontal" size={24} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerBtn} />
        )}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
      >
        {/* Profile Section */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Image
              source={avatarUrl ? { uri: avatarUrl } : DefaultAvatarImage}
              style={[styles.avatar, { borderColor: colors.border }]}
            />
            {!isSelf && <View style={styles.onlineIndicator} />}
          </View>

          <View style={styles.nameRow}>
            <Text style={[styles.displayName, { color: colors.text }]} numberOfLines={1}>
              {displayName}
            </Text>
            <MaterialCommunityIcons name="check-decagram" size={18} color={colors.verified} />
          </View>

          {username && (
            <Text style={[styles.username, { color: colors.textTertiary }]}>@{username}</Text>
          )}

          {bio ? (
            <Text style={[styles.bio, { color: colors.textSecondary }]} numberOfLines={3}>
              {bio}
            </Text>
          ) : null}
        </Animated.View>

        {/* Stats Row */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={[styles.statsRow, { backgroundColor: colors.cardElevated, borderColor: colors.border }]}>
          <TouchableOpacity
            style={styles.statItem}
            activeOpacity={0.7}
            onPress={() => { setFollowersSheetTab('followers'); setFollowersSheetVisible(true); }}
          >
            <Text style={[styles.statNumber, { color: colors.text }]}>{formatStat(followers)}</Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Followers</Text>
          </TouchableOpacity>
          <View style={[styles.statDivider, { backgroundColor: colors.separator }]} />
          <TouchableOpacity
            style={styles.statItem}
            activeOpacity={0.7}
            onPress={() => { setFollowersSheetTab('following'); setFollowersSheetVisible(true); }}
          >
            <Text style={[styles.statNumber, { color: colors.text }]}>{formatStat(following)}</Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Following</Text>
          </TouchableOpacity>
          <View style={[styles.statDivider, { backgroundColor: colors.separator }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.text }]}>{formatStat(totalEvents)}</Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Events</Text>
          </View>
        </Animated.View>

        {/* Action Buttons */}
        {!isSelf && (
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.buttonSecondary, borderColor: colors.border }, isFollowing && { backgroundColor: colors.cardElevated }]}
              onPress={handleFollowPress}
              activeOpacity={0.8}
              disabled={isFollowActionInProgress}
            >
              {isFollowActionInProgress ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <>
                  <Ionicons
                    name={isFollowing ? 'checkmark' : 'person-add-outline'}
                    size={16}
                    color={isFollowing ? colors.textTertiary : colors.text}
                  />
                  <Text style={[styles.actionBtnText, { color: isFollowing ? colors.textTertiary : colors.text }]}>
                    {isFollowing ? 'Following' : 'Follow'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.buttonSecondary, borderColor: colors.border }]}
              onPress={handleMessagePress}
              activeOpacity={0.8}
              disabled={isMessageLoading}
            >
              {isMessageLoading ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <>
                  <Ionicons name="chatbubble-outline" size={16} color={colors.text} />
                  <Text style={[styles.actionBtnText, { color: colors.text }]}>Message</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtnIcon, { backgroundColor: colors.buttonSecondary, borderColor: colors.border }]}
              onPress={handleSharePress}
              activeOpacity={0.8}
            >
              <Ionicons name="paper-plane-outline" size={18} color={colors.text} />
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Mutual Connections */}
        {!isSelf && totalMutualCount > 0 && (
          <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.mutualSection}>
            <View style={styles.mutualAvatars}>
              {mutualFollowers.slice(0, 3).map((u, i) => (
                <View key={u.id} style={[styles.mutualAvatar, { marginLeft: i > 0 ? -8 : 0, borderColor: colors.background }]}>
                  <Image
                    source={u.avatarUrl ? { uri: u.avatarUrl } : DefaultAvatarImage}
                    style={styles.mutualAvatarImage}
                  />
                </View>
              ))}
            </View>
            <Text style={[styles.mutualText, { color: colors.textTertiary }]}>
              Followed by{' '}
              <Text style={[styles.mutualBold, { color: colors.textSecondary }]}>
                {totalMutualCount === 1
                  ? `${mutualFollowers[0]?.firstName || mutualFollowers[0]?.userName || '1 person'} you follow`
                  : `${totalMutualCount} people you follow`}
              </Text>
            </Text>
          </Animated.View>
        )}

        {/* Content Tabs */}
        <Animated.View entering={FadeInDown.delay(350).duration(400)} style={[styles.contentTabs, { borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.contentTab, contentTab === 'posts' && { borderBottomColor: colors.text, borderBottomWidth: 1 }]}
            onPress={() => setContentTab('posts')}
            activeOpacity={0.7}
          >
            <Ionicons name="grid-outline" size={24} color={contentTab === 'posts' ? colors.text : colors.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.contentTab, contentTab === 'events' && { borderBottomColor: colors.text, borderBottomWidth: 1 }]}
            onPress={() => setContentTab('events')}
            activeOpacity={0.7}
          >
            <Ionicons name="calendar-outline" size={24} color={contentTab === 'events' ? colors.text : colors.textTertiary} />
          </TouchableOpacity>
        </Animated.View>

        {/* Tab Content */}
        {contentTab === 'posts' ? (
          <View style={styles.postsGrid}>
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
                  onPress={() => router.push({
                    pathname: '/post/[id]',
                    params: { id: post.id },
                  })}
                >
                  <Image
                    source={{ uri: post.imageUrl || post.videoUrl }}
                    style={[styles.postImage, { backgroundColor: colors.backgroundSecondary }]}
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
                <Ionicons name="images-outline" size={48} color={colors.textTertiary} />
                <Text style={[styles.noPostsText, { color: colors.textTertiary }]}>No posts yet</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.eventsTabContent}>
            {recentEvents.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.eventsScroll}
              >
                {recentEvents.map((event: any) => (
                  <TouchableOpacity
                    key={event.id}
                    style={[styles.eventCard, { backgroundColor: colors.cardElevated }]}
                    activeOpacity={0.85}
                    onPress={() => router.push({
                      pathname: '/event/[id]',
                      params: { id: String(event.id) },
                    })}
                  >
                    <Image
                      source={{ uri: event.flyer?.url || event.flyerUrl || event.imageUrl || undefined }}
                      style={styles.eventImage}
                    />
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.8)']}
                      style={styles.eventGradient}
                    />
                    <View style={styles.eventInfo}>
                      <Text style={styles.eventTitle} numberOfLines={1}>
                        {event.title || event.name || 'Event'}
                      </Text>
                      <Text style={styles.eventDate} numberOfLines={1}>
                        {event.date || event.startDate || ''}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.noPostsContainer}>
                <Ionicons name="calendar-outline" size={48} color={colors.textTertiary} />
                <Text style={[styles.noPostsText, { color: colors.textTertiary }]}>No events yet</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Followers Sheet */}
      {userId && (
        <FollowersSheet
          visible={followersSheetVisible}
          onClose={() => setFollowersSheetVisible(false)}
          initialTab={followersSheetTab}
          userId={Number(userId)}
          followersCount={followers}
          followingCount={following}
          currentUserId={currentUser?.id}
        />
      )}

      {/* More Menu Overlay */}
      {showMoreMenu && (
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => { setShowMoreMenu(false); setShowReportSheet(false); }}
        >
          <Animated.View entering={FadeInUp.duration(250)} style={[styles.menuSheet, { paddingBottom: insets.bottom + 16, backgroundColor: colors.backgroundSecondary }]}>
            <View style={[styles.menuHandle, { backgroundColor: colors.textTertiary }]} />

            {showReportSheet ? (
              <>
                <Text style={[styles.menuSheetTitle, { color: colors.text }]}>Why are you reporting this account?</Text>
                {REPORT_REASONS.map((reason) => (
                  <TouchableOpacity
                    key={reason.id}
                    style={styles.menuItem}
                    onPress={() => handleReportPress(reason.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.menuItemText, { color: colors.text }]}>{reason.label}</Text>
                    <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[styles.menuItemCancel, { borderTopColor: colors.separator }]}
                  onPress={() => setShowReportSheet(false)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.menuItemCancelText, { color: colors.textTertiary }]}>Back</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleBlockPress}
                  activeOpacity={0.7}
                  disabled={isBlockLoading}
                >
                  <View style={styles.menuItemLeft}>
                    <Ionicons
                      name={isBlocked ? 'lock-open-outline' : 'ban'}
                      size={20}
                      color={isBlocked ? colors.text : '#ff4444'}
                    />
                    <Text style={[styles.menuItemText, { color: isBlocked ? colors.text : '#ff4444' }]}>
                      {isBlocked ? 'Unblock' : 'Block'}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => setShowReportSheet(true)}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuItemLeft}>
                    <Ionicons name="flag-outline" size={20} color="#ff4444" />
                    <Text style={[styles.menuItemText, { color: '#ff4444' }]}>Report</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleRestrictPress}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuItemLeft}>
                    <Ionicons name="eye-off-outline" size={20} color={colors.text} />
                    <Text style={[styles.menuItemText, { color: colors.text }]}>Restrict</Text>
                  </View>
                </TouchableOpacity>

                <View style={[styles.menuDivider, { backgroundColor: colors.separator }]} />

                <TouchableOpacity style={styles.menuItem} onPress={handleSharePress} activeOpacity={0.7}>
                  <View style={styles.menuItemLeft}>
                    <Ionicons name="share-outline" size={20} color={colors.text} />
                    <Text style={[styles.menuItemText, { color: colors.text }]}>Share this profile</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={handleCopyLink} activeOpacity={0.7}>
                  <View style={styles.menuItemLeft}>
                    <Ionicons name="link-outline" size={20} color={colors.text} />
                    <Text style={[styles.menuItemText, { color: colors.text }]}>Copy profile link</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.menuItemCancel, { borderTopColor: colors.separator }]}
                  onPress={() => setShowMoreMenu(false)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.menuItemCancelText, { color: colors.textTertiary }]}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
        </TouchableOpacity>
      )}

      {/* Loading overlay */}
      {isLoadingProfile && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.textTertiary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    height: 48,
  },
  headerBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
  },

  // Scroll
  scrollView: { flex: 1 },
  scrollContent: { paddingTop: 8 },

  // Profile section
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#34C759',
    borderWidth: 2.5,
    borderColor: '#000',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  displayName: {
    fontSize: 22,
    fontFamily: 'Lato_700Bold',
    maxWidth: SCREEN_WIDTH - 100,
  },
  username: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    marginBottom: 10,
  },
  bio: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: SCREEN_WIDTH - 80,
    marginTop: 4,
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 32,
    marginTop: 20,
    marginBottom: 20,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: {
    fontSize: 20,
    fontFamily: 'Lato_700Bold',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
  },
  statDivider: { width: 1, height: 28 },

  // Action buttons
  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 20,
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
  },
  actionBtnIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  // Mutual
  mutualSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 10,
  },
  mutualAvatars: { flexDirection: 'row' },
  mutualAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    overflow: 'hidden',
  },
  mutualAvatarImage: { width: '100%', height: '100%' },
  mutualText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
  },
  mutualBold: { fontFamily: 'Lato_700Bold' },

  // Content tabs
  contentTabs: {
    flexDirection: 'row',
    borderTopWidth: 1,
    marginTop: 8,
  },
  contentTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },

  // Events
  eventsTabContent: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  eventsScroll: { paddingHorizontal: 24, gap: 12, paddingBottom: 8 },
  eventCard: {
    width: 140,
    height: 190,
    borderRadius: 14,
    overflow: 'hidden',
  },
  eventImage: { width: '100%', height: '100%' },
  eventGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
  },
  eventInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
  },
  eventTitle: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
    marginBottom: 2,
  },
  eventDate: {
    fontSize: 11,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.6)',
  },

  // Posts grid
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

  // More menu
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  menuSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  menuHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  menuSheetTitle: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  menuItemText: {
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
  },
  menuDivider: { height: 1, marginVertical: 4 },
  menuItemCancel: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 4,
    borderTopWidth: 1,
  },
  menuItemCancelText: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
  },

  // Loading
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
});
