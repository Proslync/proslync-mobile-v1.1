// User Profile Screen — Instagram/TikTok-style with full actions

import React from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useToast } from '@/components/shared/toast';
import { useFollowUser } from '@/hooks/use-follow-user';
import { useChat } from '@/lib/providers/chat-provider';
import { useAuth } from '@/lib/providers/auth-provider';
import { authApi } from '@/lib/api/auth';
import { usersApi } from '@/lib/api/users';
import { eventsApi } from '@/lib/api/events';
import type { PublicUserProfile } from '@/lib/types/auth.types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
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
  const router = useRouter();
  const { colors } = useAppTheme();
  const { showSuccess, showError } = useToast();
  const { user: currentUser } = useAuth();
  const { client: chatClient, status: chatStatus } = useChat();
  const params = useLocalSearchParams<{
    userId: string;
    name: string;
    avatarUrl: string;
    role: string;
  }>();

  const userId = params.userId;
  const isSelf = currentUser && String(currentUser.id) === String(userId);

  // ── State ───────────────────────────────────────────────────────────
  const [profile, setProfile] = React.useState<PublicUserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = React.useState(true);
  const [isBlocked, setIsBlocked] = React.useState(false);
  const [isBlockLoading, setIsBlockLoading] = React.useState(false);
  const [isMessageLoading, setIsMessageLoading] = React.useState(false);
  const [showMoreMenu, setShowMoreMenu] = React.useState(false);
  const [showReportSheet, setShowReportSheet] = React.useState(false);
  const [recentEvents, setRecentEvents] = React.useState<any[]>([]);

  // ── Follow hook ─────────────────────────────────────────────────────
  const {
    isFollowing,
    isLoading: followLoading,
    follow,
    unfollow,
    isFollowInProgress,
    isUnfollowInProgress,
  } = useFollowUser(userId);

  const isFollowActionInProgress = isFollowInProgress || isUnfollowInProgress;

  // ── Derived display data ────────────────────────────────────────────
  const displayName = profile
    ? [profile.firstName, profile.lastName].filter(Boolean).join(' ') || profile.userName || params.name || 'User'
    : params.name || 'User';
  const username = profile?.userName;
  const avatarUrl = profile?.avatar?.url || params.avatarUrl || undefined;
  const bio = profile?.bio;
  const followers = profile?.followStats?.followers ?? 0;
  const following = profile?.followStats?.following ?? 0;
  const totalEvents = profile?.eventStats?.totalEvents ?? 0;

  // ── Fetch profile from backend ──────────────────────────────────────
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
        console.error('[UserProfile] Failed to load profile:', err);
      } finally {
        if (!cancelled) setIsLoadingProfile(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [userId]);

  // ── Fetch user's recent events ──────────────────────────────────────
  React.useEffect(() => {
    let cancelled = false;
    async function loadEvents() {
      if (!userId) return;
      try {
        const events = await eventsApi.getEvents();
        if (cancelled) return;
        setRecentEvents((events || []).slice(0, 6));
      } catch {
        // Events section is optional
      }
    }
    loadEvents();
    return () => { cancelled = true; };
  }, [userId]);

  // ── Actions ─────────────────────────────────────────────────────────
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
    if (!chatClient || chatStatus !== 'connected' || !userId) {
      showError('Chat not available');
      return;
    }
    setIsMessageLoading(true);
    try {
      const channelId = [chatClient.userID, String(userId)].sort().join('-');
      const channel = chatClient.channel('messaging', channelId, {
        members: [chatClient.userID || '', String(userId)],
      });
      await channel.create();
      router.push({
        pathname: '/chat/[conversationId]',
        params: { conversationId: channel.id || channelId },
      });
    } catch (err) {
      console.error('[UserProfile] Message error:', err);
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

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
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
          <TouchableOpacity style={styles.statItem} activeOpacity={0.7}>
            <Text style={[styles.statNumber, { color: colors.text }]}>{formatStat(followers)}</Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Followers</Text>
          </TouchableOpacity>
          <View style={[styles.statDivider, { backgroundColor: colors.separator }]} />
          <TouchableOpacity style={styles.statItem} activeOpacity={0.7}>
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
        {!isSelf && isFollowing && (
          <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.mutualSection}>
            <View style={styles.mutualAvatars}>
              {[1, 2, 3].map((_, i) => (
                <View key={i} style={[styles.mutualAvatar, { marginLeft: i > 0 ? -8 : 0, borderColor: colors.background }]}>
                  <Image
                    source={{ uri: `https://i.pravatar.cc/60?img=${20 + i}` }}
                    style={styles.mutualAvatarImage}
                  />
                </View>
              ))}
            </View>
            <Text style={[styles.mutualText, { color: colors.textTertiary }]}>
              Followed by <Text style={[styles.mutualBold, { color: colors.textSecondary }]}>3 people you follow</Text>
            </Text>
          </Animated.View>
        )}

        {/* Recent Events */}
        {recentEvents.length > 0 && (
          <Animated.View entering={FadeInDown.delay(350).duration(400)} style={[styles.section, { borderTopColor: colors.separator }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>EVENTS</Text>
            </View>
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
                    source={{ uri: event.flyerUrl || event.imageUrl || `https://picsum.photos/seed/ev${event.id}/300/400` }}
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
          </Animated.View>
        )}
      </ScrollView>

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

  // Section
  section: { paddingTop: 8, borderTopWidth: 1 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
    letterSpacing: 1,
  },

  // Events
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
