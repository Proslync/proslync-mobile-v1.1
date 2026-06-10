/**
 * MasonryTile — generic masonry tile for the PRO home tab.
 * Renders AbstractArt (or user/curated media) with a seeded aspect ratio,
 * a one-line caption row with a tappable ··· menu button, and an entrance
 * animation stagger for the first screenful.
 */

import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as React from 'react';
import { Image, Pressable, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AbstractArt } from '@/components/fan/abstract-art';
import { seededAspect } from '@/lib/fan/seeded';

const TEXT_SECONDARY = 'rgba(255,255,255,0.55)';

/**
 * Media descriptor for a tile.
 * - local image:   { type: 'image'; uri: string }
 * - curated image: { type: 'image'; source: ImageSourcePropType }
 * - any video:     { type: 'video'; uri: string }
 */
export type TileMedia =
  | { type: 'image'; uri?: string; source?: ImageSourcePropType }
  | { type: 'video'; uri: string };

export type Props = {
  id: string;
  caption: string;
  colWidth: number;
  index: number;
  onPress: () => void;
  /** Optional user/curated media to render instead of AbstractArt. */
  media?: TileMedia | null;
  /** Called when the ··· button is pressed. */
  onMenuPress?: () => void;
};

// ── TileVideo — isolated so useVideoPlayer is never called conditionally ──────

function TileVideo({ uri, width, height }: { uri: string; width: number; height: number }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  React.useEffect(() => {
    try { player.play(); } catch {}
    const playSub = player.addListener('playingChange', (e: any) => {
      if (!e?.isPlaying) { try { player.play(); } catch {} }
    });
    const statusSub = player.addListener('statusChange', (e: any) => {
      if (e?.status === 'readyToPlay') { try { player.play(); } catch {} }
    });
    return () => {
      try { playSub.remove(); } catch {}
      try { statusSub.remove(); } catch {}
    };
  }, [player, uri]);

  return (
    <VideoView
      player={player}
      style={{ width, height }}
      contentFit="cover"
      nativeControls={false}
    />
  );
}

// ── MasonryTile ───────────────────────────────────────────────────────────────

export const MasonryTile = React.memo(function MasonryTile({
  id,
  caption,
  colWidth,
  index,
  onPress,
  media,
  onMenuPress,
}: Props): React.JSX.Element {
  const artHeight = Math.round(colWidth / seededAspect(id));
  const handlePress = React.useCallback(() => onPress(), [onPress]);

  // Render the art/media box at the seeded aspect — always the same height
  // for layout stability regardless of whether media is present.
  let artBox: React.ReactNode;
  if (media) {
    if (media.type === 'video') {
      // Only mount TileVideo when we have a video — hooks are inside the child.
      artBox = <TileVideo uri={media.uri} width={colWidth} height={artHeight} />;
    } else {
      // image: prefer uri, fall back to source (curated require)
      const imgSource: ImageSourcePropType =
        media.source != null ? media.source : { uri: media.uri! };
      artBox = (
        <Image
          source={imgSource}
          style={{ width: colWidth, height: artHeight }}
          resizeMode="cover"
        />
      );
    }
  } else {
    artBox = <AbstractArt seed={id} width={colWidth} height={artHeight} />;
  }

  const card = (
    <Pressable style={styles.card} onPress={handlePress}>
      {artBox}
      <View style={styles.metaRow}>
        <Text style={styles.caption} numberOfLines={1}>{caption}</Text>
        {/* ··· is its own Pressable — inner press does NOT bubble to the card. */}
        <Pressable
          hitSlop={10}
          onPress={(e) => {
            e.stopPropagation?.();
            onMenuPress?.();
          }}
          accessibilityLabel="Tile options"
          accessibilityRole="button"
        >
          <Ionicons name="ellipsis-horizontal" size={16} color={TEXT_SECONDARY} />
        </Pressable>
      </View>
    </Pressable>
  );

  // Entrance stagger for first screenful only.
  if (index < 12) {
    return (
      <Animated.View entering={FadeInDown.delay(Math.min(index, 10) * 60).duration(250)}>
        {card}
      </Animated.View>
    );
  }
  return card;
});

const styles = StyleSheet.create({
  card: { borderRadius: 16, overflow: 'hidden', backgroundColor: '#1A1A1A' },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  caption: { flex: 1, color: TEXT_SECONDARY, fontSize: 13 },
});
