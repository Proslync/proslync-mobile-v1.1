import { useState, useCallback } from 'react';
import { GlassSurface } from '@/components/glass/glass-surface';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { EventArtist } from '@/lib/types/artists.types';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { WebView } from 'react-native-webview';

interface ArtistRowProps {
  artist: EventArtist;
  canManage?: boolean;
  onOptions?: (artist: EventArtist) => void;
}

function getDisplayName(artist: EventArtist): string {
  return artist.userName || artist.userFullName || 'Guest Artist';
}

function getInitial(artist: EventArtist): string {
  const name = getDisplayName(artist);
  return name[0]?.toUpperCase() || 'A';
}

function formatTimeRange(startTime: string, endTime: string): string {
  try {
    const start = parseISO(startTime);
    const end = parseISO(endTime);
    return `${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`;
  } catch {
    return 'Time TBD';
  }
}

function buildSpotifyEmbedHtml(url?: string | null): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split('/').filter(Boolean);
    const idx = segments.findIndex((s) => s === 'playlist');
    if (idx === -1 || !segments[idx + 1]) return undefined;
    const src = `https://open.spotify.com/embed/playlist/${segments[idx + 1]}?utm_source=generator&theme=0`;
    return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>*{margin:0;padding:0}html,body{width:100%;height:100%;overflow:hidden;background:transparent}</style>
</head><body>
<iframe style="border-radius:12px" src="${src}" width="100%" height="352" frameBorder="0" allowfullscreen allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
</body></html>`;
  } catch {
    return undefined;
  }
}

export function ArtistRow({ artist, canManage, onOptions }: ArtistRowProps) {
  const { colors } = useAppTheme();
  const name = getDisplayName(artist);
  const timeRange = formatTimeRange(artist.startTime, artist.endTime);
  const embedHtml = buildSpotifyEmbedHtml(artist.playlistUrl);
  const [expanded, setExpanded] = useState(false);
  const [embedLoading, setEmbedLoading] = useState(true);

  const toggleExpand = useCallback(() => {
    setExpanded((prev) => !prev);
    if (!expanded) setEmbedLoading(true);
  }, [expanded]);

  return (
    <GlassSurface fill="subtle" border="subtle" cornerRadius="lg" style={styles.row}>
      {/* Artist info row */}
      <View style={styles.topRow}>
        {artist.avatarUrl ? (
          <Image source={{ uri: artist.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarFallback, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={[styles.avatarInitial, { color: colors.text }]}>{getInitial(artist)}</Text>
          </View>
        )}
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {name}
          </Text>
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={13} color={colors.textTertiary} />
            <Text style={[styles.timeText, { color: colors.textTertiary }]}>{timeRange}</Text>
          </View>
          {artist.description ? (
            <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
              {artist.description}
            </Text>
          ) : null}
          {embedHtml ? (
            <TouchableOpacity
              style={[styles.playlistBadge, { backgroundColor: colors.backgroundSecondary }]}
              onPress={toggleExpand}
              activeOpacity={0.7}
            >
              <Ionicons name="musical-notes" size={11} color={colors.textSecondary} />
              <Text style={[styles.playlistText, { color: colors.textSecondary }]}>Playlist</Text>
              <Ionicons
                name={expanded ? 'chevron-up' : 'chevron-down'}
                size={11}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          ) : null}
        </View>
        {canManage && onOptions && (
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => onOptions(artist)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="ellipsis-vertical" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Spotify embed — shown when expanded */}
      {expanded && embedHtml && (
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} style={styles.embedContainer}>
          {embedLoading && (
            <View style={styles.embedLoader}>
              <ActivityIndicator size="small" color={colors.textTertiary} />
            </View>
          )}
          <WebView
            source={{ html: embedHtml, baseUrl: 'https://open.spotify.com' }}
            originWhitelist={['https://*']}
            style={[styles.embed, embedLoading && styles.embedHidden]}
            scrollEnabled={false}
            bounces={false}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            onLoadEnd={() => setEmbedLoading(false)}
          />
        </Animated.View>
      )}
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  row: {
    padding: 12,
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
    marginBottom: 2,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  timeText: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
  },
  description: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    lineHeight: 18,
    marginTop: 2,
  },
  playlistBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 6,
  },
  playlistText: {
    fontSize: 11,
    fontFamily: 'Lato_700Bold',
  },
  menuButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  embedContainer: {
    height: 352,
    borderRadius: 12,
    overflow: 'hidden',
  },
  embed: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  embedHidden: {
    opacity: 0,
  },
  embedLoader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
