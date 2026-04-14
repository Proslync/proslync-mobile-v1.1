import * as React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import { SegmentedControl } from '@/components/shared/segmented-control';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUnreadNotificationCount } from '@/hooks';
import type { FeedTab } from '@/lib/types/feed.types';

const TABS: FeedTab[] = ['foryou', 'following'];
const TAB_LABELS = ['For You', 'Following'];

interface FeedHeaderProps {
  activeTab: FeedTab;
  onTabChange: (tab: FeedTab) => void;
}

export function FeedHeader({
  activeTab,
  onTabChange,
}: FeedHeaderProps) {
  const insets = useSafeAreaInsets();
  // Feed always has dark overlay — white text regardless of theme
  const router = useRouter();
  const { data: unreadCount } = useUnreadNotificationCount();

  const selectedIndex = TABS.indexOf(activeTab);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.headerRow}>
        {/* Glass segmented control */}
        <View style={styles.segmentedControl}>
          <SegmentedControl
            segments={TAB_LABELS}
            selectedIndex={selectedIndex}
            onSelect={(index) => {
              if (index >= 0 && index < TABS.length) {
                onTabChange(TABS[index]);
              }
            }}
          />
        </View>

        {/* Search button */}
        <TouchableOpacity
          onPress={() => router.push('/search-screen')}
          activeOpacity={0.7}
          style={styles.iconTouchable}
        >
          <View style={styles.iconWrapper}>
            <GlassView
              {...liquidGlass.surface}
              borderRadius={20}
              style={styles.iconGlassBg}
            />
            <View style={styles.iconContent}>
              <Ionicons name="search-outline" size={20} color="#fff" />
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
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
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  iconTouchable: {
    // Wraps the icon for touch handling
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  iconGlassBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
  },
  iconContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentedControl: {
    flex: 1,
  },
  unreadBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
});
