import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Image,
  ActivityIndicator,
  Dimensions,
  Keyboard,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
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
import type { AppNotification, NotificationType } from '@/lib/types/notifications.types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
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

const NOTIFICATION_ICONS: Record<NotificationType, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
  follow: { name: 'person-add', color: '#1a1a1a' },
  rsvp: { name: 'calendar', color: '#1a1a1a' },
  event_update: { name: 'refresh-circle', color: '#1a1a1a' },
  payment: { name: 'card', color: '#1a1a1a' },
  chat: { name: 'chatbubble-ellipses', color: '#1a1a1a' },
  like: { name: 'heart', color: '#1a1a1a' },
  comment: { name: 'chatbubble', color: '#1a1a1a' },
  team_invitation: { name: 'people', color: '#1a1a1a' },
};

const ACTOR_PHOTO_TYPES: NotificationType[] = ['follow', 'like', 'comment'];

function useActorUser(actorId?: number) {
  return useQuery({
    queryKey: ['user', actorId],
    queryFn: () => authApi.getUserById(actorId!),
    enabled: !!actorId,
    staleTime: 5 * 60 * 1000,
  });
}

function ActivityRow({ item, onPress }: { item: AppNotification; onPress: (n: AppNotification) => void }) {
  const iconConfig = NOTIFICATION_ICONS[item.type] || { name: 'notifications', color: '#999' };
  const actorId = item.metadata?.actorId as number | undefined;
  const showActorPhoto = ACTOR_PHOTO_TYPES.includes(item.type) && actorId;
  const { data: actorUser } = useActorUser(actorId);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress(item)}
      style={styles.activityRow}
    >
      {showActorPhoto ? (
        <Image source={actorUser?.avatar?.url ? { uri: actorUser.avatar.url } : DefaultAvatarImage} style={styles.actorAvatar} />
      ) : (
        <View style={styles.activityIcon}>
          <Ionicons name={iconConfig.name} size={18} color={iconConfig.color} />
        </View>
      )}
      <View style={styles.activityContent}>
        <Text style={styles.activityText} numberOfLines={2}>
          <Text style={styles.activityTitle}>{item.title}</Text>
          {actorUser?.isVerified && ' '}
          {actorUser?.isVerified && <MaterialCommunityIcons name="check-decagram" size={14} color="#FF6F3C" />}
          {'  '}{item.body}
        </Text>
        <Text style={styles.activityTime}>{timeAgo(item.createdAt)}</Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
}

function TeamInvitationRow({
  invitation, onAccept, onDecline, accepting, declining,
}: {
  invitation: MyTeamInvitation; onAccept: (id: number) => void; onDecline: (id: number) => void;
  accepting: boolean; declining: boolean;
}) {
  const busy = accepting || declining;
  return (
    <View style={styles.invitationCard}>
      <View style={styles.invitationTop}>
        {invitation.eventFlyer ? (
          <Image source={{ uri: invitation.eventFlyer }} style={styles.eventImage} />
        ) : (
          <View style={[styles.eventImage, styles.placeholderThumb]}>
            <Ionicons name="calendar" size={20} color="#ccc" />
          </View>
        )}
        <View style={styles.invitationInfo}>
          <Text style={styles.eventName} numberOfLines={1}>{invitation.eventName}</Text>
          <Text style={styles.roleLine} numberOfLines={1}>Role: {invitation.roleName}</Text>
          <Text style={styles.fromLine} numberOfLines={1}>From: {invitation.invitedByName} · {timeAgo(invitation.createdAt)}</Text>
        </View>
      </View>
      {invitation.status === 'pending' ? (
        <View style={styles.invitationActions}>
          <TouchableOpacity style={styles.acceptBtn} onPress={() => onAccept(invitation.id)} disabled={busy} activeOpacity={0.7}>
            {accepting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.acceptText}>Accept</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.declineBtn} onPress={() => onDecline(invitation.id)} disabled={busy} activeOpacity={0.7}>
            {declining ? <ActivityIndicator color="#1a1a1a" size="small" /> : <Text style={styles.declineText}>Decline</Text>}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.statusBadge, { backgroundColor: invitation.status === 'accepted' ? 'rgba(52,199,89,0.15)' : 'rgba(255,59,48,0.15)' }]}>
          <Ionicons name={invitation.status === 'accepted' ? 'checkmark-circle' : 'close-circle'} size={14} color={invitation.status === 'accepted' ? '#34C759' : '#FF3B30'} />
          <Text style={{ color: invitation.status === 'accepted' ? '#34C759' : '#FF3B30', fontSize: 13, fontWeight: '700' }}>
            {invitation.status === 'accepted' ? 'Accepted' : 'Declined'}
          </Text>
        </View>
      )}
    </View>
  );
}

