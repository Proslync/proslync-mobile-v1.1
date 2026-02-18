import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { GlassSurface } from '@/components/glass/glass-surface';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import {
  useMyTeamInvitations,
  useAcceptTeamInvitation,
  useDeclineTeamInvitation,
} from '@/hooks';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import type { MyTeamInvitation } from '@/lib/types/team.types';

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

// ── Placeholder activity data ─────────────────────────────

interface ActivityNotification {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  icon: keyof typeof Ionicons.glyphMap;
}

const PLACEHOLDER_ACTIVITY: ActivityNotification[] = [
  { id: '1', title: 'Sarah Chen', body: 'started following you', time: '2m ago', read: false, icon: 'person-add' },
  { id: '2', title: 'Friday Night Live', body: "You're confirmed! Event starts at 9 PM tonight", time: '15m ago', read: false, icon: 'checkmark-circle' },
  { id: '3', title: 'Mike Torres', body: 'liked your event post', time: '1h ago', read: false, icon: 'heart' },
  { id: '4', title: 'Rooftop Sessions', body: "is happening tomorrow. Don't forget!", time: '2h ago', read: true, icon: 'calendar' },
  { id: '5', title: 'Jess Kim', body: 'commented: "This is going to be amazing!"', time: '3h ago', read: true, icon: 'chatbubble' },
  { id: '6', title: 'DJ Snake', body: 'started following you', time: '5h ago', read: true, icon: 'person-add' },
  { id: '7', title: 'Summer Music Festival', body: 'Early bird tickets are now available', time: '8h ago', read: true, icon: 'ticket' },
  { id: '8', title: 'Marcus J.', body: 'mentioned you in a comment', time: '12h ago', read: true, icon: 'at' },
];

// ── Team Invitation Row ──────────────────────────────────

function TeamInvitationRow({
  invitation,
  onAccept,
  onDecline,
  accepting,
  declining,
}: {
  invitation: MyTeamInvitation;
  onAccept: (id: number) => void;
  onDecline: (id: number) => void;
  accepting: boolean;
  declining: boolean;
}) {
  const busy = accepting || declining;

  return (
    <GlassSurface fill="subtle" border="subtle" cornerRadius="lg" style={styles.invitationCard}>
      <View style={styles.invitationTop}>
        {invitation.eventFlyer ? (
          <Image source={{ uri: invitation.eventFlyer }} style={styles.eventImage} />
        ) : (
          <View style={[styles.eventImage, styles.eventImagePlaceholder]}>
            <Ionicons name="calendar" size={20} color="rgba(255,255,255,0.3)" />
          </View>
        )}
        <View style={styles.invitationInfo}>
          <Text style={styles.eventName} numberOfLines={1}>{invitation.eventName}</Text>
          <Text style={styles.roleLine} numberOfLines={1}>Role: {invitation.roleName}</Text>
          <Text style={styles.fromLine} numberOfLines={1}>
            From: {invitation.invitedByName} · {timeAgo(invitation.createdAt)}
          </Text>
        </View>
      </View>
      <View style={styles.invitationActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.acceptButton]}
          onPress={() => onAccept(invitation.id)}
          disabled={busy}
          activeOpacity={0.7}
        >
          {accepting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.actionText}>Accept</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.declineButton]}
          onPress={() => onDecline(invitation.id)}
          disabled={busy}
          activeOpacity={0.7}
        >
          {declining ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.actionText}>Decline</Text>
          )}
        </TouchableOpacity>
      </View>
    </GlassSurface>
  );
}

// ── Activity Row ─────────────────────────────────────────

function ActivityRow({ item }: { item: ActivityNotification }) {
  return (
    <View style={[styles.activityRow, !item.read && styles.activityUnread]}>
      <View style={styles.activityIcon}>
        <Ionicons name={item.icon} size={18} color="rgba(255,255,255,0.5)" />
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityText} numberOfLines={2}>
          <Text style={styles.activityTitle}>{item.title}</Text>
          {'  '}
          {item.body}
        </Text>
        <Text style={styles.activityTime}>{item.time}</Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </View>
  );
}

// ── Main Screen ──────────────────────────────────────────

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<NotificationTab>('activity');

  const invitationsQuery = useMyTeamInvitations();
  const acceptMutation = useAcceptTeamInvitation();
  const declineMutation = useDeclineTeamInvitation();

  const invitations = invitationsQuery.data ?? [];

  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [confirmType, setConfirmType] = useState<'accept' | 'decline' | null>(null);
  const [actionId, setActionId] = React.useState<number | null>(null);
  const [actionType, setActionType] = React.useState<'accept' | 'decline' | null>(null);

  const { refreshControl } = useRefreshControl({
    onRefresh: async () => {
      await invitationsQuery.refetch();
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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <DarkGradientBg />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.backButton} />
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'activity' && styles.tabActive]}
          onPress={() => setActiveTab('activity')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'activity' && styles.tabTextActive]}>
            Activity
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'teams' && styles.tabActive]}
          onPress={() => setActiveTab('teams')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'teams' && styles.tabTextActive]}>
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
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          {PLACEHOLDER_ACTIVITY.map((item) => (
            <ActivityRow key={item.id} item={item} />
          ))}
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
        >
          {invitationsQuery.isLoading ? (
            <ActivityIndicator color="rgba(255,255,255,0.5)" style={{ marginVertical: 40 }} />
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
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={40} color="rgba(255,255,255,0.15)" />
              <Text style={styles.emptyTitle}>No team invitations</Text>
              <Text style={styles.emptySubtitle}>
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
    backgroundColor: '#000',
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
    color: '#fff',
  },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    paddingBottom: 12,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 6,
  },
  tabActive: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderColor: 'rgba(255,255,255,0.25)',
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.5)',
  },
  tabTextActive: {
    fontFamily: 'Lato_700Bold',
    color: '#fff',
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
    backgroundColor: 'rgba(255,255,255,0.1)',
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
    color: '#fff',
  },
  roleLine: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.6)',
  },
  fromLine: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.4)',
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
  acceptButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderColor: 'rgba(255,255,255,0.25)',
  },
  declineButton: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.12)',
  },
  actionText: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
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
    color: 'rgba(255,255,255,0.6)',
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.3)',
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
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  activityUnread: {
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 20,
  },
  activityTitle: {
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  activityTime: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.3)',
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
});
