import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { GlassSurface } from '@/components/glass/glass-surface';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import { ConfirmSheet } from '@/components/ui/confirm-sheet';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { ThemeColors } from '@/hooks/use-app-theme';
import {
  useMyTeamInvitations,
  useAcceptTeamInvitation,
  useDeclineTeamInvitation,
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '@/hooks';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { authApi } from '@/lib/api/auth';
import type { MyTeamInvitation } from '@/lib/types/team.types';
import type {
  AppNotification,
  NotificationType,
} from '@/lib/types/notifications.types';

const DefaultAvatarImage = require('@/assets/images/default-avatar.png');

type NotificationTab = 'activity' | 'teams';

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = Math.max(0, now - date);
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const NOTIFICATION_ICONS: Record<
  NotificationType,
  { name: keyof typeof Ionicons.glyphMap; color: string }
> = {
  follow: { name: 'person-add', color: '#fff' },
  rsvp: { name: 'calendar', color: '#fff' },
  event_update: { name: 'refresh-circle', color: '#fff' },
  payment: { name: 'card', color: '#fff' },
  chat: { name: 'chatbubble-ellipses', color: '#fff' },
  like: { name: 'heart', color: '#fff' },
  comment: { name: 'chatbubble', color: '#fff' },
  team_invitation: { name: 'people', color: '#fff' },
};

// Types where we show the actor's profile photo instead of an icon
const ACTOR_PHOTO_TYPES: NotificationType[] = ['follow', 'like', 'comment', 'chat', 'payment', 'team_invitation'];

function TeamInvitationRow({
  invitation,
  onAccept,
  onDecline,
  accepting,
  declining,
  colors,
  isDark,
}: {
  invitation: MyTeamInvitation;
  onAccept: (id: number) => void;
  onDecline: (id: number) => void;
  accepting: boolean;
  declining: boolean;
  colors: ThemeColors;
  isDark: boolean;
}) {
  const router = useRouter();
  const busy = accepting || declining;
  const tappable = invitation.status === 'accepted';

  const handleCardPress = () => {
    if (tappable) {
      router.push(`/manage-event/${invitation.eventId}`);
    }
  };

  const cardContent = (
    <GlassSurface fill="subtle" border="subtle" cornerRadius="lg" style={styles.invitationCard}>
      {renderContent()}
    </GlassSurface>
  );

  const card = tappable ? (
    <TouchableOpacity activeOpacity={0.7} onPress={handleCardPress}>
      {cardContent}
    </TouchableOpacity>
  ) : cardContent;

  function renderContent() {
    return (
      <>
        <View style={styles.invitationTop}>
          {invitation.eventFlyer ? (
            <Image source={{ uri: invitation.eventFlyer }} style={styles.eventImage} />
          ) : (
            <View style={[styles.eventImage, styles.eventImagePlaceholder, { overflow: 'hidden', backgroundColor: isDark ? undefined : colors.backgroundSecondary }]}>
              {isDark && <GlassView {...liquidGlass.fillFaint} borderRadius={10} style={StyleSheet.absoluteFillObject} />}
              <Ionicons name="calendar" size={20} color={colors.textTertiary} />
            </View>
          )}
          <View style={styles.invitationInfo}>
            <Text style={[styles.eventName, { color: colors.text }]} numberOfLines={1}>{invitation.eventName}</Text>
            <Text style={[styles.roleLine, { color: colors.textSecondary }]} numberOfLines={1}>Role: {invitation.roleName}</Text>
            <Text style={[styles.fromLine, { color: colors.textTertiary }]} numberOfLines={1}>
              From: {invitation.invitedByName} · {timeAgo(invitation.createdAt)}
            </Text>
          </View>
        </View>
        {invitation.status === 'pending' ? (
          <View style={styles.invitationActions}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                isDark
                  ? { overflow: 'hidden' as const, borderColor: 'rgba(255,255,255,0.25)' }
                  : { backgroundColor: colors.text, borderColor: colors.text },
              ]}
              onPress={() => onAccept(invitation.id)}
              disabled={busy}
              activeOpacity={0.7}
            >
              {isDark && <GlassView {...liquidGlass.fill} borderRadius={10} style={StyleSheet.absoluteFillObject} />}
              {accepting ? (
                <ActivityIndicator color={isDark ? '#fff' : colors.textInverse} size="small" />
              ) : (
                <Text style={[styles.actionText, { color: isDark ? '#fff' : colors.textInverse }]}>Accept</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionButton,
                isDark
                  ? { overflow: 'hidden' as const, borderColor: 'rgba(255,255,255,0.12)' }
                  : { backgroundColor: colors.backgroundSecondary, borderColor: colors.border },
              ]}
              onPress={() => onDecline(invitation.id)}
              disabled={busy}
              activeOpacity={0.7}
            >
              {isDark && <GlassView {...liquidGlass.fillFaint} borderRadius={10} style={StyleSheet.absoluteFillObject} />}
              {declining ? (
                <ActivityIndicator color={colors.text} size="small" />
              ) : (
                <Text style={[styles.actionText, { color: colors.text }]}>Decline</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.statusBadgeRow}>
            <View style={[
              styles.statusBadge,
              invitation.status === 'accepted'
                ? { backgroundColor: 'rgba(52,199,89,0.15)' }
                : { backgroundColor: 'rgba(255,59,48,0.15)' },
            ]}>
              <Ionicons
                name={invitation.status === 'accepted' ? 'checkmark-circle' : 'close-circle'}
                size={14}
                color={invitation.status === 'accepted' ? '#34C759' : '#FF3B30'}
              />
              <Text style={[
                styles.statusBadgeText,
                { color: invitation.status === 'accepted' ? '#34C759' : '#FF3B30' },
              ]}>
                {invitation.status === 'accepted' ? 'Accepted' : 'Declined'}
              </Text>
            </View>
          </View>
        )}
      </>
    );
  }

  return card;
}


