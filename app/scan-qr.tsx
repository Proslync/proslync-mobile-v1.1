import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Linking,
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
import { useRouter } from 'expo-router';
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
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';

type ScanMode = 'id' | 'membership';

interface ScanResult {
  type: 'id' | 'membership' | 'error';
  title: string;
  subtitle?: string;
  status: 'success' | 'warning' | 'error';
  fields: { label: string; value: string }[];
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SCAN_FRAME_SIZE = SCREEN_WIDTH - 80;

// Parse AAMVA PDF417 Driver's License format
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

export default function ScannerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');

  const [scanMode, setScanMode] = React.useState<ScanMode>('id');
  const [torch, setTorch] = React.useState(false);
  const [scanResult, setScanResult] = React.useState<ScanResult | null>(null);
  const [isActive, setIsActive] = React.useState(true);

  // Scan line animation - smooth up and down
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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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

  const handleIdScan = React.useCallback((data: string) => {
    const licenseData = parseDriverLicense(data);
    if (!licenseData) {
      setScanResult({
        type: 'error',
        title: 'Could Not Read ID',
        subtitle: 'Please try again',
        status: 'error',
        fields: [],
      });
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

    setScanResult({
      type: 'id',
      title: `${licenseData.firstName} ${licenseData.lastName}`,
      subtitle,
      status,
      fields: [
        { label: 'Age', value: String(age) },
        { label: 'DOB', value: formatDate(licenseData.birthDate) },
        { label: 'Expires', value: formatDate(licenseData.expirationDate) },
        ...(licenseData.documentNumber ? [{ label: 'ID #', value: licenseData.documentNumber }] : []),
      ],
    });
  }, []);

  const handleMembershipScan = React.useCallback((data: string) => {
    let parsed: any = null;
    try {
      parsed = JSON.parse(data);
    } catch {
      // Not JSON, use raw data
    }

    const cardId = parsed?.cardId || parsed?.id || data.substring(0, 20);
    const memberName = parsed?.name || parsed?.memberName;
    const memberId = parsed?.memberId || parsed?.userId;

    setScanResult({
      type: 'membership',
      title: memberName || 'Membership Card',
      subtitle: 'Verified',
      status: 'success',
      fields: [
        ...(memberId ? [{ label: 'Member ID', value: String(memberId) }] : []),
        { label: 'Card', value: cardId },
      ],
    });
  }, []);

  const codeScanner = useCodeScanner({
    codeTypes: scanMode === 'id' ? ['pdf-417'] : ['qr'],
    onCodeScanned: (codes: Code[]) => {
      if (scanResult || codes.length === 0) return;

      const code = codes[0];
      if (!code.value) return;

      setIsActive(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      if (scanMode === 'id') {
        handleIdScan(code.value);
      } else {
        handleMembershipScan(code.value);
      }
    },
  });

  const handleScanNext = () => {
    setScanResult(null);
    setIsActive(true);
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

  React.useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  if (!hasPermission) {
    return (
      <View style={[styles.container, styles.centered]}>
        <View style={styles.permissionIcon}>
          <Ionicons name="camera" size={48} color="#1a1a1a" />
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
        <ActivityIndicator size="large" color="#1a1a1a" />
        <Text style={styles.loadingText}>Initializing camera...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <DarkGradientBg />
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isActive && !scanResult}
        codeScanner={codeScanner}
        torch={torch ? 'on' : 'off'}
      />

      {/* Gradient overlays for smooth darkening */}
      {!scanResult && (
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
      {!scanResult && (
        <View style={styles.scanFrameContainer}>
          <View style={styles.scanFrame}>
            {/* Corner accents */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />

            {/* Animated scan line */}
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
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {scanMode === 'id' ? 'Scan ID' : 'Scan Card'}
          </Text>
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
      {!scanResult && (
        <Animated.View
          entering={FadeInUp.delay(200).duration(400)}
          style={styles.instructionsContainer}
        >
          <View style={styles.instructionsPill}>
            <Ionicons
              name={scanMode === 'id' ? 'card' : 'qr-code'}
              size={16}
              color="rgba(255,255,255,0.8)"
            />
            <Text style={styles.instructionText}>
              {scanMode === 'id'
                ? 'Position barcode on back of ID'
                : 'Position QR code in frame'}
            </Text>
          </View>
        </Animated.View>
      )}

      {/* Scan Result */}
      {scanResult && (
        <Animated.View
          entering={FadeInUp.duration(300)}
          exiting={FadeOutDown.duration(200)}
          style={[styles.resultOverlay, { paddingBottom: insets.bottom + 20 }]}
        >
          <BlurView intensity={80} tint="light" style={styles.resultBlur}>
            <View style={[styles.resultCard]}>
              {/* Status indicator */}
              <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(scanResult.status) }]}>
                <Ionicons name={getStatusIcon(scanResult.status)} size={32} color="#fff" />
              </View>

              {/* Status badge */}
              {scanResult.subtitle && (
                <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(scanResult.status)}20` }]}>
                  <Text style={[styles.statusBadgeText, { color: getStatusColor(scanResult.status) }]}>
                    {scanResult.subtitle}
                  </Text>
                </View>
              )}

              {/* Name */}
              <Text style={styles.resultName}>{scanResult.title}</Text>

              {/* Fields */}
              {scanResult.fields.length > 0 && (
                <View style={styles.fieldsGrid}>
                  {scanResult.fields.map((field, index) => (
                    <View key={index} style={styles.fieldItem}>
                      <Text style={styles.fieldLabel}>{field.label}</Text>
                      <Text style={styles.fieldValue}>{field.value}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Actions */}
              <View style={styles.resultActions}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleScanNext}
                  activeOpacity={0.8}
                >
                  <Ionicons name="scan-outline" size={20} color="#1a1a1a" />
                  <Text style={styles.primaryButtonText}>Scan Next</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => router.back()}
                  activeOpacity={0.8}
                >
                  <Text style={styles.secondaryButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        </Animated.View>
      )}

      {/* Mode selector */}
      {!scanResult && (
        <Animated.View
          entering={FadeInUp.delay(100).duration(400)}
          style={[styles.modeSelector, { bottom: insets.bottom + 32 }]}
        >
          <View style={styles.modeContainer}>
            {(['id', 'membership'] as ScanMode[]).map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[styles.modeButton, scanMode === mode && styles.modeButtonActive]}
                onPress={() => {
                  setScanMode(mode);
                  setScanResult(null);
                  setIsActive(true);
                  Haptics.selectionAsync();
                }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={mode === 'id' ? 'card' : 'person-circle'}
                  size={20}
                  color={scanMode === mode ? '#fff' : 'rgba(255,255,255,0.5)'}
                />
                <Text style={[styles.modeText, scanMode === mode && styles.modeTextActive]}>
                  {mode === 'id' ? 'ID Card' : 'Membership'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 48,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(0,0,0,0.5)',
  },

  // Gradients
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.25,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.35,
  },

  // Scan frame
  scanFrameContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: SCAN_FRAME_SIZE,
    height: SCAN_FRAME_SIZE,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: '#10b981',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 16,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 16,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 16,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 16,
  },
  scanLine: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 2,
  },
  scanLineGradient: {
    flex: 1,
    borderRadius: 1,
  },

  // Header
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 22,
  },
  headerButtonActive: {
    backgroundColor: '#fbbf24',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
    letterSpacing: 0.3,
  },

  // Instructions
  instructionsContainer: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.22,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructionsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
  },
  instructionText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.8)',
  },

  // Result
  resultOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  resultBlur: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
  },
  resultCard: {
    padding: 28,
    alignItems: 'center',
  },
  statusIndicator: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  statusBadgeText: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resultName: {
    fontSize: 26,
    fontFamily: 'Lato_700Bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 24,
  },
  fieldsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 28,
    width: '100%',
  },
  fieldItem: {
    backgroundColor: 'rgba(0,0,0,0.04)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 11,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(0,0,0,0.4)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    color: '#1a1a1a',
  },
  resultActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D3D3D3',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    color: '#1a1a1a',
  },
  secondaryButton: {
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    color: '#1a1a1a',
  },

  // Mode selector
  modeSelector: {
    position: 'absolute',
    left: 24,
    right: 24,
  },
  modeContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 16,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  modeButtonActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
  },
  modeText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.5)',
  },
  modeTextActive: {
    color: '#fff',
    fontFamily: 'Lato_700Bold',
  },

  // Permission screen
  permissionIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  permissionTitle: {
    fontSize: 24,
    fontFamily: 'Lato_700Bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  permissionText: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(0,0,0,0.5)',
    textAlign: 'center',
    lineHeight: 22,
  },
  permissionButton: {
    backgroundColor: '#D3D3D3',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 14,
    marginTop: 32,
  },
  permissionButtonText: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    color: '#1a1a1a',
  },
  settingsLink: {
    marginTop: 16,
    padding: 12,
  },
  settingsLinkText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(0,0,0,0.4)',
  },
});