interface NotificationSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function NotificationSheet({ visible, onClose }: NotificationSheetProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const [activeTab, setActiveTab] = useState<NotificationTab>('activity');

  const invitationsQuery = useMyTeamInvitations();
  const acceptMutation = useAcceptTeamInvitation();
  const declineMutation = useDeclineTeamInvitation();
  const invitations = invitationsQuery.data ?? [];

  const { notifications, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = useNotifications();
  const { data: unreadCount } = useUnreadNotificationCount();
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  const [actionId, setActionId] = useState<number | null>(null);
  const [actionType, setActionType] = useState<'accept' | 'decline' | null>(null);

  const { refreshControl: activityRefresh } = useRefreshControl({ onRefresh: async () => { await refetch(); } });
  const { refreshControl: teamsRefresh } = useRefreshControl({ onRefresh: async () => { await invitationsQuery.refetch(); } });

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) });
    } else {
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250, easing: Easing.in(Easing.ease) });
    }
  }, [visible]);

  const handleClose = useCallback(() => {
    translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250, easing: Easing.in(Easing.ease) });
    setTimeout(onClose, 260);
  }, [onClose]);

  const handleNotificationPress = useCallback((notification: AppNotification) => {
    if (!notification.read) markReadMutation.mutate(notification.id);
    handleClose();
    const { metadata } = notification;
    setTimeout(() => {
      switch (notification.type) {
        case 'follow': if (metadata?.actorId) router.push({ pathname: '/user/[username]', params: { username: '_', userId: String(metadata.actorId) } }); break;
        case 'rsvp': if (metadata?.eventId) console.warn('[Phase 1 stub] /manage-event route deleted'); break;
        case 'event_update': if (metadata?.eventId) console.warn('[Phase 1 stub] /event route deleted'); break;
        case 'payment': if (metadata?.eventId) console.warn('[Phase 1 stub] /manage-event route deleted'); break;
        case 'like': case 'comment': if (metadata?.postId) router.push(`/post/${metadata.postId}`); break;
        case 'team_invitation': setActiveTab('teams'); break;
      }
    }, 300);
  }, [markReadMutation, handleClose, router]);

  const handleAccept = useCallback((id: number) => {
    setActionId(id); setActionType('accept');
    acceptMutation.mutate(id, { onSettled: () => { setActionId(null); setActionType(null); } });
  }, [acceptMutation]);

  const handleDecline = useCallback((id: number) => {
    setActionId(id); setActionType('decline');
    declineMutation.mutate(id, { onSettled: () => { setActionId(null); setActionType(null); } });
  }, [declineMutation]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

  if (!visible) return null;

  const pendingCount = invitations.filter(i => i.status === 'pending').length;

  return (
    <Animated.View style={[styles.sheet, animatedStyle]}>
      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 4 }]}>
        <Text style={styles.sheetTitle}>Notifications</Text>
        <TouchableOpacity style={styles.iconBtn} onPress={handleClose} activeOpacity={0.7}>
          <Ionicons name="close" size={24} color="#1a1a1a" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tab, activeTab === 'activity' && styles.tabActive]} onPress={() => setActiveTab('activity')} activeOpacity={0.7}>
          <Text style={[styles.tabText, activeTab === 'activity' && styles.tabTextActive]}>Activity</Text>
          {!!unreadCount && unreadCount > 0 && (
            <View style={styles.tabBadge}><Text style={styles.tabBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text></View>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'teams' && styles.tabActive]} onPress={() => setActiveTab('teams')} activeOpacity={0.7}>
          <Text style={[styles.tabText, activeTab === 'teams' && styles.tabTextActive]}>Teams</Text>
          {pendingCount > 0 && <View style={styles.tabBadge}><Text style={styles.tabBadgeText}>{pendingCount}</Text></View>}
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        {activeTab === 'activity' && !!unreadCount && unreadCount > 0 && (
          <TouchableOpacity onPress={() => markAllReadMutation.mutate()} activeOpacity={0.7}>
            <Text style={styles.markAllRead}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {activeTab === 'activity' ? (
        isLoading ? (
          <ActivityIndicator color="#999" style={{ marginVertical: 40 }} />
        ) : notifications.length > 0 ? (
          <FlatList
            data={notifications}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => <ActivityRow item={item} onPress={handleNotificationPress} />}
            contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
            showsVerticalScrollIndicator={false}
            refreshControl={activityRefresh}
            onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
            onEndReachedThreshold={0.3}
            ListFooterComponent={isFetchingNextPage ? <ActivityIndicator color="#999" style={{ marginVertical: 16 }} /> : null}
          />
        ) : (
          <ScrollView contentContainerStyle={styles.emptyState} refreshControl={activityRefresh}>
            <Ionicons name="notifications-outline" size={40} color="#ccc" />
            <Text style={styles.emptyText}>No notifications yet</Text>
          </ScrollView>
        )
      ) : (
        invitationsQuery.isLoading ? (
          <ActivityIndicator color="#999" style={{ marginVertical: 40 }} />
        ) : invitations.length > 0 ? (
          <ScrollView contentContainerStyle={styles.invitationsList} showsVerticalScrollIndicator={false} refreshControl={teamsRefresh}>
            {invitations.map(inv => (
              <TeamInvitationRow
                key={inv.id} invitation={inv}
                onAccept={handleAccept} onDecline={handleDecline}
                accepting={actionId === inv.id && actionType === 'accept'}
                declining={actionId === inv.id && actionType === 'decline'}
              />
            ))}
          </ScrollView>
        ) : (
          <ScrollView contentContainerStyle={styles.emptyState} refreshControl={teamsRefresh}>
            <Ionicons name="people-outline" size={40} color="#ccc" />
            <Text style={styles.emptyText}>No team invitations</Text>
            <Text style={styles.emptySubtext}>When someone invites you to their event team, it will appear here</Text>
          </ScrollView>
        )
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#f7f7f7',
    zIndex: 999,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  sheetTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center', alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 6,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#fff',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.4)',
  },
  tabTextActive: {
    color: '#1a1a1a',
    fontWeight: '600',
  },
  tabBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    minWidth: 18, height: 18,
    paddingHorizontal: 5,
    alignItems: 'center', justifyContent: 'center',
  },
  tabBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  markAllRead: { fontSize: 13, color: '#999' },

  // Activity rows
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  activityIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center', justifyContent: 'center',
  },
  actorAvatar: { width: 40, height: 40, borderRadius: 20 },
  activityContent: { flex: 1 },
  activityText: { fontSize: 14, color: '#666', lineHeight: 20 },
  activityTitle: { fontWeight: '700', color: '#1a1a1a' },
  activityTime: { fontSize: 12, color: '#bbb', marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF3B30' },

  // Team invitations
  invitationsList: { paddingHorizontal: 20, paddingTop: 8, gap: 10 },
  invitationCard: {
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 16,
    padding: 14,
  },
  invitationTop: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  eventImage: { width: 44, height: 44, borderRadius: 10 },
  placeholderThumb: { backgroundColor: 'rgba(0,0,0,0.06)', alignItems: 'center', justifyContent: 'center' },
  invitationInfo: { flex: 1, gap: 2 },
  eventName: { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },
  roleLine: { fontSize: 13, color: '#999' },
  fromLine: { fontSize: 12, color: '#bbb' },
  invitationActions: { flexDirection: 'row', gap: 10 },
  acceptBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    backgroundColor: '#1a1a1a',
    alignItems: 'center', justifyContent: 'center',
  },
  acceptText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  declineBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  declineText: { fontSize: 14, fontWeight: '700', color: '#1a1a1a' },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
  },

  // Empty
  emptyState: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyText: { fontSize: 16, fontWeight: '700', color: '#999', marginTop: 10 },
  emptySubtext: { fontSize: 14, color: '#bbb', textAlign: 'center', marginTop: 4, lineHeight: 20 },
});
