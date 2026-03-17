import * as React from 'react';
import { View, TouchableOpacity, StyleSheet, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import { useTabNavigation } from '@/lib/providers/tab-navigation-provider';
import { useAppTheme } from '@/hooks/use-app-theme';

interface FeedActionBarProps {
  eventTitle?: string;
  eventId?: number;
}

export function FeedActionBar({ eventTitle, eventId }: FeedActionBarProps) {
  const { isDark } = useAppTheme();
  const { tabBarTopOffset } = useTabNavigation();
  const router = useRouter();

  const ctaBottom = tabBarTopOffset + 10;

  const handleSearch = () => {
    router.push('/search-screen');
  };

  const handleShare = async () => {
    try {
      const url = eventId ? `status://event/${eventId}` : undefined;
      await Share.share({
        message: eventTitle ? `Check out ${eventTitle} on Status!` : 'Check out this event on Status!',
        ...(url && { url }),
      });
    } catch {}
  };

  return (
    <View style={[styles.container, { bottom: ctaBottom }]} pointerEvents="box-none">
      <View style={styles.row}>
        <TouchableOpacity onPress={handleSearch} activeOpacity={0.7}>
          <View style={styles.circleButton}>
            <GlassView
              {...liquidGlass.surface}
              borderRadius={24}
              style={styles.glassBg}
            />
            <View style={styles.circleContent}>
              <Ionicons name="search" size={20} color="#fff" />
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.spacer} />

        <TouchableOpacity onPress={handleShare} activeOpacity={0.7}>
          <View style={styles.circleButton}>
            <GlassView
              {...liquidGlass.surface}
              borderRadius={24}
              style={styles.glassBg}
            />
            <View style={styles.circleContent}>
              <Ionicons name="share-outline" size={20} color="#fff" />
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
    left: 0,
    right: 0,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  circleButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  glassBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
  },
  circleContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spacer: {
    flex: 1,
  },
});
