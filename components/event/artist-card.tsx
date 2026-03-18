import * as React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/hooks/use-app-theme';
import { GlassSurface } from '@/components/glass';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import type { LineupArtist } from '@/lib/types/event-detail.types';

interface ArtistCardProps {
  artist: LineupArtist;
  isPlaying: boolean;
  onTogglePlay: () => void;
}

export function ArtistCard({ artist, isPlaying, onTogglePlay }: ArtistCardProps) {
  const { colors, isDark } = useAppTheme();
  const glassColor = isDark ? 'rgba(255,255,255,' : 'rgba(0,0,0,';

  return (
    <GlassSurface fill="subtle" border="subtle" cornerRadius="md" style={styles.card}>
      <View style={styles.header}>
        {artist.avatarUrl ? (
          <Image source={{ uri: artist.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: `${glassColor}0.1)` }]}>
            <Ionicons name="person" size={20} color={colors.textTertiary} />
          </View>
        )}
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.text }]}>{artist.name}</Text>
          <Text style={[styles.time, { color: colors.textSecondary }]}>
            {artist.startTime} - {artist.endTime}
          </Text>
        </View>
        {artist.audioPreviewUrl && (
          <TouchableOpacity
            onPress={onTogglePlay}
            activeOpacity={0.7}
            style={[styles.playButton, { overflow: 'hidden' }]}
          >
            <GlassView {...liquidGlass.fill} borderRadius={19} style={StyleSheet.absoluteFillObject} />
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={18}
              color={colors.text}
            />
          </TouchableOpacity>
        )}
      </View>
      {artist.bio && (
        <Text style={[styles.bio, { color: colors.textTertiary }]} numberOfLines={2}>
          {artist.bio}
        </Text>
      )}
      {isPlaying && (
        <View style={styles.progressRow}>
          <View style={[styles.progressTrack, { backgroundColor: `${glassColor}0.1)` }]}>
            <View style={[styles.progressFill, { backgroundColor: colors.text }]} />
          </View>
        </View>
      )}
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
  },
  time: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
  },
  playButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bio: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    lineHeight: 18,
  },
  progressRow: {
    paddingTop: 2,
  },
  progressTrack: {
    height: 3,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressFill: {
    width: '35%',
    height: '100%',
    borderRadius: 1.5,
  },
});
