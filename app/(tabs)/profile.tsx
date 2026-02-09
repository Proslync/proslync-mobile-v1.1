import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Modal,
  FlatList,
  Share,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, {
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import { useAuth } from '@/lib/providers/auth-provider';
import { useUserActivities } from '@/hooks/use-user-activities';
import { useUserFollowers, useUserFollowing } from '@/hooks/use-user-follows';
import { useFollowUser } from '@/hooks/use-follow-user';
import { useToast } from '@/components/shared/toast';
import { useTabNavigation } from '@/lib/providers/tab-navigation-provider';
import { SwipeableTabView } from '@/components/shared/swipeable-tab-view';
import { LinkifiedText } from '@/components/shared/linkified-text';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { useAppTheme } from '@/hooks/use-app-theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const POST_SIZE = (SCREEN_WIDTH - 6) / 3; // 3 columns with 2px gaps

// Default avatar placeholder
const DEFAULT_AVATAR = 'https://picsum.photos/200';

// Storage key for saved accounts
const SAVED_ACCOUNTS_KEY = 'saved_accounts';

interface SavedAccount {
  id: number;
  phoneNumber: string;
  userName?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  accessToken?: string;
  refreshToken?: string;
}

function StatButton({
  value,
  label,
  onPress,
}: {
  value: number;
  label: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.statButton}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

interface FollowUser {
  id: string;
  userName: string;
  firstName: string;
  lastName: string;
  avatar: string;
}

// Individual user item with follow/unfollow functionality
function UserListItem({
  user,
  currentUserId,
}: {
  user: FollowUser;
  currentUserId?: number;
}) {
  const router = useRouter();
  const {
    isFollowing,
    isLoading: followLoading,
    follow,
    unfollow,
    isFollowInProgress,
    isUnfollowInProgress,
  } = useFollowUser(user.id);

  const isSelf = currentUserId?.toString() === user.id;
  const isActionInProgress = isFollowInProgress || isUnfollowInProgress;

  const handleFollowPress = async () => {
    if (isActionInProgress) return;

    if (isFollowing) {
      await unfollow();
    } else {
      await follow();
    }
  };

  const handleUserPress = () => {
    router.push({
      pathname: '/user-profile/[userId]',
      params: { userId: user.id },
    });
  };

  return (
    <TouchableOpacity
      style={styles.userListItem}
      activeOpacity={0.7}
      onPress={handleUserPress}
    >
      <Image source={{ uri: user.avatar }} style={styles.userListAvatar} />
      <View style={styles.userListInfo}>
        <Text style={styles.userListName}>{user.userName}</Text>
        <Text style={styles.userListFullName}>
          {user.firstName} {user.lastName}
        </Text>
      </View>
      {!isSelf && (
        <TouchableOpacity
          style={[
            styles.followButton,
            isFollowing && styles.followingButton,
          ]}
          activeOpacity={0.8}
          onPress={handleFollowPress}
          disabled={followLoading || isActionInProgress}
        >
          {isActionInProgress ? (
            <ActivityIndicator size="small" color={isFollowing ? '#1a1a1a' : '#fff'} />
          ) : (
            <Text
              style={[
                styles.followButtonText,
                isFollowing && styles.followingButtonText,
              ]}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          )}
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

function UserListModal({
  visible,
  title,
  users,
  isLoading,
  onClose,
  currentUserId,
}: {
  visible: boolean;
  title: string;
  users: FollowUser[];
  isLoading?: boolean;
  onClose: () => void;
  currentUserId?: number;
}) {
  const insets = useSafeAreaInsets();

  const renderUser = ({ item }: { item: FollowUser }) => (
    <UserListItem user={item} currentUserId={currentUserId} />
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
            <Ionicons name="close" size={28} color="#1a1a1a" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{title}</Text>
          <View style={styles.modalCloseButton} />
        </View>
        {isLoading ? (
          <View style={styles.modalLoadingContainer}>
            <ActivityIndicator color="#1a1a1a" size="large" />
          </View>
        ) : users.length > 0 ? (
          <FlatList
            data={users}
            renderItem={renderUser}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.userList}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.modalEmptyContainer}>
            <Text style={styles.modalEmptyText}>No {title.toLowerCase()} yet</Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

function AccountSwitcherModal({
  visible,
  currentUserId,
  savedAccounts,
  onClose,
  onSelectAccount,
  onAddAccount,
}: {
  visible: boolean;
  currentUserId?: number;
  savedAccounts: SavedAccount[];
  onClose: () => void;
  onSelectAccount: (account: SavedAccount) => void;
  onAddAccount: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
            <Ionicons name="close" size={28} color="#1a1a1a" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Switch Account</Text>
          <View style={styles.modalCloseButton} />
        </View>

        <ScrollView style={styles.accountList} showsVerticalScrollIndicator={false}>
          {savedAccounts.map((account) => {
            const isCurrentAccount = account.id === currentUserId;
            const displayName = account.firstName
              ? `${account.firstName}${account.lastName ? ' ' + account.lastName : ''}`
              : account.userName || 'User';

            return (
              <TouchableOpacity
                key={account.id}
                style={styles.accountItem}
                onPress={() => !isCurrentAccount && onSelectAccount(account)}
                activeOpacity={isCurrentAccount ? 1 : 0.7}
              >
                <Image
                  source={{ uri: account.avatarUrl || DEFAULT_AVATAR }}
                  style={styles.accountAvatar}
                />
                <View style={styles.accountInfo}>
                  <Text style={styles.accountUsername}>
                    {account.userName || 'username'}
                  </Text>
                  <Text style={styles.accountName}>{displayName}</Text>
                </View>
                {isCurrentAccount && (
                  <Ionicons name="checkmark-circle" size={24} color="#0095f6" />
                )}
              </TouchableOpacity>
            );
          })}

          {/* Add Account Button */}
          <TouchableOpacity
            style={styles.addAccountButton}
            onPress={onAddAccount}
            activeOpacity={0.7}
          >
            <View style={styles.addAccountIcon}>
              <Ionicons name="add" size={24} color="#1a1a1a" />
            </View>
            <Text style={styles.addAccountText}>Add Account</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, isLoading, logout, switchAccount } = useAuth();
  const { showSuccess, showError } = useToast();
  const { isAccountSwitcherOpen, closeAccountSwitcher, openAccountSwitcher } = useTabNavigation();
  const { colors, isDark } = useAppTheme();
  const [showFollowers, setShowFollowers] = React.useState(false);
  const [showFollowing, setShowFollowing] = React.useState(false);
  const [savedAccounts, setSavedAccounts] = React.useState<SavedAccount[]>([]);
  const lastTapRef = React.useRef<number>(0);

  // Fetch posts/activities from GetStream
  const { activities: userPosts, isLoading: postsLoading, refetch: refetchPosts } = useUserActivities(user?.id);

  // Fetch followers/following from backend API
  // Fetches on mount to get counts, data is cached for modal
  const {
    followers,
    totalFollowers: followerCount,
    isLoading: followersLoading,
    refetch: refetchFollowers,
  } = useUserFollowers(user?.id);

  const {
    following,
    totalFollowing: followingCount,
    isLoading: followingLoading,
    refetch: refetchFollowing,
  } = useUserFollowing(user?.id);

  // Pull-to-refresh
  const { refreshControl } = useRefreshControl({
    onRefresh: async () => {
      await Promise.all([refetchPosts(), refetchFollowers(), refetchFollowing()]);
    },
    tintColor: '#1a1a1a',
  });

  // Derive display values from user data
  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`
    : 'User';
  const username = user?.userName || 'username';
  const bio = user?.bio || '';
  const avatarUrl = user?.avatar?.url || DEFAULT_AVATAR;

  // Use real counts from activities
  const postsCount = userPosts.length;

  // Load saved accounts from storage on mount
  React.useEffect(() => {
    async function loadSavedAccounts() {
      try {
        const stored = await AsyncStorage.getItem(SAVED_ACCOUNTS_KEY);
        if (stored) {
          const accounts = JSON.parse(stored) as SavedAccount[];
          setSavedAccounts(accounts);
          console.log('[Profile] Loaded saved accounts:', accounts.length);
        }
      } catch (error) {
        console.error('[Profile] Error loading saved accounts:', error);
      }
    }
    loadSavedAccounts();
  }, []);

  // Add current user to saved accounts if not already there
  React.useEffect(() => {
    async function saveCurrentAccount() {
      if (!user) return;

      // Get current tokens to save with account (keys must match config.auth)
      const accessToken = await AsyncStorage.getItem('accessToken');
      const refreshToken = await AsyncStorage.getItem('refreshToken');

      setSavedAccounts((prev) => {
        const exists = prev.some((a) => a.id === user.id);
        if (!exists) {
          const newAccount: SavedAccount = {
            id: user.id,
            phoneNumber: user.phoneNumber,
            userName: user.userName,
            firstName: user.firstName,
            lastName: user.lastName,
            avatarUrl: user.avatar?.url,
            accessToken: accessToken || undefined,
            refreshToken: refreshToken || undefined,
          };
          const updated = [...prev, newAccount];
          // Save to storage
          AsyncStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(updated))
            .then(() => console.log('[Profile] Saved new account to storage'))
            .catch((err) => console.error('[Profile] Error saving account:', err));
          return updated;
        } else {
          // Update existing account info (in case user updated their profile or got new tokens)
          const updated = prev.map((a) =>
            a.id === user.id
              ? {
                  ...a,
                  userName: user.userName,
                  firstName: user.firstName,
                  lastName: user.lastName,
                  avatarUrl: user.avatar?.url,
                  accessToken: accessToken || a.accessToken,
                  refreshToken: refreshToken || a.refreshToken,
                }
              : a
          );
          // Save updated info to storage
          AsyncStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(updated))
            .catch((err) => console.error('[Profile] Error updating account:', err));
          return updated;
        }
      });
    }
    saveCurrentAccount();
  }, [user]);

  const handleAvatarDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap detected - show account switcher
      openAccountSwitcher();
    }
    lastTapRef.current = now;
  };

  const handleSelectAccount = async (account: SavedAccount) => {
    if (!account.accessToken) {
      showError(`Session expired for @${account.userName || 'user'}. Please log in again.`);
      closeAccountSwitcher();
      return;
    }

    closeAccountSwitcher();

    // Try to switch to the account using saved tokens
    const success = await switchAccount(account.accessToken, account.refreshToken);

    if (success) {
      showSuccess(`Switched to @${account.userName || 'user'}`);
    } else {
      showError(`Session expired for @${account.userName || 'user'}. Please log in again.`);
    }
  };

  const handleAddAccount = () => {
    closeAccountSwitcher();
    // Navigate to sign in screen to add new account
    logout();
  };

  const handleShareProfile = async () => {
    try {
      await Share.share({
        message: `Check out @${username} on Status!`,
        url: `https://status.app/user/${username}`,
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  if (isLoading) {
    return (
      <SwipeableTabView>
        <View style={[styles.container, styles.loadingContainer, { backgroundColor: colors.background }]}>
          <DarkGradientBg />
          <ActivityIndicator size="large" color={colors.text} />
        </View>
      </SwipeableTabView>
    );
  }

  return (
    <SwipeableTabView>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
      <DarkGradientBg />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 8 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
      >
        {/* Header - Centered Username */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
          <TouchableOpacity style={styles.headerIcon} activeOpacity={0.7}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.usernameButton}
            onPress={openAccountSwitcher}
            activeOpacity={0.7}
          >
            <Text style={[styles.headerUsername, { color: colors.text }]}>{username}</Text>
            <Ionicons name="chevron-down" size={20} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerIcon}
            activeOpacity={0.7}
            onPress={() => router.push('/settings')}
          >
            <Ionicons name="settings-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </Animated.View>

        {/* Profile Info Row */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(500).springify()}
          style={styles.profileRow}
        >
          <TouchableOpacity onPress={handleAvatarDoubleTap} activeOpacity={0.9}>
            <Image source={{ uri: avatarUrl }} style={[styles.avatar, { borderColor: colors.border }]} />
          </TouchableOpacity>
          <View style={styles.statsRow}>
            <TouchableOpacity style={styles.statButton} activeOpacity={1}>
              <Text style={[styles.statValue, { color: colors.text }]}>{postsCount}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Posts</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.statButton}
              activeOpacity={0.7}
              onPress={() => setShowFollowers(true)}
            >
              <Text style={[styles.statValue, { color: colors.text }]}>{followerCount}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Followers</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.statButton}
              activeOpacity={0.7}
              onPress={() => setShowFollowing(true)}
            >
              <Text style={[styles.statValue, { color: colors.text }]}>{followingCount}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Following</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Name and Bio */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(500).springify()}
          style={styles.bioSection}
        >
          <Text style={[styles.displayName, { color: colors.text }]}>{displayName}</Text>
          {bio ? <LinkifiedText style={{ ...styles.bio, color: colors.textSecondary }}>{bio}</LinkifiedText> : null}
        </Animated.View>

        {/* Dashboard Button */}
        <Animated.View
          entering={FadeInDown.delay(250).duration(500).springify()}
          style={styles.dashboardButtonContainer}
        >
          <TouchableOpacity
            style={[styles.dashboardButton, { backgroundColor: colors.buttonSecondary }]}
            activeOpacity={0.8}
            onPress={() => router.push('/dashboard')}
          >
            <Ionicons name="grid-outline" size={18} color={colors.text} />
            <Text style={[styles.dashboardButtonText, { color: colors.text }]}>Dashboard</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Action Buttons - Edit Profile and Share Profile */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(500).springify()}
          style={styles.actionButtons}
        >
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.buttonSecondary }]}
            activeOpacity={0.8}
            onPress={() => router.push('/edit-profile')}
          >
            <Text style={[styles.actionButtonText, { color: colors.text }]}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.shareButton]}
            activeOpacity={0.8}
            onPress={handleShareProfile}
          >
            <Text style={[styles.actionButtonText, styles.shareButtonText]}>Share Profile</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Posts Grid Header */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(500).springify()}
          style={[styles.gridHeader, { borderTopColor: colors.border }]}
        >
          <View style={[styles.gridTab, styles.gridTabActive, { borderBottomColor: colors.text }]}>
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
              <TouchableOpacity key={post.id} activeOpacity={0.9} style={styles.postContainer}>
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
        </Animated.View>

        {/* Logout Button */}
        <Animated.View
          entering={FadeInDown.delay(600).duration(500).springify()}
        >
          <TouchableOpacity
            style={styles.logoutButton}
            activeOpacity={0.8}
            onPress={logout}
          >
            <Ionicons name="log-out-outline" size={20} color="#ff4444" />
            <Text style={styles.logoutButtonText}>Log Out</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Bottom spacing */}
        <View style={{ height: insets.bottom + 100 }} />
      </ScrollView>

      {/* Followers Modal */}
      <UserListModal
        visible={showFollowers}
        title="Followers"
        users={followers}
        isLoading={followersLoading}
        onClose={() => setShowFollowers(false)}
        currentUserId={user?.id}
      />

      {/* Following Modal */}
      <UserListModal
        visible={showFollowing}
        title="Following"
        users={following}
        isLoading={followingLoading}
        onClose={() => setShowFollowing(false)}
        currentUserId={user?.id}
      />

      {/* Account Switcher Modal */}
      <AccountSwitcherModal
        visible={isAccountSwitcherOpen}
        currentUserId={user?.id}
        savedAccounts={savedAccounts}
        onClose={closeAccountSwitcher}
        onSelectAccount={handleSelectAccount}
        onAddAccount={handleAddAccount}
      />
    </View>
    </SwipeableTabView>
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
  usernameButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerUsername: {
    fontSize: 22,
    fontFamily: 'Lato_700Bold',
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
  dashboardButtonContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  dashboardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 10,
    gap: 8,
  },
  dashboardButtonText: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
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
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
  },
  shareButton: {
    backgroundColor: '#3897F0',
  },
  shareButtonText: {
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
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    marginTop: 20,
    gap: 8,
  },
  logoutButtonText: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
    color: '#ff4444',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalCloseButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Lato_700Bold',
    color: '#1a1a1a',
  },
  userList: {
    paddingVertical: 8,
  },
  userListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  userListAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  userListInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userListName: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    color: '#1a1a1a',
  },
  userListFullName: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(0, 0, 0, 0.5)',
    marginTop: 2,
  },
  followButton: {
    backgroundColor: '#0095f6',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
    minWidth: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.2)',
  },
  followButtonText: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  followingButtonText: {
    color: 'rgba(0, 0, 0, 0.6)',
  },
  modalLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalEmptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalEmptyText: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(0, 0, 0, 0.4)',
  },
  // Account switcher styles
  accountList: {
    flex: 1,
    paddingVertical: 8,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  accountAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  accountInfo: {
    flex: 1,
    marginLeft: 12,
  },
  accountUsername: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    color: '#1a1a1a',
  },
  accountName: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(0, 0, 0, 0.5)',
    marginTop: 2,
  },
  addAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  addAccountIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addAccountText: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    color: '#0095f6',
    marginLeft: 12,
  },
});
