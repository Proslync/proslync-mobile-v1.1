import * as React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
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
      <View style={styles.tabRow}>
        <TouchableOpacity
          onPress={() => onTabChange('foryou')}
          activeOpacity={0.7}
          style={styles.tab}
        >
          <Text style={[styles.tabText, activeTab === 'foryou' && styles.tabTextActive]}>
            For You
          </Text>
          {activeTab === 'foryou' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onTabChange('following')}
          activeOpacity={0.7}
          style={styles.tab}
        >
          <Text style={[styles.tabText, activeTab === 'following' && styles.tabTextActive]}>
            Following
          </Text>
          {activeTab === 'following' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
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
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  tab: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  tabText: {
    fontSize: 16,
    fontFamily: 'Lato_600SemiBold',
    color: 'rgba(0, 0, 0, 0.4)',
  },
  tabTextActive: {
    color: '#1a1a1a',
  },
  tabIndicator: {
    marginTop: 4,
    width: 28,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#1a1a1a',
  },
});
