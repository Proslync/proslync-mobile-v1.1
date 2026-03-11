import * as React from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  Layout,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { TerminalProvider, useTerminalPayment } from '@/lib/providers/terminal-provider';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { useAppTheme } from '@/hooks/use-app-theme';
import { eventsApi } from '@/lib/api/events';
import { paymentsApi } from '@/lib/api/payments';
import { useEventSocket } from '@/hooks/use-event-socket';
import type { Event, EventAttendee } from '@/lib/types/events.types';
import { EventUserStatus } from '@/lib/types/events.types';

interface ListContact {
  id: number;
  name: string;
  userName?: string;
  avatarUrl?: string;
  isGuest: boolean;
  source: string;
  eventCount: number;
  lastSeenAt?: string;
  paid: boolean;
  userId?: number;
  phoneNumber?: string;
  email?: string;
  birthDate?: string;
  documentNumber?: string;
  tags?: string[];
}

function formatTimeAgo(dateStr?: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatPhone(phone?: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11 && digits[0] === '1') {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

function sourceLabel(source: string, isGuest: boolean): string {
  if (isGuest) return 'Guest';
  if (source === 'rsvp') return 'RSVP';
  if (source === 'ticket_purchase') return 'Ticket';
  return 'Check-in';
}

function mapAttendee(a: EventAttendee): ListContact {
  const name = [a.firstName, a.lastName].filter(Boolean).join(' ') || a.guestName || 'Unknown';
  const isGuest = a.isGuest ?? !a.userId;
  const isCheckedIn = a.checkedIn ||
    a.status === EventUserStatus.CHECKED_IN ||
    a.status === EventUserStatus.VERIFIED;
  let source = 'check_in';
  if (a.status === EventUserStatus.SIGNED_UP) source = 'rsvp';
  else if (a.isRegistered && !isCheckedIn) source = 'rsvp';
  return {
    id: a.id,
    name,
    userName: a.userName,
    avatarUrl: a.avatarUrl || a.avatar,
    isGuest,
    source,
    eventCount: 1,
    lastSeenAt: a.checkedInAt || a.verifiedAt || a.createdAt,
    paid: false,
    userId: a.userId,
    phoneNumber: a.phoneNumber,
    email: a.email,
    birthDate: a.birthDate,
    tags: a.tags,
  };
}

// ── Contact Detail Modal ──

function ContactDetailModal({
  contact,
  onClose,
}: {
  contact: ListContact | null;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  if (!contact) return null;

  const initials = contact.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const rows: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }[] = [];

  if (contact.email) {
    rows.push({ icon: 'mail-outline', label: 'Email', value: contact.email });
  }
  if (contact.birthDate) {
    rows.push({ icon: 'calendar-outline', label: 'Date of Birth', value: formatDate(contact.birthDate) });
  }
  if (contact.documentNumber) {
    rows.push({ icon: 'id-card-outline', label: 'ID Number', value: contact.documentNumber });
  }
  rows.push({
    icon: 'enter-outline',
    label: 'Source',
    value: sourceLabel(contact.source, contact.isGuest),
  });
  rows.push({ icon: 'ticket-outline', label: 'Events', value: String(contact.eventCount) });
  if (contact.lastSeenAt) {
    rows.push({ icon: 'time-outline', label: 'Last Seen', value: formatDate(contact.lastSeenAt) });
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={detailStyles.overlay}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />

        <View style={[detailStyles.sheet, { paddingBottom: insets.bottom + 24 }]}>
          <View style={[detailStyles.card, { backgroundColor: colors.cardElevated, borderColor: colors.border }]}>
            {/* Handle */}
            <View style={[detailStyles.handle, { backgroundColor: colors.textTertiary }]} />

            {/* Profile header */}
            <View style={detailStyles.profileHeader}>
              {contact.avatarUrl ? (
                <Image source={{ uri: contact.avatarUrl }} style={detailStyles.profileAvatar} />
              ) : (
                <View style={[detailStyles.profileAvatarPlaceholder, { backgroundColor: colors.backgroundSecondary }]}>
                  <Text style={[detailStyles.profileInitials, { color: colors.textSecondary }]}>{initials}</Text>
                </View>
              )}
              <Text style={[detailStyles.profileName, { color: colors.text }]}>
                {contact.userName ? `@${contact.userName}` : contact.name}
              </Text>
              {contact.userName && (
                <Text style={[detailStyles.profileSubname, { color: colors.textTertiary }]}>{contact.name}</Text>
              )}
              <View style={[detailStyles.badge, { backgroundColor: contact.isGuest ? 'rgba(251,191,36,0.15)' : 'rgba(52,211,153,0.15)' }]}>
                <Text style={[detailStyles.badgeText, { color: contact.isGuest ? '#fbbf24' : '#34d399' }]}>
                  {contact.isGuest ? 'Guest' : 'Member'}
                </Text>
              </View>
              {contact.tags && contact.tags.length > 0 && (
                <View style={detailStyles.tagsRow}>
                  {contact.tags.map((tag) => {
                    const tagColors: Record<string, string> = {
                      vip: '#f59e0b', line_skip: '#22c55e', backstage: '#a855f7',
                      comp: '#3b82f6', plus_one: '#ec4899',
                    };
                    const color = tagColors[tag] || '#6b7280';
                    return (
                      <View key={tag} style={[detailStyles.tagChip, { backgroundColor: `${color}20` }]}>
                        <Text style={[detailStyles.tagChipText, { color }]}>
                          {tag.replace('_', ' ').toUpperCase()}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Info rows */}
            <ScrollView style={detailStyles.infoList} bounces={false}>
              {rows.map((row, i) => (
                <View
                  key={row.label}
                  style={[
                    detailStyles.infoRow,
                    i < rows.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                  ]}
                >
                  <Ionicons name={row.icon} size={18} color={colors.textTertiary} style={detailStyles.infoIcon} />
                  <View style={detailStyles.infoContent}>
                    <Text style={[detailStyles.infoLabel, { color: colors.textTertiary }]}>{row.label}</Text>
                    <Text style={[detailStyles.infoValue, { color: colors.text }]} selectable>{row.value}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Close */}
            <TouchableOpacity
              style={[detailStyles.closeButton, { borderColor: colors.border }]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={[detailStyles.closeText, { color: colors.text }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Main Component ──

function CheckInsContent() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useAppTheme();
  const eventId = id ? Number(id) : null;

  const { readerStatus, isReaderConnected, isInitialized, connectReader, collectPayment } = useTerminalPayment();
  const connectAttemptedRef = React.useRef(false);

  const [contacts, setContacts] = React.useState<ListContact[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [collectingGuestId, setCollectingGuestId] = React.useState<number | null>(null);
  const [event, setEvent] = React.useState<Event | null>(null);
  const [paymentFailedAlert, setPaymentFailedAlert] = React.useState<string | null>(null);
  const [selectedContact, setSelectedContact] = React.useState<ListContact | null>(null);

  // Fetch event data (for doorCoverPriceCents)
  React.useEffect(() => {
    if (!eventId) return;
    eventsApi.getEvent(eventId).then(setEvent).catch(() => {});
  }, [eventId]);

  // Fetch this event's attendees
  const fetchContacts = React.useCallback(async () => {
    if (!eventId) return;
    try {
      const response = await eventsApi.getEventAttendees(eventId, {
        limit: 5000,
        status: [
          EventUserStatus.VERIFIED,
          EventUserStatus.CHECKED_IN,
          EventUserStatus.SIGNED_UP,
        ],
      });
      const mapped = response.attendees.map(mapAttendee);
      mapped.sort((a, b) => new Date(b.lastSeenAt || 0).getTime() - new Date(a.lastSeenAt || 0).getTime());
      setContacts(mapped);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  // Refetch every time the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchContacts();
    }, [fetchContacts])
  );

  // Polling fallback every 30s
  React.useEffect(() => {
    const interval = setInterval(fetchContacts, 30000);
    return () => clearInterval(interval);
  }, [fetchContacts]);

  // WebSocket live updates — push new check-ins directly into list
  useEventSocket({
    eventId,
    onGuestCheckedIn: React.useCallback(
      (data: {
        guestId: number;
        userId?: number;
        firstName: string;
        lastName: string;
        userName?: string;
        avatarUrl?: string;
        status: string;
        isGuest?: boolean;
        checkedInAt?: string;
      }) => {
        const name = [data.firstName, data.lastName].filter(Boolean).join(' ') || 'Unknown';
        const newEntry: ListContact = {
          id: data.guestId,
          name,
          userName: data.userName,
          avatarUrl: data.avatarUrl,
          isGuest: data.isGuest ?? !data.userId,
          source: 'check_in',
          eventCount: 1,
          lastSeenAt: data.checkedInAt || new Date().toISOString(),
          paid: false,
          userId: data.userId,
        };
        setContacts((prev) => {
          // Replace if already exists (e.g. membership scan updates a guest entry)
          const exists = prev.some((g) => g.id === data.guestId);
          if (exists) {
            return prev.map((g) => (g.id === data.guestId ? { ...g, ...newEntry } : g));
          }
          return [newEntry, ...prev];
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      },
      [],
    ),
    onPaymentReceived: React.useCallback(
      (data: { userId?: number | null; guestId?: number | null }) => {
        setContacts((prev) =>
          prev.map((g) => {
            if (data.guestId && g.id === data.guestId) return { ...g, paid: true };
            if (data.userId && g.userId && g.userId === data.userId) return { ...g, paid: true };
            return g;
          }),
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      },
      [],
    ),
  });

  // Auto-connect Terminal reader
  React.useEffect(() => {
    if (isInitialized && !isReaderConnected && !connectAttemptedRef.current) {
      connectAttemptedRef.current = true;
      connectReader(eventId ?? undefined).catch(() => {});
    }
  }, [isInitialized, isReaderConnected, connectReader]);

  // Auto-charge door cover price
  const handleCharge = React.useCallback(async (guest: ListContact) => {
    if (!eventId) return;

    const doorCoverCents = event?.doorCoverPriceCents;

    // Free event or no door cover — mark as paid instantly
    if (!doorCoverCents || doorCoverCents <= 0) {
      setContacts((prev) =>
        prev.map((g) => (g.id === guest.id ? { ...g, paid: true } : g)),
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }

    setCollectingGuestId(guest.id);

    try {
      // Connect reader if not connected
      if (!isReaderConnected) {
        await connectReader(eventId ?? undefined);
      }

      // Create payment intent with door cover price
      const result = await paymentsApi.collectAtDoor(eventId, {
        guestId: guest.id,
        customAmountCents: doorCoverCents,
        useTerminal: true,
      });

      // Collect payment via NFC tap-to-pay
      await collectPayment(result.clientSecret);

      // Success
      setContacts((prev) =>
        prev.map((g) => (g.id === guest.id ? { ...g, paid: true } : g)),
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      if (err?.message?.includes('canceled')) {
        setCollectingGuestId(null);
        return;
      }
      setPaymentFailedAlert(err?.message || 'Something went wrong.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setCollectingGuestId(null);
    }
  }, [eventId, event, isReaderConnected, connectReader, collectPayment]);

  const doorCoverDisplay = event?.doorCoverPriceCents
    ? `$${(event.doorCoverPriceCents / 100).toFixed(2)}`
    : 'Free';

  const renderContact = React.useCallback(
    ({ item }: { item: ListContact }) => {
      const isCollecting = collectingGuestId === item.id;
      const label = sourceLabel(item.source, item.isGuest);

      return (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setSelectedContact(item)}
        >
          <Animated.View
            entering={FadeInDown.duration(300)}
            exiting={FadeOut.duration(200)}
            layout={Layout.springify()}
            style={[styles.guestRow, { backgroundColor: colors.cardElevated, borderColor: colors.border }]}
          >
            {/* Avatar */}
            {item.avatarUrl ? (
              <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.backgroundSecondary }]}>
                <Text style={[styles.avatarInitials, { color: colors.textSecondary }]}>
                  {item.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </Text>
              </View>
            )}

            {/* Info */}
            <View style={styles.guestInfo}>
              <Text style={[styles.guestName, { color: colors.text }]} numberOfLines={1}>
                {item.userName ? `@${item.userName}` : item.name}
              </Text>
              <View style={styles.guestMeta}>
                {item.userName && (
                  <Text style={[styles.guestMetaText, { color: colors.textTertiary }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                )}
                <Text style={[styles.guestMetaText, { color: item.isGuest ? '#fbbf24' : '#34d399' }]}>
                  {label}
                </Text>
                {item.eventCount > 1 && (
                  <Text style={[styles.guestMetaText, { color: colors.textTertiary }]}>
                    {item.eventCount} events
                  </Text>
                )}
                {item.lastSeenAt && (
                  <Text style={[styles.guestMetaText, { color: colors.textTertiary }]}>
                    {formatTimeAgo(item.lastSeenAt)}
                  </Text>
                )}
              </View>
              {item.tags && item.tags.length > 0 && (
                <View style={styles.tagsRow}>
                  {item.tags.map((tag) => {
                    const tc: Record<string, string> = {
                      vip: '#f59e0b', line_skip: '#22c55e', backstage: '#a855f7',
                      comp: '#3b82f6', plus_one: '#ec4899',
                    };
                    return (
                      <View key={tag} style={[styles.tagBadge, { backgroundColor: `${tc[tag] || '#6b7280'}20` }]}>
                        <Text style={[styles.tagBadgeText, { color: tc[tag] || '#6b7280' }]}>
                          {tag.replace('_', ' ').toUpperCase()}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Charge / Paid */}
            {item.paid ? (
              <View style={styles.paidBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#10b981" />
                <Text style={styles.paidBadgeText}>Paid</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.chargeButton, { backgroundColor: colors.cardElevated, borderColor: colors.border }]}
                onPress={() => handleCharge(item)}
                activeOpacity={0.8}
                disabled={isCollecting || collectingGuestId !== null}
              >
                {isCollecting ? (
                  <ActivityIndicator size="small" color={colors.text} />
                ) : (
                  <>
                    <Ionicons name="phone-portrait-outline" size={14} color={colors.text} />
                    <Text style={[styles.chargeButtonText, { color: colors.text }]}>
                      Charge {doorCoverDisplay}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </Animated.View>
        </TouchableOpacity>
      );
    },
    [collectingGuestId, handleCharge, doorCoverDisplay],
  );

  const keyExtractor = React.useCallback(
    (item: ListContact) => String(item.id),
    [],
  );

  if (!eventId) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {isDark && <DarkGradientBg />}
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>No event selected</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {isDark && <DarkGradientBg />}
      <ConfirmModal
        visible={!!paymentFailedAlert}
        onClose={() => setPaymentFailedAlert(null)}
        title="Payment Failed"
        message={paymentFailedAlert || ''}
        alertOnly
        icon="card-outline"
      />
      <ContactDetailModal
        contact={selectedContact}
        onClose={() => setSelectedContact(null)}
      />

      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(400)}
        style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Check Ins</Text>
          <View style={styles.headerStatusRow}>
            <View
              style={[
                styles.readerDot,
                {
                  backgroundColor: isReaderConnected
                    ? '#34d399'
                    : readerStatus === 'connecting'
                      ? '#fbbf24'
                      : '#f87171',
                },
              ]}
            />
            <Text style={[styles.headerSubtitle, { color: colors.textTertiary }]}>
              {contacts.length} attendee{contacts.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.backButton}
          onPress={fetchContacts}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh" size={20} color={colors.text} />
        </TouchableOpacity>
      </Animated.View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.text} />
          <Text style={[styles.loadingText, { color: colors.textTertiary }]}>Loading list...</Text>
        </View>
      ) : contacts.length === 0 ? (
        <Animated.View
          entering={FadeIn.duration(500)}
          style={styles.centerContent}
        >
          <Ionicons
            name="people-outline"
            size={64}
            color={colors.textTertiary}
          />
          <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>No attendees yet</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
            People who RSVP, buy tickets, or check in will appear here
          </Text>
        </Animated.View>
      ) : (
        <FlatList
          data={contacts}
          renderItem={renderContact}
          keyExtractor={keyExtractor}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 20 },
          ]}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

export default function CheckInsScreen() {
  return (
    <TerminalProvider>
      <CheckInsContent />
    </TerminalProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: 'Lato_700Bold',
  },
  headerStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  readerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Lato_700Bold',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
    marginTop: 100,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  guestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  avatarPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
  },
  guestInfo: {
    flex: 1,
    marginLeft: 12,
  },
  guestName: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
  },
  guestMeta: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 3,
  },
  guestMetaText: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 3,
  },
  tagBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  tagBadgeText: {
    fontSize: 9,
    fontFamily: 'Lato_700Bold',
  },
  chargeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  chargeButtonText: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(16,185,129,0.15)',
  },
  paidBadgeText: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
    color: '#10b981',
  },
});

const detailStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    paddingHorizontal: 20,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    paddingTop: 12,
    paddingBottom: 20,
    paddingHorizontal: 20,
    maxHeight: '80%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
    opacity: 0.4,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 12,
  },
  profileAvatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileInitials: {
    fontSize: 26,
    fontFamily: 'Lato_700Bold',
  },
  profileName: {
    fontSize: 20,
    fontFamily: 'Lato_700Bold',
  },
  profileSubname: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    marginTop: 2,
  },
  badge: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: 'Lato_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoList: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  infoIcon: {
    width: 28,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontFamily: 'Lato_400Regular',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
  },
  closeButton: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  closeText: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  tagChip: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagChipText: {
    fontSize: 11,
    fontFamily: 'Lato_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});
