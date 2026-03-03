import * as React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useUnreadNotificationCount } from '@/hooks';
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
  const { colors } = useAppTheme();
  const router = useRouter();
  const { data: unreadCount } = useUnreadNotificationCount();

  return (
    <Animated.View
      entering={FadeInDown.duration(500)}
      style={[styles.container, { paddingTop: insets.top + 8 }]}
    >
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.push('/search-screen')}
          activeOpacity={0.7}
        >
          <Ionicons name="search-outline" size={22} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.tabRow}>
          <TouchableOpacity
            onPress={() => onTabChange('foryou')}
            activeOpacity={0.7}
            style={styles.tab}
          >
            <Text style={[styles.tabText, { color: colors.textTertiary }, activeTab === 'foryou' && { color: colors.text }]}>
              For You
            </Text>
            {activeTab === 'foryou' && <View style={[styles.tabIndicator, { backgroundColor: colors.text }]} />}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onTabChange('following')}
            activeOpacity={0.7}
            style={styles.tab}
          >
            <Text style={[styles.tabText, { color: colors.textTertiary }, activeTab === 'following' && { color: colors.text }]}>
              Following
            </Text>
            {activeTab === 'following' && <View style={[styles.tabIndicator, { backgroundColor: colors.text }]} />}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.push('/notifications')}
          activeOpacity={0.7}
        >
          <Ionicons name="notifications-outline" size={22} color={colors.text} />
          {!!unreadCount && unreadCount > 0 && (
            <View style={styles.unreadBadge} />
          )}
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  tabIndicator: {
    marginTop: 4,
    width: 28,
    height: 3,
    borderRadius: 1.5,
  },
  unreadBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
});
