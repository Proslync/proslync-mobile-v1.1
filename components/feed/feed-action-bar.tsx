import * as React from 'react';
import { View, TouchableOpacity, StyleSheet, Share, PlatformColor } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
let LiquidGlassView: React.ComponentType<any> = View;
let isLiquidGlassSupported = false;
try {
  const lg = require('@callstack/liquid-glass');
  LiquidGlassView = lg.LiquidGlassView;
  isLiquidGlassSupported = lg.isLiquidGlassSupported;
} catch {
  // Native module not available (simulator or Expo Go)
}
import { useAppTheme } from '@/hooks/use-app-theme';
import { useTabNavigation } from '@/lib/providers/tab-navigation-provider';

interface FeedActionBarProps {
  eventTitle?: string;
}

export function FeedActionBar({ eventTitle }: FeedActionBarProps) {
  const { isDark } = useAppTheme();
  const { tabBarTopOffset } = useTabNavigation();
  const router = useRouter();

  const ctaBottom = tabBarTopOffset + 10;

  const handleSearch = () => {
    router.push('/search-screen');
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: eventTitle ? `Check out ${eventTitle} on Status!` : 'Check out this event on Status!',
      });
    } catch {}
  };

  return (
    <View style={[styles.container, { bottom: ctaBottom }]} pointerEvents="box-none">
      <TouchableOpacity onPress={handleSearch} activeOpacity={0.7}>
        <LiquidGlassView
          style={[
            styles.circleButton,
            !isLiquidGlassSupported && { backgroundColor: 'rgba(255,255,255,0.1)' },
          ]}
          effect="regular"
          colorScheme={isDark ? 'dark' : 'light'}
        >
          <Ionicons name="search" size={20} color={PlatformColor('label') as any} />
        </LiquidGlassView>
      </TouchableOpacity>

      {/* Spacer for the RSVP button rendered per-item */}
      <View style={styles.spacer} />

      <TouchableOpacity onPress={handleShare} activeOpacity={0.7}>
        <LiquidGlassView
          style={[
            styles.circleButton,
            !isLiquidGlassSupported && { backgroundColor: 'rgba(255,255,255,0.1)' },
          ]}
          effect="regular"
          colorScheme={isDark ? 'dark' : 'light'}
        >
          <Ionicons name="share-outline" size={20} color={PlatformColor('label') as any} />
        </LiquidGlassView>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 10,
  },
  circleButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  spacer: {
    flex: 1,
  },
});
