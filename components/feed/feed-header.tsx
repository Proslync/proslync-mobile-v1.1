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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useMyTeamInvitations } from '@/hooks';
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
  const { data: invitations } = useMyTeamInvitations();
  const hasInvitations = (invitations?.length ?? 0) > 0;

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
        style={styles.bellButton}
        onPress={() => router.push('/notifications')}
        activeOpacity={0.7}
      >
        <Ionicons name="notifications-outline" size={22} color={colors.text} />
        {hasInvitations && <View style={styles.redDot} />}
      </TouchableOpacity>
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
  bellButton: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingTop: 4,
  },
  redDot: {
    position: 'absolute',
    top: '50%',
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
    marginTop: -8,
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
});
