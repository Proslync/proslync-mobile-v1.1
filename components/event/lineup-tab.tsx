import * as React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import { useAppTheme } from '@/hooks/use-app-theme';
import { ArtistCard } from './artist-card';
import type { LineupArtist } from '@/lib/types/event-detail.types';

interface LineupTabProps {
  artists: LineupArtist[];
}

export function LineupTab({ artists }: LineupTabProps) {
  const { colors } = useAppTheme();
  const [playingId, setPlayingId] = React.useState<string | null>(null);
  const soundRef = React.useRef<Audio.Sound | null>(null);

  const stopSound = React.useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    setPlayingId(null);
  }, []);

  const togglePlay = React.useCallback(async (artist: LineupArtist) => {
    if (playingId === artist.id) {
      await stopSound();
      return;
    }

    await stopSound();

    if (!artist.audioPreviewUrl) return;

    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: artist.audioPreviewUrl },
        { shouldPlay: true }
      );
      soundRef.current = sound;
      setPlayingId(artist.id);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          stopSound();
        }
      });
    } catch {
      // Audio playback failed silently
    }
  }, [playingId, stopSound]);

  React.useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  if (artists.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
          Lineup coming soon
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>Artist Lineup</Text>
      {artists.map((artist) => (
        <ArtistCard
          key={artist.id}
          artist={artist}
          isPlaying={playingId === artist.id}
          onTogglePlay={() => togglePlay(artist)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    paddingTop: 8,
  },
  title: {
    fontSize: 17,
    fontFamily: 'Lato_700Bold',
  },
  empty: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
  },
});
