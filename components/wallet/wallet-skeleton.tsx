// Wallet Skeleton - Loading placeholder

import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function ShimmerBlock({ width, height, style }: { width: number | string; height: number; style?: any }) {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(withTiming(1, { duration: 1500 }), -1, false);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0.3, 0.6, 0.3]),
  }));

  return (
    <Animated.View
      style={[
        styles.shimmerBlock,
        { width, height },
        animatedStyle,
        style,
      ]}
    />
  );
}

export function WalletSkeleton() {
  return (
    <View style={styles.container}>
      {/* Card Skeleton */}
      <ShimmerBlock
        width={SCREEN_WIDTH - 32}
        height={(SCREEN_WIDTH - 32) * 0.6}
        style={styles.card}
      />

      {/* Wallet Buttons */}
      <View style={styles.buttonsRow}>
        <ShimmerBlock width="48%" height={44} style={styles.button} />
        <ShimmerBlock width="48%" height={44} style={styles.button} />
      </View>

      {/* Earnings Section */}
      <View style={styles.section}>
        <ShimmerBlock width={80} height={14} style={styles.sectionTitle} />
        <View style={styles.balanceRow}>
          <ShimmerBlock width="30%" height={80} style={styles.balanceCard} />
          <ShimmerBlock width="30%" height={80} style={styles.balanceCard} />
          <ShimmerBlock width="30%" height={80} style={styles.balanceCard} />
        </View>
        <View style={styles.actionsRow}>
          <ShimmerBlock width="48%" height={50} style={styles.button} />
          <ShimmerBlock width="48%" height={50} style={styles.button} />
        </View>
      </View>

      {/* Activity Section */}
      <View style={styles.section}>
        <ShimmerBlock width={120} height={14} style={styles.sectionTitle} />
        <View style={styles.filterRow}>
          <ShimmerBlock width={60} height={32} style={styles.filterButton} />
          <ShimmerBlock width={70} height={32} style={styles.filterButton} />
          <ShimmerBlock width={90} height={32} style={styles.filterButton} />
        </View>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.transactionRow}>
            <ShimmerBlock width={36} height={36} style={styles.txIcon} />
            <View style={styles.txContent}>
              <ShimmerBlock width={120} height={14} />
              <ShimmerBlock width={180} height={12} style={{ marginTop: 6 }} />
            </View>
            <ShimmerBlock width={60} height={16} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  shimmerBlock: {
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    borderRadius: 12,
  },
  card: {
    borderRadius: 16,
    marginBottom: 12,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  button: {
    borderRadius: 24,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    marginBottom: 16,
    borderRadius: 4,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  balanceCard: {
    borderRadius: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterButton: {
    borderRadius: 16,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  txIcon: {
    borderRadius: 18,
    marginRight: 12,
  },
  txContent: {
    flex: 1,
  },
});
