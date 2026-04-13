import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { GlassView } from 'expo-glass-effect';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { liquidGlass } from '@/constants/glass/liquid-glass';

interface FloatingCartBarProps {
  itemCount: number;
  totalCents: number;
  onCheckout: () => void;
  loading?: boolean;
  receiptMode?: boolean;
  paidAmountCents?: number;
  onNewOrder?: () => void;
}

export function FloatingCartBar({
  itemCount,
  totalCents,
  onCheckout,
  loading = false,
  receiptMode = false,
  paidAmountCents = 0,
  onNewOrder,
}: FloatingCartBarProps) {
  const insets = useSafeAreaInsets();

  if (!receiptMode && itemCount === 0) return null;

  return (
    <Animated.View
      entering={SlideInDown.duration(250)}
      exiting={SlideOutDown.duration(200)}
      style={[styles.container, { paddingBottom: insets.bottom + 12 }]}
    >
      <GlassView {...liquidGlass.surface} borderRadius={24} style={styles.bar}>
        {receiptMode ? (
          <View style={styles.content}>
            <View style={styles.receiptLeft}>
              <Ionicons name="checkmark-circle" size={22} color="#34c759" />
              <Text style={styles.receiptText}>
                Paid ${(paidAmountCents / 100).toFixed(2)}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onNewOrder?.();
              }}
              activeOpacity={0.7}
              style={styles.actionButton}
            >
              <GlassView
                {...liquidGlass.fillStrong}
                borderRadius={14}
                style={StyleSheet.absoluteFill}
                isInteractive
              />
              <Text style={styles.actionText}>New Order</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.content}>
            <View style={styles.cartInfo}>
              <Text style={styles.itemCount}>
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </Text>
              <Text style={styles.total}>
                ${(totalCents / 100).toFixed(2)}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onCheckout();
              }}
              activeOpacity={0.7}
              disabled={loading}
              style={[styles.actionButton, loading && styles.disabled]}
            >
              <GlassView
                {...liquidGlass.fillStrong}
                borderRadius={14}
                style={StyleSheet.absoluteFill}
                isInteractive
              />
              <Text style={styles.actionText}>
                {loading ? 'Processing...' : 'Checkout'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </GlassView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  bar: {
    padding: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cartInfo: {
    flex: 1,
  },
  itemCount: {
    color: 'rgba(0,0,0,0.6)',
    fontSize: 13,
    fontWeight: '500',
  },
  total: {
    color: '#1A1A1A',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 2,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    overflow: 'hidden',
  },
  actionText: {
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.5,
  },
  receiptLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  receiptText: {
    color: '#1A1A1A',
    fontSize: 18,
    fontWeight: '700',
  },
});
