import * as React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
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
import { EventUserStatus } from '@/lib/types/events.types';
import type { Event, EventAttendee } from '@/lib/types/events.types';

interface CheckedInGuest {
  id: number;
  name: string;
  age?: number;
  checkedInAt?: string;
  status: string;
  paid: boolean;
  userId?: number;
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

function mapAttendee(a: EventAttendee): CheckedInGuest {
  const name =
    [a.firstName, a.lastName].filter(Boolean).join(' ') ||
    a.guestName ||
    'Unknown';
  let age: number | undefined;
  if (a.birthDate) {
    const bd = new Date(a.birthDate);
    const today = new Date();
    age = today.getFullYear() - bd.getFullYear();
    const m = today.getMonth() - bd.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--;
  }
  return {
    id: a.id,
    name,
    age,
    checkedInAt: a.verifiedAt || a.createdAt,
    status: a.status || '',
    paid: false,
    userId: a.userId,
  };
}

function CheckInsContent() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useAppTheme();
  const eventId = id ? Number(id) : null;

  const { readerStatus, isReaderConnected, isInitialized, connectReader, collectPayment } = useTerminalPayment();
  const connectAttemptedRef = React.useRef(false);

  const [guests, setGuests] = React.useState<CheckedInGuest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [collectingGuestId, setCollectingGuestId] = React.useState<number | null>(null);
  const [event, setEvent] = React.useState<Event | null>(null);
  const [paymentFailedAlert, setPaymentFailedAlert] = React.useState<string | null>(null);

  // Fetch event data (for doorCoverPriceCents)
  React.useEffect(() => {
    if (!eventId) return;
    eventsApi.getEvent(eventId).then(setEvent).catch(() => {});
  }, [eventId]);

  // Fetch checked-in guests
  const fetchGuests = React.useCallback(async () => {
    if (!eventId) return;
    try {
      const response = await eventsApi.getEventAttendees(eventId, {
        limit: 100,
      });
      const checkedInStatuses = [
        EventUserStatus.VERIFIED,
        EventUserStatus.CHECKED_IN,
      ];
      const filtered = response.attendees.filter(
        (a) => a.status && checkedInStatuses.includes(a.status),
      );
      const mapped = filtered.map(mapAttendee);
      mapped.sort(
        (a, b) =>
          new Date(b.checkedInAt || 0).getTime() -
          new Date(a.checkedInAt || 0).getTime(),
      );
      setGuests(mapped);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  // Refetch every time the screen comes into focus (e.g. after scanner approval)
  useFocusEffect(
    React.useCallback(() => {
      fetchGuests();
    }, [fetchGuests])
  );

  // Polling fallback every 30s
  React.useEffect(() => {
    if (!eventId) return;
    const interval = setInterval(fetchGuests, 30000);
    return () => clearInterval(interval);
  }, [eventId, fetchGuests]);

  // WebSocket live updates
  useEventSocket({
    eventId,
    onGuestCheckedIn: React.useCallback(() => {
      fetchGuests();
    }, [fetchGuests]),
    onPaymentReceived: React.useCallback(
      (data: { userId?: number | null; guestId?: number | null }) => {
        setGuests((prev) =>
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
  const handleCharge = React.useCallback(async (guest: CheckedInGuest) => {
    if (!eventId) return;

    const doorCoverCents = event?.doorCoverPriceCents;

    // Free event or no door cover — mark as paid instantly
    if (!doorCoverCents || doorCoverCents <= 0) {
      setGuests((prev) =>
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
      setGuests((prev) =>
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

  const renderGuest = React.useCallback(
    ({ item }: { item: CheckedInGuest }) => {
      const isCollecting = collectingGuestId === item.id;

      return (
        <Animated.View
          entering={FadeInDown.duration(300)}
          exiting={FadeOut.duration(200)}
          layout={Layout.springify()}
          style={[styles.guestRow, { backgroundColor: colors.cardElevated, borderColor: colors.border }]}
        >
          {/* Avatar placeholder */}
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

          {/* Info */}
          <View style={styles.guestInfo}>
            <Text style={[styles.guestName, { color: colors.text }]} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={styles.guestMeta}>
              {item.age != null && (
                <Text style={[styles.guestMetaText, { color: colors.textTertiary }]}>Age {item.age}</Text>
              )}
              {item.checkedInAt && (
                <Text style={[styles.guestMetaText, { color: colors.textTertiary }]}>
                  {formatTimeAgo(item.checkedInAt)}
                </Text>
              )}
            </View>
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
      );
    },
    [collectingGuestId, handleCharge, doorCoverDisplay],
  );

  const keyExtractor = React.useCallback(
    (item: CheckedInGuest) => String(item.id),
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
              {guests.length} guest{guests.length !== 1 ? 's' : ''} checked in
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.backButton}
          onPress={fetchGuests}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh" size={20} color={colors.text} />
        </TouchableOpacity>
      </Animated.View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.text} />
          <Text style={[styles.loadingText, { color: colors.textTertiary }]}>Loading check-ins...</Text>
        </View>
      ) : guests.length === 0 ? (
        <Animated.View
          entering={FadeIn.duration(500)}
          style={styles.centerContent}
        >
          <Ionicons
            name="scan-outline"
            size={64}
            color={colors.textTertiary}
          />
          <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>No check-ins yet</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
            Guests will appear here once they've been scanned at the door
          </Text>
        </Animated.View>
      ) : (
        <FlatList
          data={guests}
          renderItem={renderGuest}
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
