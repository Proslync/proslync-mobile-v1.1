import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const RADIUS = 20;
const SPRING_CONFIG = { damping: 20, stiffness: 300, mass: 0.8 };

const TIP_PRESETS = [15, 18, 20, 25];

function formatCents(cents: number): string {
  if (!Number.isFinite(cents)) return '$0.00';
  return `$${(cents / 100).toFixed(2)}`;
}

const renderBackdrop = (props: BottomSheetBackdropProps) => (
  <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.6} />
);

interface TipEntrySheetProps {
  visible: boolean;
  subtotalCents: number;
  onClose: () => void;
  onConfirm: (tipCents: number) => void;
  loading?: boolean;
}

export function TipEntrySheet({
  visible,
  subtotalCents,
  onClose,
  onConfirm,
  loading,
}: TipEntrySheetProps) {
  const bottomSheetRef = React.useRef<BottomSheet>(null);
  const insets = useSafeAreaInsets();
  const [selectedPercent, setSelectedPercent] = React.useState<number | null>(null);
  const [customTipCents, setCustomTipCents] = React.useState(0);
  const scale = useSharedValue(0.92);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      setSelectedPercent(null);
      setCustomTipCents(0);
      bottomSheetRef.current?.expand();
      scale.value = withSpring(1, SPRING_CONFIG);
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      bottomSheetRef.current?.close();
      scale.value = withTiming(0.92, { duration: 150 });
      opacity.value = withTiming(0, { duration: 150 });
    }
  }, [visible, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const tipCents = React.useMemo(() => {
    if (selectedPercent !== null) {
      return Math.round(subtotalCents * (selectedPercent / 100));
    }
    return customTipCents;
  }, [selectedPercent, customTipCents, subtotalCents]);

  const totalCents = subtotalCents + tipCents;

  const handleConfirm = React.useCallback(() => {
    bottomSheetRef.current?.close();
    setTimeout(() => onConfirm(tipCents), 150);
  }, [tipCents, onConfirm]);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      enableDynamicSizing
      enablePanDownToClose
      onClose={onClose}
      backgroundStyle={{ backgroundColor: 'rgba(10,10,10,0.85)', borderRadius: RADIUS }}
      handleIndicatorStyle={{
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.3)',
      }}
      backdropComponent={renderBackdrop}
    >
      <BottomSheetView style={[styles.sheetContent, { paddingBottom: insets.bottom + 12 }]}>
        <Animated.View style={animatedStyle}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Add Tip</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtotal}>Subtotal: {formatCents(subtotalCents)}</Text>

          {/* Tip presets */}
          <View style={styles.presetsRow}>
            {TIP_PRESETS.map((pct) => {
              const isActive = selectedPercent === pct;
              return (
                <TouchableOpacity
                  key={pct}
                  style={[
                    styles.presetButton,
                    isActive && styles.presetButtonActive,
                  ]}
                  onPress={() => setSelectedPercent(isActive ? null : pct)}
                  activeOpacity={0.7}
                >
                  <GlassView
                    {...(isActive ? liquidGlass.fillStrong : liquidGlass.fill)}
                    borderRadius={12}
                    style={StyleSheet.absoluteFill}
                  />
                  <Text style={[styles.presetPercent, isActive && styles.presetActiveText]}>
                    {pct}%
                  </Text>
                  <Text style={[styles.presetAmount, isActive && styles.presetActiveText]}>
                    {formatCents(Math.round(subtotalCents * (pct / 100)))}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* No tip */}
          <TouchableOpacity
            style={styles.noTipButton}
            onPress={() => {
              setSelectedPercent(null);
              setCustomTipCents(0);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.noTipText}>No Tip</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Total summary */}
          <View style={styles.totalSection}>
            {tipCents > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalRowLabel}>Tip</Text>
                <Text style={styles.totalRowValue}>{formatCents(tipCents)}</Text>
              </View>
            )}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatCents(totalCents)}</Text>
            </View>
          </View>

          {/* Charge button */}
          <TouchableOpacity
            style={[styles.chargeButton, loading && styles.disabled]}
            onPress={handleConfirm}
            activeOpacity={0.7}
            disabled={loading}
          >
            <GlassView {...liquidGlass.fillStrong} borderRadius={14} style={StyleSheet.absoluteFill} isInteractive />
            <Ionicons name="flash" size={18} color="#fff" />
            <Text style={styles.chargeText}>
              {loading ? 'Processing...' : `Charge ${formatCents(totalCents)}`}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetContent: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  title: {
    fontSize: 17,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  subtotal: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
    marginBottom: 20,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  presetButtonActive: {
    borderColor: 'rgba(255,255,255,0.25)',
  },
  presetPercent: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    color: 'rgba(255,255,255,0.6)',
  },
  presetAmount: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.35)',
    marginTop: 2,
  },
  presetActiveText: {
    color: '#fff',
  },
  noTipButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  noTipText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.4)',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 16,
  },
  totalSection: {
    gap: 6,
    marginBottom: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalRowLabel: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.5)',
  },
  totalRowValue: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  totalLabel: {
    fontSize: 18,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  totalValue: {
    fontSize: 18,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  chargeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  chargeText: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  disabled: {
    opacity: 0.5,
  },
});
