import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Linking,
  Image,
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
} from 'react-native-reanimated';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass, glassTint } from '@/constants/glass/liquid-glass';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { useAppTheme } from '@/hooks/use-app-theme';
import { eventsApi } from '@/lib/api/events';
import { venueContactTagsApi } from '@/lib/api/venue-contact-tags';
import { MembershipResultSheet } from '@/components/scanner/membership-result-sheet';
import { IdResultSheet } from '@/components/scanner/id-result-sheet';
import { authApi } from '@/lib/api/auth';
import type { EventAttendee } from '@/lib/types/events.types';
import { EventUserStatus } from '@/lib/types/events.types';
import type { PublicUserProfile } from '@/lib/types/auth.types';
import NfcManager, { NfcTech, Ndef } from 'react-native-nfc-manager';


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
  userName?: string;
  avatarUrl?: string;
  time: string;
  status: 'approved' | 'denied';
  age?: number;
  backendStatus?: string;
  paid?: boolean;
  guestIdNum?: number; // numeric backend guest ID for payment collection
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SCAN_FRAME_SIZE = SCREEN_WIDTH - 80;


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



export default function ScannerScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { eventId: eventIdParam } = useLocalSearchParams<{ eventId?: string }>();
  const eventId = eventIdParam ? parseInt(eventIdParam, 10) : undefined;

  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');

  // Flow state
  const [scanStep, setScanStep] = React.useState<ScanStep>('membership');
  const [membershipData, setMembershipData] = React.useState<MembershipData | null>(null);
  const [skippedMembership, setSkippedMembership] = React.useState(false);
  const [showMembershipResult, setShowMembershipResult] = React.useState(false);
  const [memberProfile, setMemberProfile] = React.useState<PublicUserProfile | null>(null);
  const [memberProfileLoading, setMemberProfileLoading] = React.useState(false);
  const [memberVenueTags, setMemberVenueTags] = React.useState<string[]>([]);

  // NFC state
  const [nfcSupported, setNfcSupported] = React.useState(false);
  const [nfcScanning, setNfcScanning] = React.useState(false);

  // ID scan state
  const [idResult, setIdResult] = React.useState<IdScanResult | null>(null);
  const [isValidating, setIsValidating] = React.useState(false);

  // Camera & actions
  const [torch, setTorch] = React.useState(false);
  const [isActive, setIsActive] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Guest list
  const [checkedInGuests, setCheckedInGuests] = React.useState<CheckedInGuest[]>([]);
  const [listStats, setListStats] = React.useState<{ total: number; verified: number; pending: number }>({ total: 0, verified: 0, pending: 0 });


  const mapAttendeeToGuest = React.useCallback((a: EventAttendee): CheckedInGuest => {
    const name = [a.firstName, a.lastName].filter(Boolean).join(' ') || a.guestName || 'Unknown';
    const isApproved = a.checkedIn ||
      a.status === EventUserStatus.VERIFIED ||
      a.status === EventUserStatus.CHECKED_IN ||
      a.status === EventUserStatus.SIGNED_UP;
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
      userName: a.userName,
      avatarUrl: a.avatarUrl || a.avatar,
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
        limit: 5000,
        status: [
          EventUserStatus.VERIFIED,
          EventUserStatus.REJECTED,
          EventUserStatus.CHECKED_IN,
          EventUserStatus.SIGNED_UP,
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

  React.useEffect(() => {
    NfcManager.isSupported().then(setNfcSupported).catch(() => {});
    return () => {
      NfcManager.cancelTechnologyRequest().catch(() => {});
    };
  }, []);



  const handleMembershipScan = React.useCallback(async (data: string) => {
    let parsed: any = null;
    try {
      parsed = JSON.parse(data);
    } catch {}

    const memberName = parsed?.userName || parsed?.name || parsed?.memberName || undefined;
    const memberId = parsed?.userId || parsed?.memberId || undefined;
    const cardId = parsed?.cardId || parsed?.id || data.substring(0, 20);

    setMembershipData({
      rawPayload: data,
      memberName,
      memberId: memberId ? String(memberId) : undefined,
      cardId,
    });
    setShowMembershipResult(true);
    setMemberProfile(null);
    setMemberVenueTags([]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Fetch the member's full profile + venue tags
    if (memberId) {
      setMemberProfileLoading(true);
      try {
        const profile = await authApi.getUserById(Number(memberId));
        setMemberProfile(profile);
      } catch {
        // Silently fail — will show basic info from QR payload
      } finally {
        setMemberProfileLoading(false);
      }

      // Fetch venue tags if we know the event's venue
      if (eventId) {
        try {
          const event = await eventsApi.getEvent(eventId);
          if (event?.venueId) {
            const tagData = await venueContactTagsApi.getTagsForUser(event.venueId, Number(memberId));
            setMemberVenueTags(tagData.tags);
          }
        } catch {
          // Silently fail
        }
      }
    }
  }, [eventId]);


  const startNfcScan = React.useCallback(async () => {
    if (nfcScanning) return;
    setNfcScanning(true);
    try {
      await NfcManager.requestTechnology(NfcTech.Ndef);
      const tag = await NfcManager.getTag();
      if (tag?.ndefMessage?.[0]) {
        const payload = Ndef.text.decodePayload(
          new Uint8Array(tag.ndefMessage[0].payload)
        );
        if (payload) {
          handleMembershipScan(payload);
        }
      }
    } catch {
      // NFC cancelled or failed — ignore
    } finally {
      NfcManager.cancelTechnologyRequest().catch(() => {});
      setNfcScanning(false);
    }
  }, [nfcScanning, handleMembershipScan]);

  const handleContinueToId = () => {
    NfcManager.cancelTechnologyRequest().catch(() => {});
    setShowMembershipResult(false);
    setScanStep('id');
    setIsActive(true);
  };

  const handleSkipMembership = () => {
    NfcManager.cancelTechnologyRequest().catch(() => {});
    setSkippedMembership(true);
    setMembershipData(null);
    setMemberProfile(null);
    setShowMembershipResult(false);
    setScanStep('id');
    setIsActive(true);
    Haptics.selectionAsync();
  };


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
      }
    } catch {
      // Guest may already be verified — continue to check-ins
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsSubmitting(false);

    // Navigate to Check Ins screen after approval
    if (eventId) {
      router.replace(`/manage-event/${eventId}/check-ins`);
    } else {
      addToListOptimistic(idResult, 'approved');
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


  React.useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  if (!hasPermission) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <DarkGradientBg />
        <View style={[styles.permissionIcon, { backgroundColor: undefined, overflow: 'hidden' as const }]}>
          <GlassView {...liquidGlass.fill} borderRadius={48} style={StyleSheet.absoluteFillObject} />
          <Ionicons name="camera" size={48} color="#fff" />
        </View>
        <Text style={styles.permissionTitle}>Camera Access</Text>
        <Text style={styles.permissionText}>
          We need camera access to scan IDs and membership cards
        </Text>
        <TouchableOpacity style={[styles.permissionButton, { backgroundColor: undefined, overflow: 'hidden' as const }]} onPress={requestPermission}>
          <GlassView {...liquidGlass.fill} borderRadius={14} style={StyleSheet.absoluteFillObject} />
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
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <DarkGradientBg />
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Initializing camera...</Text>
      </View>
    );
  }


  const isShowingResult = (scanStep === 'membership' && showMembershipResult) || (scanStep === 'id' && idResult !== null);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
          </View>
        </View>
      )}

      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <TouchableOpacity style={[styles.headerButton, { backgroundColor: undefined, overflow: 'hidden' as const }]} onPress={() => {
          if (scanStep === 'id' && !idResult) {
            // Go back to membership step
            resetFlow();
          } else {
            router.back();
          }
        }}>
          <GlassView {...liquidGlass.fill} borderRadius={22} style={StyleSheet.absoluteFillObject} />
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
          style={[styles.headerButton, { backgroundColor: undefined, overflow: 'hidden' as const }]}
          onPress={() => setTorch(!torch)}
        >
          <GlassView {...(torch ? liquidGlass.fillStrong : liquidGlass.fill)} borderRadius={22} style={StyleSheet.absoluteFillObject} />
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
          {/* NFC tap button for membership step */}
          {scanStep === 'membership' && nfcSupported && (
            <TouchableOpacity
              style={[styles.nfcButton, { backgroundColor: undefined, overflow: 'hidden' as const }]}
              onPress={startNfcScan}
              activeOpacity={0.7}
              disabled={nfcScanning}
            >
              <GlassView {...liquidGlass.fill} borderRadius={24} style={StyleSheet.absoluteFillObject} />
              <Ionicons
                name="phone-portrait-outline"
                size={18}
                color="#fff"
              />
              <Text style={styles.nfcButtonText}>
                {nfcScanning ? 'Hold phone near card...' : 'Tap Membership Card'}
              </Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      )}

      {/* ─── Step 1 Result: Membership Card ─────────────────────────────── */}
      <MembershipResultSheet
        isPresented={scanStep === 'membership' && showMembershipResult && !!membershipData}
        membershipData={membershipData}
        memberProfile={memberProfile}
        memberProfileLoading={memberProfileLoading}
        venueTags={memberVenueTags}
        onContinueToId={handleContinueToId}
        onScanDifferent={() => {
          setShowMembershipResult(false);
          setMembershipData(null);
          setMemberProfile(null);
          setMemberVenueTags([]);
          setIsActive(true);
        }}
        onDismiss={() => {
          setShowMembershipResult(false);
          setMembershipData(null);
          setMemberProfile(null);
          setMemberVenueTags([]);
          setIsActive(true);
        }}
      />

      {/* ─── Step 2 Result: ID Card ─────────────────────────────────────── */}
      <IdResultSheet
        isPresented={scanStep === 'id' && !!idResult}
        idResult={idResult}
        isValidating={isValidating}
        isSubmitting={isSubmitting}
        venueTags={memberVenueTags}
        onApprove={handleApprove}
        onDeny={handleDeny}
        onScanNext={handleScanNext}
        onDismiss={handleScanNext}
      />

      {/* ─── Bottom bar ─────────────────────────────────────────────────── */}
      {!isShowingResult && (
        <Animated.View
          entering={FadeInUp.delay(100).duration(400)}
          style={[styles.bottomBar, { bottom: insets.bottom + 16 }]}
        >
          {checkedInGuests.length > 0 && (
            <TouchableOpacity
              style={styles.checkedInCounter}
              onPress={() => {
                if (eventId) {
                  router.push(`/manage-event/${eventId}/check-ins`);
                }
              }}
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
              style={[styles.skipButton, { backgroundColor: undefined, overflow: 'hidden' as const }]}
              onPress={handleSkipMembership}
              activeOpacity={0.7}
            >
              <GlassView {...liquidGlass.fillFaint} borderRadius={14} style={StyleSheet.absoluteFillObject} />
              <Text style={styles.skipButtonText}>No membership card? Skip</Text>
              <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          )}
        </Animated.View>
      )}
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1 },
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

  header: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16 },
  headerButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontFamily: 'Lato_700Bold', color: '#fff', letterSpacing: 0.3 },

  // Step indicator dots
  stepIndicator: { flexDirection: 'row', gap: 6, marginTop: 6 },
  stepDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)' },
  stepDotActive: { backgroundColor: '#10b981', width: 18, borderRadius: 3 },

  instructionsContainer: { position: 'absolute', top: SCREEN_HEIGHT * 0.22, left: 0, right: 0, alignItems: 'center' },
  instructionsPill: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24 },
  instructionText: { fontSize: 14, fontFamily: 'Lato_400Regular', color: 'rgba(255,255,255,0.8)' },
  nfcButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  nfcButtonText: { fontSize: 14, fontFamily: 'Lato_600SemiBold', color: '#fff' },

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

  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16 },
  listCount: { fontSize: 13, fontFamily: 'Lato_400Regular', color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  guestRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)', gap: 12 },
  guestStatusDot: { width: 10, height: 10, borderRadius: 5 },
  guestAvatar: { width: 36, height: 36, borderRadius: 18 },
  guestAvatarPlaceholder: { width: 36, height: 36, borderRadius: 18, alignItems: 'center' as const, justifyContent: 'center' as const },
  guestAvatarInitials: { fontSize: 13, fontFamily: 'Lato_700Bold', color: 'rgba(255,255,255,0.6)' },
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

