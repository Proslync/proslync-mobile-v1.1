import * as React from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeSheet, canUseNativeSheet } from '@/components/ui/native-sheet';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useDebounce } from '@/hooks/use-debounce';
import { spotifyApi, type SpotifyTrack } from '@/lib/api/spotify';

interface MusicPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (track: SpotifyTrack) => void;
}

export function MusicPickerSheet({ visible, onClose, onSelect }: MusicPickerSheetProps) {
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<SpotifyTrack[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const { colors } = useAppTheme();

  React.useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults([]);
      return;
    }

    let cancelled = false;
    const search = async () => {
      setIsLoading(true);
      try {
        const tracks = await spotifyApi.searchTracks(debouncedQuery);
        if (!cancelled) setResults(tracks);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    search();
    return () => { cancelled = true; };
  }, [debouncedQuery]);

  const handleSelect = (track: SpotifyTrack) => {
    onSelect(track);
    setQuery('');
    setResults([]);
    onClose();
  };

  const formatDuration = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!canUseNativeSheet()) return null;

  return (
    <NativeSheet isPresented={visible} onDismiss={onClose} rnContent dragIndicator="visible">
      <View style={styles.container}>
        <Text style={styles.title}>Add Music</Text>

        <View style={[styles.searchBox, { borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search songs..."
            placeholderTextColor={colors.textTertiary}
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        {isLoading && <ActivityIndicator style={styles.loader} color={colors.textTertiary} />}

        {results.map((track) => (
          <TouchableOpacity
            key={track.spotifyId}
            style={[styles.row, { borderBottomColor: colors.border }]}
            onPress={() => handleSelect(track)}
            activeOpacity={0.6}
          >
            {track.albumArtUrl ? (
              <Image source={{ uri: track.albumArtUrl }} style={styles.albumArt} />
            ) : (
              <View style={[styles.albumArt, styles.albumArtPlaceholder]}>
                <Ionicons name="musical-notes" size={18} color={colors.textTertiary} />
              </View>
            )}
            <View style={styles.rowText}>
              <Text style={[styles.trackName, { color: colors.text }]} numberOfLines={1}>{track.name}</Text>
              <Text style={[styles.artistName, { color: colors.textTertiary }]} numberOfLines={1}>
                {track.artistName} · {formatDuration(track.durationMs)}
              </Text>
            </View>
          </TouchableOpacity>
        ))}

        {!isLoading && debouncedQuery.length >= 2 && results.length === 0 && (
          <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No results found</Text>
        )}
      </View>
    </NativeSheet>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32, minHeight: 300 },
  title: { fontSize: 17, fontFamily: 'Lato_700Bold', color: '#fff', textAlign: 'center', marginBottom: 16 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: 'Lato_400Regular' },
  loader: { marginVertical: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  albumArt: { width: 44, height: 44, borderRadius: 6 },
  albumArtPlaceholder: { backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  rowText: { flex: 1 },
  trackName: { fontSize: 15, fontFamily: 'Lato_600SemiBold' },
  artistName: { fontSize: 13, fontFamily: 'Lato_400Regular', marginTop: 2 },
  emptyText: { textAlign: 'center', marginTop: 24, fontSize: 14, fontFamily: 'Lato_400Regular' },
});
