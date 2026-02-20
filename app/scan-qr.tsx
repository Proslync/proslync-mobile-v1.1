import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Linking,
  FlatList,
  Alert,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
  Code,
} from 'react-native-vision-camera';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeInUp,
  FadeOutDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { usePaymentSheet } from '@stripe/stripe-react-native';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { eventsApi } from '@/lib/api/events';
import { paymentsApi } from '@/lib/api/payments';
import type { EventAttendee } from '@/lib/types/events.types';
import { EventUserStatus } from '@/lib/types/events.types';

// ─── Types ───────────────────────────────────────────────────────────────────

type ScanStep = 'membership' | 'id';

interface MembershipData {
  rawPayload: string;
  memberName?: string;
  memberId?: string;
  cardId?: string;
}

interface IdScanResult {
  title: string;
  subtitle?: string;
  status: 'success' | 'warning' | 'error';
  fields: { label: string; value: string }[];
  idData?: {
    firstName: string;
    lastName: string;
    birthDate: string;
    expirationDate: string;
    documentNumber?: string;
  };
  guestId?: number;
  tempId?: string;
  // Ticket/membership info (populated after validateMembershipCard)
  ticketStatus?: 'found' | 'rsvp' | 'none' | 'skipped';
  ticketInfo?: string;
}