function useActorUser(actorId?: number) {
  return useQuery({
    queryKey: ['user', actorId],
    queryFn: () => authApi.getUserById(actorId!),
    enabled: !!actorId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

function ActorAvatar({ actorId }: { actorId: number }) {
  const { data: user } = useActorUser(actorId);

  return (
    <Image
      source={user?.avatar?.url ? { uri: user.avatar.url } : DefaultAvatarImage}
      style={styles.actorAvatar}
    />
  );
}

function ActivityRow({
  item,
  colors,
  isDark,
  onPress,
}: {
  item: AppNotification;
  colors: ThemeColors;
  isDark: boolean;
  onPress: (notification: AppNotification) => void;
}) {
  const iconConfig = NOTIFICATION_ICONS[item.type] || { name: 'notifications', color: colors.textTertiary };
  const actorId = item.metadata?.actorId as number | undefined;
  const showActorPhoto = ACTOR_PHOTO_TYPES.includes(item.type) && actorId;
  const { data: actorUser } = useActorUser(actorId);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress(item)}
      style={[
        styles.activityRow,
        { borderBottomColor: colors.separator },
        !item.read && { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)' },
      ]}
    >
      {showActorPhoto ? (
        <ActorAvatar actorId={actorId} />
      ) : (
        <View style={[styles.activityIcon, { backgroundColor: isDark ? undefined : 'rgba(0,0,0,0.06)', overflow: 'hidden' as const }]}>
          {isDark && <GlassView {...liquidGlass.fillFaint} borderRadius={20} style={StyleSheet.absoluteFillObject} />}
          <Ionicons name={iconConfig.name} size={18} color={iconConfig.color} />
        </View>
      )}
      <View style={styles.activityContent}>
        <Text style={[styles.activityText, { color: colors.textSecondary }]} numberOfLines={2}>
          <Text style={[styles.activityTitle, { color: colors.text }]}>{item.title}</Text>
          {actorUser?.isVerified && ' '}
          {actorUser?.isVerified && <MaterialCommunityIcons name="check-decagram" size={14} color="#3897F0" />}
          {'  '}
          {item.body}
        </Text>
        <Text style={[styles.activityTime, { color: colors.textTertiary }]}>{timeAgo(item.createdAt)}</Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
}


export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const { colors, isDark } = useAppTheme();
  const [activeTab, setActiveTab] = useState<NotificationTab>(
    tab === 'teams' ? 'teams' : 'activity',
  );

  // Team invitations
  const invitationsQuery = useMyTeamInvitations();
  const acceptMutation = useAcceptTeamInvitation();
  const declineMutation = useDeclineTeamInvitation();
  const invitations = invitationsQuery.data ?? [];

  // Activity notifications
  const {
    notifications,
    isLoading: notificationsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchNotifications,
  } = useNotifications();
  const { data: unreadCount } = useUnreadNotificationCount();
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [confirmType, setConfirmType] = useState<'accept' | 'decline' | null>(null);
  const [actionId, setActionId] = React.useState<number | null>(null);
  const [actionType, setActionType] = React.useState<'accept' | 'decline' | null>(null);

  const { refreshControl: teamsRefreshControl } = useRefreshControl({
    onRefresh: async () => {
      await invitationsQuery.refetch();
    },
  });

  const { refreshControl: activityRefreshControl } = useRefreshControl({
    onRefresh: async () => {
      await refetchNotifications();
    },
  });

  const handleAccept = useCallback((id: number) => {
    setConfirmId(id);
    setConfirmType('accept');
  }, []);

  const handleDecline = useCallback((id: number) => {
    setConfirmId(id);
    setConfirmType('decline');
  }, []);

  const handleConfirm = useCallback(() => {
    if (!confirmId || !confirmType) return;
    const id = confirmId;
    const type = confirmType;
    setConfirmId(null);
    setConfirmType(null);
    setActionId(id);
    setActionType(type);

    const mutation = type === 'accept' ? acceptMutation : declineMutation;
    mutation.mutate(id, {
      onSettled: () => {
        setActionId(null);
        setActionType(null);
      },
    });
  }, [confirmId, confirmType, acceptMutation, declineMutation]);

  const handleCancelConfirm = useCallback(() => {
    setConfirmId(null);
    setConfirmType(null);
  }, []);

  const handleNotificationPress = useCallback(
    (notification: AppNotification) => {
      // Mark as read
      if (!notification.read) {
        markReadMutation.mutate(notification.id);
      }

      // Navigate based on type
      const { metadata } = notification;
      switch (notification.type) {
        case 'follow':
          if (metadata?.actorId) {
            router.push({ pathname: '/user/[username]', params: { username: '_', userId: String(metadata.actorId) } });
          }
          break;
        case 'rsvp':
          if (metadata?.eventId) {
            router.push(`/manage-event/${metadata.eventId}`);
          }
          break;
        case 'event_update':
          if (metadata?.eventId) {
            router.push(`/event/${metadata.eventId}`);
          }
          break;
        case 'payment':
          if (metadata?.eventId) {
            router.push(`/manage-event/${metadata.eventId}`);
          }
          break;
        case 'like':
        case 'comment':
          if (metadata?.postId) {
            router.push(`/post/${metadata.postId}`);
          }
          break;
        case 'chat':
          break;
        case 'team_invitation':
          setActiveTab('teams');
          break;
      }
    },
    [markReadMutation, router],
  );

  const handleMarkAllRead = useCallback(() => {
    markAllReadMutation.mutate();
  }, [markAllReadMutation]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      {isDark && <DarkGradientBg />}

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
        {activeTab === 'activity' && !!unreadCount && unreadCount > 0 ? (
          <TouchableOpacity style={styles.backButton} onPress={handleMarkAllRead}>
            <Ionicons name="checkmark-done" size={22} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backButton} />
        )}
      </View>

      {/* Tabs */}
      <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'activity'
              ? isDark ? styles.tabActiveDark : { backgroundColor: colors.text, borderColor: colors.text }
              : { borderColor: colors.border },
          ]}
          onPress={() => setActiveTab('activity')}
          activeOpacity={0.7}
        >
          {activeTab === 'activity' && isDark && (
            <GlassView {...liquidGlass.fill} borderRadius={20} style={StyleSheet.absoluteFillObject} />
          )}
          <Text style={[styles.tabText, { color: activeTab === 'activity' ? (isDark ? '#fff' : colors.textInverse) : colors.textSecondary }]}>Activity</Text>
          {!!unreadCount && unreadCount > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'teams'
              ? isDark ? styles.tabActiveDark : { backgroundColor: colors.text, borderColor: colors.text }
              : { borderColor: colors.border },
          ]}
          onPress={() => setActiveTab('teams')}
          activeOpacity={0.7}
        >
          {activeTab === 'teams' && isDark && (
            <GlassView {...liquidGlass.fill} borderRadius={20} style={StyleSheet.absoluteFillObject} />
          )}
          <Text style={[styles.tabText, { color: activeTab === 'teams' ? (isDark ? '#fff' : colors.textInverse) : colors.textSecondary }]}>Teams</Text>
          {invitations.filter((i) => i.status === 'pending').length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{invitations.filter((i) => i.status === 'pending').length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'activity' ? (
        notificationsLoading ? (
          <ActivityIndicator color={colors.textTertiary} style={{ marginVertical: 40 }} />
        ) : notifications.length > 0 ? (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <ActivityRow
                item={item}
                colors={colors}
                isDark={isDark}
                onPress={handleNotificationPress}
              />
            )}
            contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
            showsVerticalScrollIndicator={false}
            refreshControl={activityRefreshControl}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
              }
            }}
            onEndReachedThreshold={0.3}
            ListFooterComponent={
              isFetchingNextPage ? (
                <ActivityIndicator color={colors.textTertiary} style={{ marginVertical: 16 }} />
              ) : null
            }
          />
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
            showsVerticalScrollIndicator={false}
            refreshControl={activityRefreshControl}
          >
            <View style={styles.emptyState}>
              <Ionicons name="notifications-outline" size={40} color={colors.textTertiary} />
              <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>No notifications yet</Text>
            </View>
          </ScrollView>
        )
      ) : (
        invitationsQuery.isLoading ? (
          <ActivityIndicator color={colors.textTertiary} style={{ marginVertical: 40 }} />
        ) : invitations.length > 0 ? (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[styles.invitationsList, { paddingBottom: insets.bottom + 40 }]}
            showsVerticalScrollIndicator={false}
            refreshControl={teamsRefreshControl}
          >
            {invitations.map((inv) => (
              <TeamInvitationRow
                key={inv.id}
                invitation={inv}
                onAccept={handleAccept}
                onDecline={handleDecline}
                accepting={actionId === inv.id && actionType === 'accept'}
                declining={actionId === inv.id && actionType === 'decline'}
                colors={colors}
                isDark={isDark}
              />
            ))}
          </ScrollView>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
            showsVerticalScrollIndicator={false}
            refreshControl={teamsRefreshControl}
          >
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={40} color={colors.textTertiary} />
              <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>No team invitations</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
                When someone invites you to their event team, it will appear here
              </Text>
            </View>
          </ScrollView>
        )
      )}

      <ConfirmSheet
        visible={!!confirmId}
        title={confirmType === 'accept' ? 'Accept Invitation' : 'Decline Invitation'}
        message={
          confirmType === 'accept'
            ? 'Join this event team?'
            : 'Are you sure you want to decline this invitation?'
        }
        confirmLabel={confirmType === 'accept' ? 'Accept' : 'Decline'}
        destructive={confirmType === 'decline'}
        onConfirm={handleConfirm}
        onClose={handleCancelConfirm}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: 'Lato_700Bold',
  },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 6,
    borderBottomWidth: 1,
    paddingBottom: 12,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  tabActiveDark: {
    overflow: 'hidden' as const,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
  },
  tabBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeText: {
    fontSize: 11,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
  },

  // Team Invitations
  invitationsList: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 10,
  },
  invitationCard: {
    padding: 14,
  },
  invitationCardLight: {
    borderRadius: 16,
    borderWidth: 1,
  },
  invitationTop: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  eventImage: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  eventImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  invitationInfo: {
    flex: 1,
    gap: 2,
  },
  eventName: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
  },
  roleLine: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
  },
  fromLine: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
  },
  invitationActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  acceptButtonDark: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderColor: 'rgba(255,255,255,0.25)',
  },
  declineButtonDark: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.12)',
  },
  actionText: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
  },

  statusBadgeRow: {
    alignItems: 'flex-start',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Activity
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    lineHeight: 20,
  },
  activityTitle: {
    fontFamily: 'Lato_700Bold',
  },
  activityTime: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  actorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  actorAvatarWrapper: {
    position: 'relative',
    width: 40,
    height: 40,
  },
  activityTypeBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
});
