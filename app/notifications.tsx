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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { GlassSurface } from '@/components/glass/glass-surface';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
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
import type { MyTeamInvitation } from '@/lib/types/team.types';
import type {
  AppNotification,
  NotificationType,
} from '@/lib/types/notifications.types';

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
  keyof typeof Ionicons.glyphMap
> = {
  follow: 'person-add',
  rsvp: 'calendar',
  event_update: 'refresh-circle',
  payment: 'card',
  chat: 'chatbubble',
  like: 'heart',
  comment: 'chatbubble-ellipses',
};

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
  const busy = accepting || declining;

  const card = isDark ? (
    <GlassSurface fill="subtle" border="subtle" cornerRadius="lg" style={styles.invitationCard}>
      {renderContent()}
    </GlassSurface>
  ) : (
    <View style={[styles.invitationCard, styles.invitationCardLight, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {renderContent()}
    </View>
  );

  function renderContent() {
    return (
      <>
        <View style={styles.invitationTop}>
          {invitation.eventFlyer ? (
            <Image source={{ uri: invitation.eventFlyer }} style={styles.eventImage} />
          ) : (
            <View style={[styles.eventImage, styles.eventImagePlaceholder, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : colors.backgroundSecondary }]}>
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
        <View style={styles.invitationActions}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              isDark
                ? styles.acceptButtonDark
                : { backgroundColor: colors.text, borderColor: colors.text },
            ]}
            onPress={() => onAccept(invitation.id)}
            disabled={busy}
            activeOpacity={0.7}
          >
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
                ? styles.declineButtonDark
                : { backgroundColor: colors.backgroundSecondary, borderColor: colors.border },
            ]}
            onPress={() => onDecline(invitation.id)}
            disabled={busy}
            activeOpacity={0.7}
          >
            {declining ? (
              <ActivityIndicator color={colors.text} size="small" />
            ) : (
              <Text style={[styles.actionText, { color: colors.text }]}>Decline</Text>
            )}
          </TouchableOpacity>
        </View>
      </>
    );
  }

  return card;
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
  const icon = NOTIFICATION_ICONS[item.type] || 'notifications';

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
      <View style={[styles.activityIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : colors.backgroundSecondary }]}>
        <Ionicons name={icon} size={18} color={colors.textTertiary} />
      </View>
      <View style={styles.activityContent}>
        <Text style={[styles.activityText, { color: colors.textSecondary }]} numberOfLines={2}>
          <Text style={[styles.activityTitle, { color: colors.text }]}>{item.title}</Text>
          {'  '}
          {item.body}
        </Text>
        <Text style={[styles.activityTime, { color: colors.textTertiary }]}>{timeAgo(item.createdAt)}</Text>
      </View>
      {!item.read && <View style={[styles.unreadDot, { backgroundColor: colors.text }]} />}
    </TouchableOpacity>
  );
}


export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const [activeTab, setActiveTab] = useState<NotificationTab>('activity');

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
            router.push(`/user-profile/${metadata.actorId}`);
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
            { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.backgroundSecondary, borderColor: isDark ? 'rgba(255,255,255,0.08)' : colors.border },
            activeTab === 'activity' && (isDark ? styles.tabActiveDark : { backgroundColor: colors.text, borderColor: colors.text }),
          ]}
          onPress={() => setActiveTab('activity')}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.tabText,
            { color: colors.textTertiary },
            activeTab === 'activity' && { fontFamily: 'Lato_700Bold', color: isDark ? '#fff' : colors.textInverse },
          ]}>
            Activity
          </Text>
          {!!unreadCount && unreadCount > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.backgroundSecondary, borderColor: isDark ? 'rgba(255,255,255,0.08)' : colors.border },
            activeTab === 'teams' && (isDark ? styles.tabActiveDark : { backgroundColor: colors.text, borderColor: colors.text }),
          ]}
          onPress={() => setActiveTab('teams')}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.tabText,
            { color: colors.textTertiary },
            activeTab === 'teams' && { fontFamily: 'Lato_700Bold', color: isDark ? '#fff' : colors.textInverse },
          ]}>
            Teams
          </Text>
          {invitations.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{invitations.length}</Text>
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
              <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
                When someone follows you, RSVPs to your event, or sends you a payment, it will appear here.
              </Text>
            </View>
          </ScrollView>
        )
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={teamsRefreshControl}
        >
          {invitationsQuery.isLoading ? (
            <ActivityIndicator color={colors.textTertiary} style={{ marginVertical: 40 }} />
          ) : invitations.length > 0 ? (
            <View style={styles.invitationsList}>
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
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={40} color={colors.textTertiary} />
              <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>No team invitations</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
                When someone invites you to their event team, it will appear here.
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      <ConfirmDialog
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
        onCancel={handleCancelConfirm}
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
    backgroundColor: 'rgba(255,255,255,0.15)',
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
  },
});
