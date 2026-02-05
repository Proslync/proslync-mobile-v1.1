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
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOutDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';

type ScanMode = 'id' | 'membership';

interface ScanResult {
  type: 'id' | 'membership' | 'error';
  title: string;
  subtitle?: string;
  status: 'success' | 'warning' | 'error';
  fields: { label: string; value: string }[];
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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

  // Scan line animation
  const scanLinePosition = useSharedValue(0);

  React.useEffect(() => {
    scanLinePosition.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500 }),
        withTiming(0, { duration: 1500 })
      ),
      -1,
      false
    );
  }, []);

  const scanLineStyle = useAnimatedStyle(() => ({
    top: `${scanLinePosition.value * 100}%`,
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
        subtitle: 'Try moving closer',
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
    // Try to parse as JSON
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
      subtitle: 'Scanned',
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
      case 'success': return '#22c55e';
      case 'warning': return '#f59e0b';
      case 'error': return '#ef4444';
      default: return '#fff';
    }
  };

  const getStatusIcon = (status: string): keyof typeof Ionicons.glyphMap => {
    switch (status) {
      case 'success': return 'checkmark-circle';
      case 'warning': return 'warning';
      case 'error': return 'close-circle';
      default: return 'checkmark-circle';
    }
  };

  // Request permission on mount
  React.useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  if (!hasPermission) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="camera-outline" size={64} color="rgba(255,255,255,0.5)" />
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>Allow camera access to scan IDs and membership cards.</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.permissionButton, { backgroundColor: 'rgba(255,255,255,0.1)', marginTop: 12 }]}
          onPress={() => Linking.openSettings()}
        >
          <Text style={styles.permissionButtonText}>Open Settings</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Loading camera...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isActive && !scanResult}
        codeScanner={codeScanner}
        torch={torch ? 'on' : 'off'}
      />

      {/* Scanning overlay */}
      {!scanResult && (
        <View style={styles.scanOverlay}>
          <View style={[styles.darkArea, { height: SCREEN_HEIGHT * 0.12 }]} />
          <View style={styles.middleRow}>
            <View style={[styles.darkArea, { width: 16 }]} />
            <View style={styles.scanArea}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
              <Animated.View style={[styles.scanLine, scanLineStyle]} />
            </View>
            <View style={[styles.darkArea, { width: 16 }]} />
          </View>
          <View style={[styles.darkArea, { flex: 1 }]} />
        </View>
      )}

      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {scanMode === 'id' ? 'Scan ID' : 'Scan Membership'}
        </Text>
        <TouchableOpacity style={styles.headerButton} onPress={() => setTorch(!torch)}>
          <Ionicons name={torch ? 'flash' : 'flash-outline'} size={24} color={torch ? '#fbbf24' : '#fff'} />
        </TouchableOpacity>
      </Animated.View>

      {/* Instructions */}
      {!scanResult && (
        <View style={[styles.instructions, { top: insets.top + 70 }]}>
          <Text style={styles.instructionText}>
            {scanMode === 'id'
              ? 'Scan barcode on back of ID'
              : 'Scan membership QR code'}
          </Text>
        </View>
      )}

      {/* Scan Result Card */}
      {scanResult && (
        <Animated.View
          entering={FadeInDown.duration(300).springify()}
          exiting={FadeOutDown.duration(200)}
          style={styles.resultContainer}
        >
          <View style={[styles.resultCard, { borderColor: getStatusColor(scanResult.status) }]}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(scanResult.status) }]}>
              <Ionicons name={getStatusIcon(scanResult.status)} size={24} color="#fff" />
              {scanResult.subtitle && (
                <Text style={styles.statusText}>{scanResult.subtitle}</Text>
              )}
            </View>

            <Text style={styles.resultTitle}>{scanResult.title}</Text>

            {scanResult.fields.length > 0 && (
              <View style={styles.fieldsContainer}>
                {scanResult.fields.map((field, index) => (
                  <View key={index} style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>{field.label}</Text>
                    <Text style={styles.fieldValue}>{field.value}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.resultActions}>
              <TouchableOpacity style={styles.scanNextButton} onPress={handleScanNext}>
                <Ionicons name="scan" size={20} color="#fff" />
                <Text style={styles.scanNextText}>Scan Next</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.doneButton} onPress={() => router.back()}>
                <Text style={styles.doneText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Bottom mode tabs */}
      {!scanResult && (
        <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.modeTabs}>
            {(['id', 'membership'] as ScanMode[]).map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[styles.modeTab, scanMode === mode && styles.modeTabActive]}
                onPress={() => {
                  setScanMode(mode);
                  setScanResult(null);
                  setIsActive(true);
                }}
              >
                <Ionicons
                  name={mode === 'id' ? 'card-outline' : 'person-outline'}
                  size={22}
                  color={scanMode === mode ? '#fff' : 'rgba(255,255,255,0.5)'}
                />
                <Text style={[styles.modeTabText, scanMode === mode && styles.modeTabTextActive]}>
                  {mode === 'id' ? 'ID' : 'Membership'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.7)',
  },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  darkArea: {
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  middleRow: {
    flexDirection: 'row',
    height: SCREEN_HEIGHT * 0.5,
  },
  scanArea: {
    flex: 1,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#22c55e',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 8,
  },
  scanLine: {
    position: 'absolute',
    left: 8,
    right: 8,
    height: 2,
    backgroundColor: '#22c55e',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 22,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  instructions: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  resultContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingHorizontal: 24,
  },
  resultCard: {
    width: '100%',
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 24,
    borderWidth: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  resultTitle: {
    fontSize: 28,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
    marginBottom: 20,
  },
  fieldsContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.6)',
  },
  fieldValue: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  resultActions: {
    flexDirection: 'row',
    gap: 12,
  },
  scanNextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22c55e',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  scanNextText: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  doneButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  doneText: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 14,
    padding: 4,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  modeTabActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.4)',
  },
  modeTabText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.5)',
  },
  modeTabTextActive: {
    color: '#fff',
    fontFamily: 'Lato_700Bold',
  },
  permissionTitle: {
    fontSize: 20,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
    marginTop: 24,
    marginBottom: 12,
  },
  permissionText: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: '#22c55e',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 32,
  },
  permissionButtonText: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
});
