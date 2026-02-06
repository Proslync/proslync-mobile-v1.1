// Share Location Sheet - Telegram-style location sharing controls
// Shows duration options and active sharing status

import { useLiveLocation } from '@/lib/providers/live-location-provider';
import {
  SHARE_DURATION_OPTIONS,
  ShareDurationSeconds,
} from '@/lib/types/live-location.types';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import * as React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

interface ShareLocationSheetProps {
  isVisible: boolean;
  onClose: () => void;
}

function formatRemainingTime(seconds: number): string {
  if (seconds <= 0) return '0:00';

  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function ShareLocationSheet({ isVisible, onClose }: ShareLocationSheetProps) {
  const bottomSheetRef = React.useRef<BottomSheet>(null);
  const {
    sharingState,
    remainingTime,
    connectionState,
    startSharing,
    stopSharing,
    hasLocationPermission,
    requestLocationPermission,
  } = useLiveLocation();

  const [isStarting, setIsStarting] = React.useState(false);

  // Handle sheet visibility
  React.useEffect(() => {
    if (isVisible) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isVisible]);

  const handleDurationSelect = async (duration: ShareDurationSeconds) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsStarting(true);

    try {
      // Check permission first
      if (!hasLocationPermission) {
        const granted = await requestLocationPermission();
        if (!granted) {
          setIsStarting(false);
          return;
        }
      }

      await startSharing(duration);
      // Don't close immediately - show the active state
    } catch (error) {
      console.error('[ShareLocationSheet] Failed to start sharing:', error);
    } finally {
      setIsStarting(false);
    }
  };

  const handleStopSharing = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await stopSharing();
    onClose();
  };

  const isConnected = connectionState === 'connected';
  const isConnecting = connectionState === 'connecting';

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={[sharingState.isSharing ? 400 : 400]}
      enablePanDownToClose
      onClose={onClose}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.sheetIndicator}
    >
      <BottomSheetView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons
              name={sharingState.isSharing ? 'location' : 'location-outline'}
              size={28}
              color={sharingState.isSharing ? '#34c759' : '#fff'}
            />
          </View>
          <Text style={styles.title}>
            {sharingState.isSharing ? 'Sharing Your Location' : 'Share Live Location'}
          </Text>
          <Text style={styles.subtitle}>
            {sharingState.isSharing
              ? 'Your friends can see where you are'
              : 'Let friends see where you are temporarily'}
          </Text>
        </View>

        {/* Connection status indicator */}
        {!isConnected && (
          <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.connectionStatus}>
            {isConnecting ? (
              <>
                <ActivityIndicator size="small" color="#f0a500" />
                <Text style={styles.connectionText}>Connecting...</Text>
              </>
            ) : (
              <>
                <Ionicons name="cloud-offline" size={16} color="#ff6b6b" />
                <Text style={[styles.connectionText, { color: '#ff6b6b' }]}>
                  Not connected
                </Text>
              </>
            )}
          </Animated.View>
        )}

        {/* Active sharing state */}
        {sharingState.isSharing ? (
          <Animated.View entering={FadeIn} style={styles.activeContainer}>
            {/* Timer */}
            <View style={styles.timerContainer}>
              <View style={styles.timerPulse} />
              <Text style={styles.timerText}>
                {remainingTime !== null ? formatRemainingTime(remainingTime) : '--:--'}
              </Text>
              <Text style={styles.timerLabel}>remaining</Text>
            </View>

            {/* Stop button */}
            <TouchableOpacity
              style={styles.stopButton}
              onPress={handleStopSharing}
              activeOpacity={0.8}
            >
              <Ionicons name="stop-circle" size={20} color="#fff" />
              <Text style={styles.stopButtonText}>Stop Sharing</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          /* Duration options */
          <Animated.View entering={FadeIn} style={styles.optionsContainer}>
            {SHARE_DURATION_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButton,
                  (!isConnected || isStarting) && styles.optionButtonDisabled,
                ]}
                onPress={() => handleDurationSelect(option.value)}
                disabled={!isConnected || isStarting}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="time-outline"
                  size={20}
                  color={isConnected ? '#8b5cf6' : 'rgba(255,255,255,0.3)'}
                />
                <Text
                  style={[
                    styles.optionText,
                    !isConnected && styles.optionTextDisabled,
                  ]}
                >
                  {option.label}
                </Text>
                {isStarting ? (
                  <ActivityIndicator size="small" color="#8b5cf6" />
                ) : (
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={isConnected ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)'}
                  />
                )}
              </TouchableOpacity>
            ))}

            {/* Permission note */}
            {!hasLocationPermission && (
              <Text style={styles.permissionNote}>
                Location permission required to share
              </Text>
            )}
          </Animated.View>
        )}
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  sheetIndicator: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    width: 40,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 12,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
  },
  connectionText: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: '#f0a500',
  },
  activeContainer: {
    alignItems: 'center',
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  timerPulse: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(52, 199, 89, 0.2)',
    top: -10,
  },
  timerText: {
    fontSize: 48,
    fontFamily: 'Lato_700Bold',
    color: '#34c759',
    letterSpacing: 2,
  },
  timerLabel: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ff3b30',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
  },
  stopButtonText: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  optionsContainer: {
    gap: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 10,
  },
  optionButtonDisabled: {
    opacity: 0.5,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
    color: '#fff',
  },
  optionTextDisabled: {
    color: 'rgba(255,255,255,0.4)',
  },
  permissionNote: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    marginTop: 8,
  },
});