interface CheckedInGuest {
  id: string;
  name: string;
  time: string;
  status: 'approved' | 'denied';
  age?: number;
  backendStatus?: string;
  paid?: boolean;
  guestIdNum?: number; // numeric backend guest ID for payment collection
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SCAN_FRAME_SIZE = SCREEN_WIDTH - 80;

// ─── ID Parsing ──────────────────────────────────────────────────────────────

function parseDriverLicense(data: string): {
  firstName: string;
  lastName: string;
  birthDate: string;
  expirationDate: string;
  documentNumber?: string;
} | null {
  try {
    const fields: Record<string, string> = {};
    let lines = data.split(/[\n\r]+/);
    if (lines.length < 3) {
      lines = data.split(/(?=D[A-Z]{2})/);
    }

    for (const line of lines) {
      if (line.length >= 3) {
        const code = line.substring(0, 3);
        const value = line.substring(3).trim();
        if (value) {
          fields[code] = value;
        }
      }
    }

    let firstName = fields['DAC'] || fields['DCT'] || '';
    let lastName = fields['DCS'] || '';

    if (!firstName && fields['DAA']) {
      const nameParts = fields['DAA'].split(',');
      lastName = nameParts[0]?.trim() || '';
      firstName = nameParts[1]?.trim() || '';
    }

    const parseDateField = (value: string): string => {
      if (!value) return '';
      const cleaned = value.replace(/\D/g, '');
      if (cleaned.length === 8) {
        const firstFour = parseInt(cleaned.substring(0, 4));
        if (firstFour > 1900 && firstFour < 2100) {
          return `${cleaned.substring(0, 4)}-${cleaned.substring(4, 6)}-${cleaned.substring(6, 8)}`;
        } else {
          return `${cleaned.substring(4, 8)}-${cleaned.substring(0, 2)}-${cleaned.substring(2, 4)}`;
        }
      }
      return value;
    };

    const birthDate = parseDateField(fields['DBB'] || '');
    const expirationDate = parseDateField(fields['DBA'] || '');
    const documentNumber = fields['DAQ'] || fields['DCF'] || undefined;

    if (firstName && lastName && birthDate) {
      return { firstName, lastName, birthDate, expirationDate, documentNumber };
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

const calculateAge = (birthDateStr: string): number => {
  const birthDate = new Date(birthDateStr);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const getAgeFromResult = (result: IdScanResult): number | undefined => {
  const ageField = result.fields.find(f => f.label === 'Age');
  return ageField ? parseInt(ageField.value) : undefined;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'success': return '#10b981';
    case 'warning': return '#f59e0b';
    case 'error': return '#ef4444';
    default: return '#fff';
  }
};

const getStatusIcon = (status: string): keyof typeof Ionicons.glyphMap => {
  switch (status) {
    case 'success': return 'checkmark-circle';
    case 'warning': return 'alert-circle';
    case 'error': return 'close-circle';
    default: return 'checkmark-circle';
  }
};

const getTicketBadge = (ticketStatus?: string) => {
  switch (ticketStatus) {
    case 'found': return { label: 'Ticket Found', color: '#10b981', bg: 'rgba(16,185,129,0.15)' };
    case 'rsvp': return { label: "RSVP'd", color: '#10b981', bg: 'rgba(16,185,129,0.15)' };
    case 'none': return { label: 'No Ticket', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' };
    case 'skipped': return { label: 'Card Not Scanned', color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.08)' };
    default: return null;
  }
};

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ScannerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { eventId: eventIdParam } = useLocalSearchParams<{ eventId?: string }>();
  const eventId = eventIdParam ? parseInt(eventIdParam, 10) : undefined;

  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const { initPaymentSheet, presentPaymentSheet } = usePaymentSheet();

  // Payment state
  const [chargingGuestId, setChargingGuestId] = React.useState<string | null>(null);
  const [eventPricing, setEventPricing] = React.useState<{
    defaultTierId?: number;
    defaultPricingId?: number;
    defaultPrice?: number;
    currency?: string;
  } | null>(null);

  // Flow state
  const [scanStep, setScanStep] = React.useState<ScanStep>('membership');
  const [membershipData, setMembershipData] = React.useState<MembershipData | null>(null);
  const [skippedMembership, setSkippedMembership] = React.useState(false);
  const [showMembershipResult, setShowMembershipResult] = React.useState(false);

  // ID scan state
  const [idResult, setIdResult] = React.useState<IdScanResult | null>(null);
  const [isValidating, setIsValidating] = React.useState(false);

  // Camera & actions
  const [torch, setTorch] = React.useState(false);
  const [isActive, setIsActive] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Guest list
  const [checkedInGuests, setCheckedInGuests] = React.useState<CheckedInGuest[]>([]);
  const [showList, setShowList] = React.useState(false);
  const [listStats, setListStats] = React.useState<{ total: number; verified: number; pending: number }>({ total: 0, verified: 0, pending: 0 });

  // ─── Guest list helpers ──────────────────────────────────────────────────

  const mapAttendeeToGuest = React.useCallback((a: EventAttendee): CheckedInGuest => {
    const name = [a.firstName, a.lastName].filter(Boolean).join(' ') || a.guestName || 'Unknown';
    const isApproved = a.status === EventUserStatus.VERIFIED ||
      a.status === EventUserStatus.CHECKED_IN ||
      a.status === EventUserStatus.SEATED;
    let age: number | undefined;
    if (a.birthDate) {
      const bd = new Date(a.birthDate);
      const today = new Date();
      age = today.getFullYear() - bd.getFullYear();
      const m = today.getMonth() - bd.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--;
    }
    return {
      id: String(a.id),
      name,
      time: a.verifiedAt || a.createdAt || new Date().toISOString(),
      status: isApproved ? 'approved' : 'denied',
      age,
      backendStatus: a.status,
      guestIdNum: a.id,
    };
  }, []);

  const fetchGuestList = React.useCallback(async () => {
    if (!eventId) return;
    try {
      const response = await eventsApi.getEventAttendees(eventId, {
        limit: 200,
        status: [
          EventUserStatus.VERIFIED,
          EventUserStatus.REJECTED,
          EventUserStatus.CHECKED_IN,
          EventUserStatus.SEATED,
        ],
      });
      const mapped = response.attendees.map(mapAttendeeToGuest);
      mapped.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setCheckedInGuests(mapped);
      if (response.statistics) {
        setListStats({
          total: response.statistics.totalAttendees,
          verified: response.statistics.verifiedAttendees,
          pending: response.statistics.pendingAttendees,
        });
      }
    } catch {
      // Keep local state on error
    }
  }, [eventId, mapAttendeeToGuest]);

  React.useEffect(() => {
    fetchGuestList();
  }, [fetchGuestList]);

  // Fetch event pricing for collect-at-door
  React.useEffect(() => {
    if (!eventId) return;
    paymentsApi.getUnpaidAttendees(eventId).then((res) => {
      setEventPricing({
        defaultTierId: res.defaultTierId,
        defaultPricingId: res.defaultPricingId,
        defaultPrice: res.defaultPrice,
        currency: res.currency,
      });
    }).catch(() => {});
  }, [eventId]);

  // ─── Scan line animation ─────────────────────────────────────────────────

  const scanLinePosition = useSharedValue(0);

  React.useEffect(() => {
    scanLinePosition.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanLinePosition.value * (SCAN_FRAME_SIZE - 4) }],
  }));

  // ─── Step 1: Membership scan handler ─────────────────────────────────────

  const handleMembershipScan = React.useCallback((data: string) => {
    let parsed: any = null;
    try {
      parsed = JSON.parse(data);
    } catch {}

    const memberName = parsed?.name || parsed?.memberName || undefined;
    const memberId = parsed?.memberId || parsed?.userId || undefined;
    const cardId = parsed?.cardId || parsed?.id || data.substring(0, 20);

    setMembershipData({
      rawPayload: data,
      memberName,
      memberId: memberId ? String(memberId) : undefined,
      cardId,
    });
    setShowMembershipResult(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const handleContinueToId = () => {
    setShowMembershipResult(false);
    setScanStep('id');
    setIsActive(true);
  };

  const handleSkipMembership = () => {
    setSkippedMembership(true);
    setMembershipData(null);
    setShowMembershipResult(false);
    setScanStep('id');
    setIsActive(true);
    Haptics.selectionAsync();
  };

  // ─── Step 2: ID scan handler ─────────────────────────────────────────────

  const handleIdScan = React.useCallback(async (data: string) => {
    const licenseData = parseDriverLicense(data);
    if (!licenseData) {
      setIdResult({
        title: 'Could Not Read ID',
        subtitle: 'Please try again',
        status: 'error',
        fields: [],
        ticketStatus: skippedMembership ? 'skipped' : undefined,
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      return;
    }

    const age = calculateAge(licenseData.birthDate);
    const expirationDate = new Date(licenseData.expirationDate);
    const isExpired = expirationDate < new Date();

    let status: 'success' | 'warning' | 'error' = 'success';
    let subtitle = '';

    if (isExpired) {
      status = 'error';
      subtitle = 'ID Expired';
    } else if (age < 21) {
      status = 'warning';
      subtitle = 'Under 21';
    } else {
      subtitle = '21+';
    }

    const result: IdScanResult = {
      title: `${licenseData.firstName} ${licenseData.lastName}`,
      subtitle,
      status,
      fields: [
        { label: 'Age', value: String(age) },
        { label: 'DOB', value: formatDate(licenseData.birthDate) },
        { label: 'Expires', value: formatDate(licenseData.expirationDate) },
        ...(licenseData.documentNumber ? [{ label: 'ID #', value: licenseData.documentNumber }] : []),
      ],
      idData: licenseData,
      ticketStatus: skippedMembership ? 'skipped' : undefined,
    };

    setIdResult(result);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Validate with backend
    if (eventId) {
      setIsValidating(true);
      try {
        // Step A: Validate document → get guestId + tempId
        const docResponse = await eventsApi.validateDocument(eventId, {
          firstName: licenseData.firstName,
          lastName: licenseData.lastName,
          birthDate: licenseData.birthDate,
          expirationDate: licenseData.expirationDate,
          documentNumber: licenseData.documentNumber,
        });

        result.guestId = docResponse.guestId;
        result.tempId = docResponse.tempId;

        // Step B: If membership card was scanned, validate it now with tempId
        if (membershipData?.rawPayload && docResponse.tempId) {
          try {
            const membershipResponse = await eventsApi.validateMembershipCard(eventId, {
              tempId: docResponse.tempId,
              payload: membershipData.rawPayload,
            });

            if (membershipResponse.ticket) {
              result.ticketStatus = 'found';
              result.ticketInfo = `Ticket #${membershipResponse.ticket.ticketNumber}`;
            } else if (membershipResponse.success) {
              result.ticketStatus = 'rsvp';
            } else {
              result.ticketStatus = 'none';
              result.ticketInfo = membershipResponse.failureReason || undefined;
            }

            // Use guestId from membership response if available
            if (membershipResponse.guestId) {
              result.guestId = membershipResponse.guestId;
            }
          } catch {
            result.ticketStatus = 'none';
          }
        }

        setIdResult({ ...result });
      } catch {
        // Keep local result without backend data
      } finally {
        setIsValidating(false);
      }
    }
  }, [eventId, membershipData, skippedMembership]);

  // ─── Code scanner (switches between QR and PDF417 based on step) ─────────

  const codeScanner = useCodeScanner({
    codeTypes: scanStep === 'membership' ? ['qr'] : ['pdf-417'],
    onCodeScanned: (codes: Code[]) => {
      if (codes.length === 0) return;
      // Don't scan if we're showing a result
      if (scanStep === 'membership' && showMembershipResult) return;
      if (scanStep === 'id' && idResult) return;

      const code = codes[0];
      if (!code.value) return;

      setIsActive(false);

      if (scanStep === 'membership') {
        handleMembershipScan(code.value);
      } else {
        handleIdScan(code.value);
      }
    },
  });

  // ─── Actions ─────────────────────────────────────────────────────────────

  const addToListOptimistic = (result: IdScanResult, guestStatus: 'approved' | 'denied') => {
    setCheckedInGuests((prev) => [{
      id: String(result.guestId || Date.now()),
      name: result.title,
      time: new Date().toISOString(),
      status: guestStatus,
      age: getAgeFromResult(result),
      guestIdNum: result.guestId,
    }, ...prev]);
  };

  const resetFlow = () => {
    setIdResult(null);
    setMembershipData(null);
    setSkippedMembership(false);
    setShowMembershipResult(false);
    setScanStep('membership');
    setIsActive(true);
  };

  const handleApprove = async () => {
    if (!idResult) return;

    setIsSubmitting(true);
    try {
      if (eventId && idResult.guestId) {
        await eventsApi.approveGuest(eventId, idResult.guestId, 'Approved at door');
        fetchGuestList();
      } else {
        addToListOptimistic(idResult, 'approved');
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      addToListOptimistic(idResult, 'approved');
    } finally {
      setIsSubmitting(false);
      resetFlow();
    }
  };

  const handleDeny = async () => {
    if (!idResult) return;

    setIsSubmitting(true);
    try {
      if (eventId && idResult.guestId) {
        const reason = idResult.status === 'error' ? 'ID Expired'
          : idResult.status === 'warning' ? 'Under 21'
          : 'Denied at door';
        await eventsApi.denyGuest(eventId, idResult.guestId, reason);
        fetchGuestList();
      } else {
        addToListOptimistic(idResult, 'denied');
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {
      addToListOptimistic(idResult, 'denied');
    } finally {
      setIsSubmitting(false);
      resetFlow();
    }
  };

  const handleScanNext = () => {
    setIdResult(null);
    setIsActive(true);
  };

  // ─── Charge guest (collect payment at door) ────────────────────────────

  const handleCharge = React.useCallback(async (guest: CheckedInGuest) => {
    if (!eventId || !guest.guestIdNum) return;

    setChargingGuestId(guest.id);
    try {
      // 1. Create payment intent
      const result = await paymentsApi.collectAtDoor(eventId, {
        guestId: guest.guestIdNum,
        tierId: eventPricing?.defaultTierId,
        pricingId: eventPricing?.defaultPricingId,
      });

      // 2. Init Stripe Payment Sheet
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
          setChargingGuestId(null);
          return;
        }
        throw new Error(paymentError.message);
      }

      // 4. Success — mark as paid
      setCheckedInGuests((prev) =>
        prev.map((g) => g.id === guest.id ? { ...g, paid: true } : g)
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      Alert.alert('Payment Failed', err?.message || 'Something went wrong.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setChargingGuestId(null);
    }
  }, [eventId, eventPricing, initPaymentSheet, presentPaymentSheet]);

  // ─── Permission / device checks ──────────────────────────────────────────

  React.useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  if (!hasPermission) {
    return (
      <View style={[styles.container, styles.centered]}>
        <DarkGradientBg />
        <View style={styles.permissionIcon}>
          <Ionicons name="camera" size={48} color="#fff" />
        </View>
        <Text style={styles.permissionTitle}>Camera Access</Text>
        <Text style={styles.permissionText}>
          We need camera access to scan IDs and membership cards
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Enable Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingsLink} onPress={() => Linking.openSettings()}>
          <Text style={styles.settingsLinkText}>Open Settings</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={[styles.container, styles.centered]}>
        <DarkGradientBg />
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Initializing camera...</Text>
      </View>
    );
  }

  // ─── Guest list view ─────────────────────────────────────────────────────

  if (showList) {
    return (
      <View style={[styles.container, { backgroundColor: '#000' }]}>
        <DarkGradientBg />
        <View style={[styles.listHeader, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity style={styles.headerButton} onPress={() => setShowList(false)}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Guest List</Text>
            <Text style={styles.listCount}>
              {checkedInGuests.filter(g => g.status === 'approved').length} approved · {checkedInGuests.filter(g => g.status === 'denied').length} denied
            </Text>
          </View>
          <TouchableOpacity style={styles.headerButton} onPress={fetchGuestList}>
            <Ionicons name="refresh" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={checkedInGuests}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 20 }}
          ListEmptyComponent={
            <View style={styles.emptyList}>
              <Ionicons name="people-outline" size={48} color="rgba(255,255,255,0.2)" />
              <Text style={styles.emptyListText}>No guests checked in yet</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isCharging = chargingGuestId === item.id;
            return (
              <View style={styles.guestRow}>
                <View style={[styles.guestStatusDot, {
                  backgroundColor: item.status === 'approved' ? '#10b981' : '#ef4444',
                }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.guestName}>{item.name}</Text>
                  <Text style={styles.guestMeta}>
                    {item.age ? `Age ${item.age} · ` : ''}{formatTime(item.time)}
                  </Text>
                </View>
                {/* Charge / Paid / Denied status */}
                {item.status === 'approved' && !item.paid && item.guestIdNum ? (
                  <TouchableOpacity
                    style={styles.chargeButton}
                    onPress={() => handleCharge(item)}
                    activeOpacity={0.8}
                    disabled={isCharging || chargingGuestId !== null}
                  >
                    {isCharging ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="card-outline" size={14} color="#fff" />
                        <Text style={styles.chargeButtonText}>Charge</Text>
                      </>
                    )}
                  </TouchableOpacity>
                ) : item.paid ? (
                  <View style={styles.paidBadge}>
                    <Ionicons name="checkmark-circle" size={14} color="#10b981" />
                    <Text style={styles.paidBadgeText}>Paid</Text>
                  </View>
                ) : (
                  <Text style={[styles.guestStatusText, {
                    color: item.status === 'approved' ? '#10b981' : '#ef4444',
                  }]}>
                    {item.status === 'approved' ? 'Approved' : 'Denied'}
                  </Text>
                )}
              </View>
            );
          }}
        />
      </View>
    );
  }

  // ─── Main scanner view ───────────────────────────────────────────────────

  const isShowingResult = (scanStep === 'membership' && showMembershipResult) || (scanStep === 'id' && idResult !== null);

  return (
    <View style={styles.container}>
      <DarkGradientBg />
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isActive && !isShowingResult}
        codeScanner={codeScanner}
        torch={torch ? 'on' : 'off'}
      />

      {/* Gradient overlays */}
      {!isShowingResult && (
        <>
          <LinearGradient
            colors={['rgba(0,0,0,0.8)', 'transparent']}
            style={styles.topGradient}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.9)']}
            style={styles.bottomGradient}
          />
        </>
      )}

      {/* Scan frame */}
      {!isShowingResult && (
        <View style={styles.scanFrameContainer}>
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
            <Animated.View style={[styles.scanLine, scanLineStyle]}>
              <LinearGradient
                colors={['transparent', '#10b981', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.scanLineGradient}
              />
            </Animated.View>
          </View>
        </View>
      )}

      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <TouchableOpacity style={styles.headerButton} onPress={() => {
          if (scanStep === 'id' && !idResult) {
            // Go back to membership step
            resetFlow();
          } else {
            router.back();
          }
        }}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {scanStep === 'membership' ? 'Scan Membership' : 'Scan ID'}
          </Text>
          {/* Step indicator */}
          <View style={styles.stepIndicator}>
            <View style={[styles.stepDot, scanStep === 'membership' && styles.stepDotActive]} />
            <View style={[styles.stepDot, scanStep === 'id' && styles.stepDotActive]} />
          </View>
        </View>
        <TouchableOpacity
          style={[styles.headerButton, torch && styles.headerButtonActive]}
          onPress={() => setTorch(!torch)}
        >
          <Ionicons
            name={torch ? 'flash' : 'flash-outline'}
            size={22}
            color={torch ? '#000' : '#fff'}
          />
        </TouchableOpacity>
      </Animated.View>

      {/* Instructions */}
      {!isShowingResult && (
        <Animated.View
          entering={FadeInUp.delay(200).duration(400)}
          style={styles.instructionsContainer}
        >
          <View style={styles.instructionsPill}>
            <Ionicons
              name={scanStep === 'membership' ? 'qr-code' : 'card'}
              size={16}
              color="rgba(255,255,255,0.8)"
            />
            <Text style={styles.instructionText}>
              {scanStep === 'membership'
                ? 'Position membership QR code in frame'
                : 'Position barcode on back of ID'}
            </Text>
          </View>
        </Animated.View>
      )}

      {/* ─── Step 1 Result: Membership Card ─────────────────────────────── */}
      {scanStep === 'membership' && showMembershipResult && membershipData && (
        <Animated.View
          entering={FadeInUp.duration(300)}
          exiting={FadeOutDown.duration(200)}
          style={styles.resultOverlay}
        >
          <BlurView intensity={60} tint="dark" style={styles.membershipResultBlur}>
            <View style={[styles.membershipResultCard, { paddingBottom: insets.bottom + 28 }]}>
              {/* Member icon */}
              <View style={styles.memberIcon}>
                <Ionicons name="person-circle" size={56} color="#fff" />
              </View>

              {/* Member name */}
              <Text style={styles.memberName}>
                {membershipData.memberName || 'Member'}
              </Text>

              {/* Member info */}
              <View style={styles.memberInfoRow}>
                {membershipData.memberId && (
                  <View style={styles.memberBadge}>
                    <Text style={styles.memberBadgeText}>ID: {membershipData.memberId}</Text>
                  </View>
                )}
                {membershipData.cardId && (
                  <View style={styles.memberBadge}>
                    <Text style={styles.memberBadgeText}>Card: {membershipData.cardId}</Text>
                  </View>
                )}
              </View>

              {/* Continue button */}
              <TouchableOpacity
                style={styles.continueButton}
                onPress={handleContinueToId}
                activeOpacity={0.8}
              >
                <Text style={styles.continueButtonText}>Continue to ID Scan</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </TouchableOpacity>

              {/* Scan another */}
              <TouchableOpacity
                style={styles.rescanLink}
                onPress={() => {
                  setShowMembershipResult(false);
                  setMembershipData(null);
                  setIsActive(true);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.rescanLinkText}>Scan Different Card</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </Animated.View>
      )}

      {/* ─── Step 2 Result: ID Card ─────────────────────────────────────── */}
      {scanStep === 'id' && idResult && (
        <Animated.View
          entering={FadeInUp.duration(300)}
          exiting={FadeOutDown.duration(200)}
          style={styles.resultOverlay}
        >
          <BlurView intensity={80} tint="light" style={styles.resultBlur}>
            <View style={[styles.resultCard, { paddingBottom: insets.bottom + 28 }]}>
              {/* Status indicator */}
              <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(idResult.status) }]}>
                <Ionicons name={getStatusIcon(idResult.status)} size={32} color="#fff" />
              </View>

              {/* Status badge */}
              {idResult.subtitle && (
                <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(idResult.status)}20` }]}>
                  <Text style={[styles.statusBadgeText, { color: getStatusColor(idResult.status) }]}>
                    {idResult.subtitle}
                  </Text>
                </View>
              )}

              {/* Ticket status badge */}
              {(() => {
                const badge = getTicketBadge(idResult.ticketStatus);
                if (!badge) return null;
                return (
                  <View style={[styles.ticketBadge, { backgroundColor: badge.bg }]}>
                    <Ionicons
                      name={idResult.ticketStatus === 'found' || idResult.ticketStatus === 'rsvp' ? 'ticket-outline' : 'alert-circle-outline'}
                      size={14}
                      color={badge.color}
                    />
                    <Text style={[styles.ticketBadgeText, { color: badge.color }]}>
                      {badge.label}
                    </Text>
                    {idResult.ticketInfo && idResult.ticketStatus === 'found' && (
                      <Text style={[styles.ticketBadgeDetail, { color: badge.color }]}>
                        {idResult.ticketInfo}
                      </Text>
                    )}
                  </View>
                );
              })()}

              {/* Validating indicator */}
              {isValidating && (
                <View style={styles.validatingRow}>
                  <ActivityIndicator size="small" color="rgba(0,0,0,0.4)" />
                  <Text style={styles.validatingText}>Verifying...</Text>
                </View>
              )}

              {/* Name */}
              <Text style={styles.resultName}>{idResult.title}</Text>

              {/* Fields */}
              {idResult.fields.length > 0 && (
                <View style={styles.fieldsGrid}>
                  {idResult.fields.map((field, index) => (
                    <View key={index} style={styles.fieldItem}>
                      <Text style={styles.fieldLabel}>{field.label}</Text>
                      <Text style={styles.fieldValue}>{field.value}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Actions */}
              <View style={styles.resultActions}>
                {idResult.status !== 'error' && idResult.title !== 'Could Not Read ID' && (
                  <TouchableOpacity
                    style={styles.approveButton}
                    onPress={handleApprove}
                    activeOpacity={0.8}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={20} color="#fff" />
                        <Text style={styles.approveButtonText}>Approve</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                {idResult.title !== 'Could Not Read ID' && (
                  <TouchableOpacity
                    style={styles.denyButton}
                    onPress={handleDeny}
                    activeOpacity={0.8}
                    disabled={isSubmitting}
                  >
                    <Ionicons name="close-circle" size={20} color="#ef4444" />
                    <Text style={styles.denyButtonText}>Deny</Text>
                  </TouchableOpacity>
                )}

                {idResult.title === 'Could Not Read ID' && (
                  <TouchableOpacity
                    style={styles.scanNextButton}
                    onPress={handleScanNext}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="scan-outline" size={20} color="#1a1a1a" />
                    <Text style={styles.scanNextButtonText}>Try Again</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </BlurView>
        </Animated.View>
      )}

      {/* ─── Bottom bar ─────────────────────────────────────────────────── */}
      {!isShowingResult && (
        <Animated.View
          entering={FadeInUp.delay(100).duration(400)}
          style={[styles.bottomBar, { bottom: insets.bottom + 16 }]}
        >
          {checkedInGuests.length > 0 && (
            <TouchableOpacity
              style={styles.checkedInCounter}
              onPress={() => { fetchGuestList(); setShowList(true); }}
              activeOpacity={0.8}
            >
              <View style={styles.checkedInDot} />
              <Text style={styles.checkedInText}>
                {checkedInGuests.filter(g => g.status === 'approved').length} approved
                {checkedInGuests.some(g => g.status === 'denied') ? ` · ${checkedInGuests.filter(g => g.status === 'denied').length} denied` : ''}
              </Text>
              <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          )}

          {/* Skip button (only on membership step) */}
          {scanStep === 'membership' && (
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkipMembership}
              activeOpacity={0.7}
            >
              <Text style={styles.skipButtonText}>No membership card? Skip</Text>
              <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          )}
        </Animated.View>
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 48 },
  loadingText: { marginTop: 16, fontSize: 15, fontFamily: 'Lato_400Regular', color: 'rgba(255,255,255,0.5)' },

  topGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: SCREEN_HEIGHT * 0.25 },
  bottomGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: SCREEN_HEIGHT * 0.35 },

  scanFrameContainer: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  scanFrame: { width: SCAN_FRAME_SIZE, height: SCAN_FRAME_SIZE, position: 'relative' },
  corner: { position: 'absolute', width: 32, height: 32, borderColor: '#10b981' },
  cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 16 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 16 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 16 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 16 },
  scanLine: { position: 'absolute', left: 16, right: 16, height: 2 },
  scanLineGradient: { flex: 1, borderRadius: 1 },

  header: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16 },
  headerButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  headerButtonActive: { backgroundColor: '#fbbf24' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontFamily: 'Lato_700Bold', color: '#fff', letterSpacing: 0.3 },

  // Step indicator dots
  stepIndicator: { flexDirection: 'row', gap: 6, marginTop: 6 },
  stepDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)' },
  stepDotActive: { backgroundColor: '#10b981', width: 18, borderRadius: 3 },

  instructionsContainer: { position: 'absolute', top: SCREEN_HEIGHT * 0.22, left: 0, right: 0, alignItems: 'center' },
  instructionsPill: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24 },
  instructionText: { fontSize: 14, fontFamily: 'Lato_400Regular', color: 'rgba(255,255,255,0.8)' },

  // ─── Membership result (dark glass) ────────────────────────────────────
  resultOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end' },

  membershipResultBlur: { borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden' },
  membershipResultCard: { padding: 28, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' },
  memberIcon: { marginBottom: 12, opacity: 0.9 },
  memberName: { fontSize: 24, fontFamily: 'Lato_700Bold', color: '#fff', textAlign: 'center', marginBottom: 12 },
  memberInfoRow: { flexDirection: 'row', gap: 8, marginBottom: 28 },
  memberBadge: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  memberBadgeText: { fontSize: 13, fontFamily: 'Lato_400Regular', color: 'rgba(255,255,255,0.7)' },

  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  continueButtonText: { fontSize: 16, fontFamily: 'Lato_700Bold', color: '#fff' },

  rescanLink: { marginTop: 16, padding: 8 },
  rescanLinkText: { fontSize: 14, fontFamily: 'Lato_400Regular', color: 'rgba(255,255,255,0.4)' },

  // ─── ID result (light glass) ───────────────────────────────────────────
  resultBlur: { borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden' },
  resultCard: { padding: 28, alignItems: 'center' },
  statusIndicator: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  statusBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, marginBottom: 8 },
  statusBadgeText: { fontSize: 13, fontFamily: 'Lato_700Bold', textTransform: 'uppercase', letterSpacing: 0.5 },

  // Ticket badge
  ticketBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
  },
  ticketBadgeText: { fontSize: 13, fontFamily: 'Lato_700Bold', letterSpacing: 0.3 },
  ticketBadgeDetail: { fontSize: 12, fontFamily: 'Lato_400Regular', opacity: 0.7 },

  // Validating
  validatingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  validatingText: { fontSize: 13, fontFamily: 'Lato_400Regular', color: 'rgba(0,0,0,0.4)' },

  resultName: { fontSize: 26, fontFamily: 'Lato_700Bold', color: '#1a1a1a', textAlign: 'center', marginBottom: 24 },
  fieldsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginBottom: 28, width: '100%' },
  fieldItem: { backgroundColor: 'rgba(0,0,0,0.04)', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, minWidth: 80, alignItems: 'center' },
  fieldLabel: { fontSize: 11, fontFamily: 'Lato_400Regular', color: 'rgba(0,0,0,0.4)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  fieldValue: { fontSize: 16, fontFamily: 'Lato_700Bold', color: '#1a1a1a' },
  resultActions: { flexDirection: 'row', gap: 10, width: '100%' },

  approveButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#10b981', paddingVertical: 16, borderRadius: 14, gap: 8 },
  approveButtonText: { fontSize: 16, fontFamily: 'Lato_700Bold', color: '#fff' },

  denyButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 16, borderRadius: 14, backgroundColor: 'rgba(239,68,68,0.1)', gap: 6 },
  denyButtonText: { fontSize: 16, fontFamily: 'Lato_700Bold', color: '#ef4444' },

  scanNextButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 16, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.06)', gap: 6 },
  scanNextButtonText: { fontSize: 16, fontFamily: 'Lato_700Bold', color: '#1a1a1a' },

  // ─── Bottom bar ────────────────────────────────────────────────────────
  bottomBar: { position: 'absolute', left: 24, right: 24, gap: 12 },

  checkedInCounter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(16,185,129,0.2)', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)' },
  checkedInDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981' },
  checkedInText: { fontSize: 14, fontFamily: 'Lato_700Bold', color: '#fff', flex: 1 },

  // Skip button (glass style)
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  skipButtonText: { fontSize: 14, fontFamily: 'Lato_400Regular', color: 'rgba(255,255,255,0.5)' },

  // ─── Guest list ────────────────────────────────────────────────────────
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16 },
  listCount: { fontSize: 13, fontFamily: 'Lato_400Regular', color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  guestRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)', gap: 12 },
  guestStatusDot: { width: 10, height: 10, borderRadius: 5 },
  guestName: { fontSize: 15, fontFamily: 'Lato_600SemiBold', color: '#fff' },
  guestMeta: { fontSize: 12, fontFamily: 'Lato_400Regular', color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  guestStatusText: { fontSize: 13, fontFamily: 'Lato_700Bold', textTransform: 'uppercase', letterSpacing: 0.5 },

  // Charge button (glass style)
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
  chargeButtonText: { fontSize: 13, fontFamily: 'Lato_700Bold', color: '#fff' },

  // Paid badge
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(16,185,129,0.15)',
  },
  paidBadgeText: { fontSize: 13, fontFamily: 'Lato_700Bold', color: '#10b981' },

  emptyList: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyListText: { fontSize: 15, fontFamily: 'Lato_400Regular', color: 'rgba(255,255,255,0.3)' },

  // ─── Permission screen ────────────────────────────────────────────────
  permissionIcon: { width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  permissionTitle: { fontSize: 24, fontFamily: 'Lato_700Bold', color: '#fff', marginBottom: 12 },
  permissionText: { fontSize: 15, fontFamily: 'Lato_400Regular', color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 22 },
  permissionButton: {
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 14,
    marginTop: 32,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  permissionButtonText: { fontSize: 16, fontFamily: 'Lato_700Bold', color: '#fff' },
  settingsLink: { marginTop: 16, padding: 12 },
  settingsLinkText: { fontSize: 14, fontFamily: 'Lato_400Regular', color: 'rgba(255,255,255,0.4)' },
});
