import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { GlassView, GlassContainer } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const TAB_BAR_HEIGHT = 49;
const RADIUS = 24;
const SPRING_CONFIG = { damping: 20, stiffness: 300, mass: 0.8 };

const TIP_PRESETS = [15, 18, 20, 25];

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

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
  const scale = useSharedValue(0.85);
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
      scale.value = withTiming(0.85, { duration: 150 });
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
      backgroundStyle={{ backgroundColor: 'transparent', borderRadius: RADIUS }}
      handleIndicatorStyle={{
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.3)',
      }}
      style={{ marginHorizontal: 12 }}
      bottomInset={TAB_BAR_HEIGHT + insets.bottom + 12}
      detached
    >
      <BottomSheetView style={styles.sheetContent}>
        <Animated.View style={animatedStyle}>
          <GlassContainer spacing={8} style={styles.glassContainer}>
            {/* Header + presets */}
            <GlassView {...liquidGlass.surface} borderRadius={RADIUS} style={styles.headerGlass}>
              <Text style={styles.title}>Add Tip</Text>
              <Text style={styles.subtotal}>Subtotal: {formatCents(subtotalCents)}</Text>

              <View style={styles.presetsRow}>
                {TIP_PRESETS.map((pct) => {
                  const isActive = selectedPercent === pct;
                  return (
                    <TouchableOpacity
                      key={pct}
                      style={[styles.presetButton, { overflow: 'hidden' }]}
                      onPress={() => setSelectedPercent(isActive ? null : pct)}
                      activeOpacity={0.7}
                    >
                      <GlassView
                        {...(isActive ? liquidGlass.fillStrong : liquidGlass.fill)}
                        borderRadius={12}
                        style={StyleSheet.absoluteFill}
                      />
                      <Text style={[styles.presetPercent, isActive && styles.presetActive]}>
                        {pct}%
                      </Text>
                      <Text style={[styles.presetAmount, isActive && styles.presetActive]}>
                        {formatCents(Math.round(subtotalCents * (pct / 100)))}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={[styles.noTipButton, { overflow: 'hidden' }]}
                onPress={() => {
                  setSelectedPercent(null);
                  setCustomTipCents(0);
                }}
                activeOpacity={0.7}
              >
                <GlassView {...liquidGlass.fill} borderRadius={12} style={StyleSheet.absoluteFill} />
                <Text style={styles.noTipText}>No Tip</Text>
              </TouchableOpacity>
            </GlassView>

            {/* Total + charge button */}
            <GlassView {...liquidGlass.surface} borderRadius={RADIUS} style={styles.footerGlass}>
              <View style={styles.totalRow}>
                {tipCents > 0 && <Text style={styles.tipLabel}>Tip: {formatCents(tipCents)}</Text>}
                <Text style={styles.totalLabel}>Total: {formatCents(totalCents)}</Text>
              </View>

              <TouchableOpacity
                style={[styles.chargeButton, { overflow: 'hidden' }, loading && styles.disabled]}
                onPress={handleConfirm}
                activeOpacity={0.7}
                disabled={loading}
              >
                <GlassView {...liquidGlass.fillMedium} borderRadius={14} style={StyleSheet.absoluteFill} />
                <Text style={styles.chargeText}>
                  {loading ? 'Processing...' : `Charge ${formatCents(totalCents)}`}
                </Text>
              </TouchableOpacity>
            </GlassView>
          </GlassContainer>
        </Animated.View>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetContent: {
    paddingHorizontal: 4,
    paddingBottom: 8,
  },
  glassContainer: {
    gap: 8,
  },
  headerGlass: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    fontSize: 17,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
    textAlign: 'center',
    paddingTop: 4,
  },
  subtotal: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  presetPercent: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    color: 'rgba(255,255,255,0.7)',
  },
  presetAmount: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2,
  },
  presetActive: {
    color: '#fff',
  },
  noTipButton: {
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 8,
  },
  noTipText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.5)',
  },
  footerGlass: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  totalRow: {
    alignItems: 'center',
    marginBottom: 12,
    gap: 4,
  },
  tipLabel: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.5)',
  },
  totalLabel: {
    fontSize: 20,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  chargeButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
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
