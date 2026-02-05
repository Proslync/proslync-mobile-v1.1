import * as React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Animated, {
  FadeInDown,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { FeedTab } from '@/lib/types/feed.types';

interface FeedHeaderProps {
  activeTab: FeedTab;
  onTabChange: (tab: FeedTab) => void;
}

export function FeedHeader({
  activeTab,
  onTabChange,
}: FeedHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <Animated.View
      entering={FadeInDown.duration(500)}
      style={[styles.container, { paddingTop: insets.top + 8 }]}
    >
      <View style={styles.content}>
        {/* Tab Dots */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={styles.tabButton}
            onPress={() => onTabChange('foryou')}
            activeOpacity={0.7}
          >
            <View style={[
              styles.tabDot,
              activeTab === 'foryou' && styles.tabDotActive
            ]} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabButton}
            onPress={() => onTabChange('following')}
            activeOpacity={0.7}
          >
            <View style={[
              styles.tabDot,
              activeTab === 'following' && styles.tabDotActive
            ]} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    position: 'relative',
  },
  tabButton: {
    padding: 8,
    alignItems: 'center',
  },
  tabDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  tabDotActive: {
    backgroundColor: '#fff',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
