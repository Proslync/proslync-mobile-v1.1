import * as React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  Layout,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { usePaymentSheet } from '@stripe/stripe-react-native';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { eventsApi } from '@/lib/api/events';
import { paymentsApi } from '@/lib/api/payments';
import { useEventSocket } from '@/hooks/use-event-socket';
import { EventUserStatus } from '@/lib/types/events.types';
import type { EventAttendee } from '@/lib/types/events.types';

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

export default function CheckInsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const eventId = id ? Number(id) : null;

  const { initPaymentSheet, presentPaymentSheet } = usePaymentSheet();

  const [guests, setGuests] = React.useState<CheckedInGuest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [collectingGuestId, setCollectingGuestId] = React.useState<number | null>(null);

  // Charge modal state
  const [chargeModalVisible, setChargeModalVisible] = React.useState(false);
  const [chargeGuest, setChargeGuest] = React.useState<CheckedInGuest | null>(null);
  const [chargeAmount, setChargeAmount] = React.useState('');

  // Fetch checked-in guests
  const fetchGuests = React.useCallback(async () => {
    if (!eventId) return;
    try {
      const response = await eventsApi.getEventAttendees(eventId, {
        limit: 100,
      });
      // Filter to checked-in statuses on the client
      const checkedInStatuses = [
        EventUserStatus.VERIFIED,
        EventUserStatus.CHECKED_IN,
        EventUserStatus.SEATED,
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
      console.error('[CheckIns] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  // Initial load
  React.useEffect(() => {
    fetchGuests();
  }, [fetchGuests]);

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
      (data: { userId: number }) => {
        setGuests((prev) =>
          prev.map((g) => (g.userId === data.userId ? { ...g, paid: true } : g)),
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      },
      [],
    ),
  });

  // Open charge modal
  const openChargeModal = React.useCallback((guest: CheckedInGuest) => {
    setChargeGuest(guest);
    setChargeAmount('');
    setChargeModalVisible(true);
  }, []);

  // Handle charge with custom amount
  const handleCharge = React.useCallback(async () => {
    if (!eventId || !chargeGuest) return;

    const dollars = parseFloat(chargeAmount);
    if (isNaN(dollars) || dollars < 0.5) {
      Alert.alert('Invalid Amount', 'Please enter at least $0.50');
      return;
    }

    const amountCents = Math.round(dollars * 100);
    setChargeModalVisible(false);
    setCollectingGuestId(chargeGuest.id);

    try {
      // 1. Create payment intent with custom amount
      const result = await paymentsApi.collectAtDoor(eventId, {
        guestId: chargeGuest.id,
        customAmountCents: amountCents,
      });

      // 2. Init Stripe Payment Sheet (Apple Pay / NFC Tap to Pay)
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: result.clientSecret,
        merchantDisplayName: 'Status',
        style: 'alwaysDark',
        applePay: { merchantCountryCode: 'US' },
        googlePay: { merchantCountryCode: 'US', testEnv: true },
      });

      if (initError) throw new Error(initError.message);

      // 3. Present payment sheet — guest taps phone/card
      const { error: paymentError } = await presentPaymentSheet();

      if (paymentError) {
        if (paymentError.code === 'Canceled') {
          setCollectingGuestId(null);
          return;
        }
        throw new Error(paymentError.message);
      }

      // 4. Success
      setGuests((prev) =>
        prev.map((g) => (g.id === chargeGuest.id ? { ...g, paid: true } : g)),
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      Alert.alert('Payment Failed', err?.message || 'Something went wrong.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setCollectingGuestId(null);
      setChargeGuest(null);
    }
  }, [eventId, chargeGuest, chargeAmount, initPaymentSheet, presentPaymentSheet]);

  const renderGuest = React.useCallback(
    ({ item }: { item: CheckedInGuest }) => {
      const isCollecting = collectingGuestId === item.id;

      return (
        <Animated.View
          entering={FadeInDown.duration(300)}
          exiting={FadeOut.duration(200)}
          layout={Layout.springify()}
          style={styles.guestRow}
        >
          {/* Avatar placeholder */}
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitials}>
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
            <Text style={styles.guestName} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={styles.guestMeta}>
              {item.age != null && (
                <Text style={styles.guestMetaText}>Age {item.age}</Text>
              )}
              {item.checkedInAt && (
                <Text style={styles.guestMetaText}>
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
              style={styles.chargeButton}
              onPress={() => openChargeModal(item)}
              activeOpacity={0.8}
              disabled={isCollecting || collectingGuestId !== null}
            >
              {isCollecting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="card-outline" size={14} color="#fff" />
                  <Text style={styles.chargeButtonText}>Charge</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </Animated.View>
      );
    },
    [collectingGuestId, openChargeModal],
  );

  const keyExtractor = React.useCallback(
    (item: CheckedInGuest) => String(item.id),
    [],
  );

  if (!eventId) {
    return (
      <View style={styles.container}>
        <DarkGradientBg />
        <Text style={styles.errorText}>No event selected</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <DarkGradientBg />

      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(400)}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Check Ins</Text>
          <Text style={styles.headerSubtitle}>
            {guests.length} guest{guests.length !== 1 ? 's' : ''} checked in
          </Text>
        </View>
        <TouchableOpacity
          style={styles.backButton}
          onPress={fetchGuests}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh" size={20} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading check-ins...</Text>
        </View>
      ) : guests.length === 0 ? (
        <Animated.View
          entering={FadeIn.duration(500)}
          style={styles.centerContent}
        >
          <Ionicons
            name="scan-outline"
            size={64}
            color="rgba(255,255,255,0.4)"
          />
          <Text style={styles.emptyTitle}>No check-ins yet</Text>
          <Text style={styles.emptySubtitle}>
            Guests will appear here after being scanned and approved
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

      {/* Charge Amount Modal */}
      <Modal
        visible={chargeModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setChargeModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={[styles.modalContainer, { paddingTop: insets.top }]}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Charge Guest</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setChargeModalVisible(false)}
            >
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Guest Info */}
          <View style={styles.modalBody}>
            <Text style={styles.modalGuestName}>{chargeGuest?.name}</Text>
            {chargeGuest?.age != null && (
              <Text style={styles.modalGuestMeta}>Age {chargeGuest.age}</Text>
            )}

            {/* Amount Input */}
            <Text style={styles.amountLabel}>Amount</Text>
            <View style={styles.amountInputRow}>
              <Text style={styles.dollarSign}>$</Text>
              <TextInput
                style={styles.amountInput}
                value={chargeAmount}
                onChangeText={setChargeAmount}
                placeholder="0.00"
                placeholderTextColor="rgba(255,255,255,0.3)"
                keyboardType="decimal-pad"
                autoFocus
              />
            </View>
          </View>

          {/* Charge Button */}
          <View style={[styles.modalFooter, { paddingBottom: insets.bottom + 16 }]}>
            <TouchableOpacity
              style={[
                styles.chargeSubmitButton,
                (!chargeAmount || parseFloat(chargeAmount) < 0.5) &&
                  styles.chargeSubmitDisabled,
              ]}
              onPress={handleCharge}
              disabled={!chargeAmount || parseFloat(chargeAmount) < 0.5}
              activeOpacity={0.7}
            >
              <Ionicons name="card-outline" size={20} color="#fff" />
              <Text style={styles.chargeSubmitText}>
                {chargeAmount && parseFloat(chargeAmount) >= 0.5
                  ? `Charge $${parseFloat(chargeAmount).toFixed(2)}`
                  : 'Enter Amount'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.12)',
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
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
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
    color: 'rgba(255,255,255,0.5)',
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Lato_700Bold',
    color: 'rgba(255,255,255,0.6)',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.5)',
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
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  avatarPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
    color: 'rgba(255,255,255,0.6)',
  },
  guestInfo: {
    flex: 1,
    marginLeft: 12,
  },
  guestName: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  guestMeta: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 3,
  },
  guestMetaText: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.4)',
  },
  chargeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  chargeButtonText: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
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

  // ─── Charge Modal ─────────────────────────────────────────
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 16,
    color: '#fff',
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
    alignItems: 'center',
  },
  modalGuestName: {
    fontSize: 22,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
    marginBottom: 4,
  },
  modalGuestMeta: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 40,
  },
  amountLabel: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    color: 'rgba(255,255,255,0.7)',
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    paddingHorizontal: 20,
    width: '100%',
  },
  dollarSign: {
    fontSize: 28,
    fontFamily: 'Lato_700Bold',
    color: 'rgba(255,255,255,0.5)',
    marginRight: 4,
  },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
    paddingVertical: 18,
  },
  modalFooter: {
    padding: 20,
  },
  chargeSubmitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 14,
    paddingVertical: 16,
  },
  chargeSubmitDisabled: {
    opacity: 0.4,
  },
  chargeSubmitText: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
});
