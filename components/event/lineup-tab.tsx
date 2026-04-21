import * as React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useAppTheme } from '@/hooks/use-app-theme';
import { ArtistCard } from './artist-card';
import type { LineupArtist } from '@/lib/types/event-detail.types';

interface LineupTabProps {
  artists: LineupArtist[];
}

export function LineupTab({ artists }: LineupTabProps) {
  const { colors } = useAppTheme();
  const [playingId, setPlayingId] = React.useState<string | null>(null);

  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);

  // When playback finishes (reached end of track), clear playingId
  const prevPlayingRef = React.useRef(false);
  React.useEffect(() => {
    if (prevPlayingRef.current && !status.playing && playingId) {
      // Was playing, now stopped — track finished or was paused
      // Check if we're near the end (duration > 0 and currentTime >= duration)
      if (status.duration > 0 && status.currentTime >= status.duration - 0.1) {
        setPlayingId(null);
      }
    }
    prevPlayingRef.current = status.playing;
  }, [status.playing, status.currentTime, status.duration, playingId]);

  const togglePlay = React.useCallback(
    (artist: LineupArtist) => {
      // Tapped the currently playing artist — pause it
      if (playingId === artist.id) {
        player.pause();
        setPlayingId(null);
        return;
      }

      if (!artist.audioPreviewUrl) return;

      // Replace source and play
      player.replace({ uri: artist.audioPreviewUrl });
      player.play();
      setPlayingId(artist.id);
    },
    [playingId, player],
  );

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
  },
  empty: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
  },
});
