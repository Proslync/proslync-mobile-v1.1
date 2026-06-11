// Card detail — full page for a single home masonry tile: its media (user
// upload → curated → abstract art) as the hero, its title, and an onward
// destination. For now every card routes onward to NCAA Basketball.

import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as React from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AbstractArt } from '@/components/fan/abstract-art';
import { TILE_MEDIA_STORAGE_KEY, tileSlot, type TileLocalMedia } from '@/lib/home/tiles';
import { healLocalMediaUri } from '@/lib/media/local-media';
import { resolveSlotMedia } from '@/lib/media/resolve-media';

const SCREEN_W = Dimensions.get('window').width;
const HERO_H = Math.round(SCREEN_W * 1.15);
const COPPER = '#EB621A';

function HeroVideo({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });
  React.useEffect(() => {
    try { player.play(); } catch {}
    const sub = player.addListener('playingChange', (e: any) => {
      if (!e?.isPlaying) { try { player.play(); } catch {} }
    });
    return () => { try { sub.remove(); } catch {} };
  }, [player, uri]);
  return (
    <VideoView
      player={player}
      style={{ width: SCREEN_W, height: HERO_H }}
      contentFit="cover"
      nativeControls={false}
    />
  );
}

export default function CardDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, caption } = useLocalSearchParams<{ id: string; caption?: string }>();
  const tileId = id ?? '';

  // Local user-uploaded media for this tile (healed), else curated, else art.
  const [local, setLocal] = React.useState<TileLocalMedia | null>(null);
  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(TILE_MEDIA_STORAGE_KEY);
        if (cancelled || !raw) return;
        const map = JSON.parse(raw) as Record<string, TileLocalMedia>;
        const entry = map[tileId];
        if (!entry) return;
        const healed = await healLocalMediaUri(entry.uri);
        if (!cancelled && healed) setLocal({ uri: healed, type: entry.type });
      } catch {
        // ignore corrupt storage
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => { cancelled = true; };
  }, [tileId]);

  const resolved = React.useMemo(
    () => resolveSlotMedia(tileSlot(tileId), local),
    [tileId, local],
  );

  let hero: React.ReactNode;
  if (resolved.kind !== 'none' && resolved.type === 'video') {
    hero = <HeroVideo uri={resolved.uri} />;
  } else if (resolved.kind === 'local' && resolved.type === 'image') {
    hero = (
      <Image
        source={{ uri: resolved.uri }}
        style={{ width: SCREEN_W, height: HERO_H }}
        resizeMode="cover"
      />
    );
  } else if (resolved.kind === 'curated-image') {
    hero = (
      <Image
        source={resolved.source as ImageSourcePropType}
        style={{ width: SCREEN_W, height: HERO_H }}
        resizeMode="cover"
      />
    );
  } else {
    hero = <AbstractArt seed={tileId} width={SCREEN_W} height={HERO_H} />;
  }

  // Wait one beat for hydration so a local video doesn't flash the art first.
  const showHero = hydrated || local !== null;

  return (
    <View style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 48 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroWrap}>
          {showHero ? hero : <View style={{ width: SCREEN_W, height: HERO_H, backgroundColor: '#1A1A1A' }} />}
          {/* Bottom fade into the page so the title sits on the media. */}
          <View style={styles.heroFade} pointerEvents="none" />
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>{caption || 'Untitled'}</Text>

          <Pressable
            style={styles.sectionLink}
            onPress={() => router.push({ pathname: '/section/[id]', params: { id: 'ncaab' } } as any)}
            accessibilityRole="button"
            accessibilityLabel="Open NCAA Basketball"
          >
            <View style={styles.sectionLinkBar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionLinkEyebrow}>GO TO</Text>
              <Text style={styles.sectionLinkTitle}>NCAA Basketball</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.6)" />
          </Pressable>
        </View>
      </ScrollView>

      {/* Floating back button */}
      <Pressable
        style={[styles.backBtn, { top: insets.top + 8 }]}
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={8}
      >
        <Ionicons name="chevron-back" size={22} color="#FFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  heroWrap: { width: SCREEN_W, height: HERO_H, backgroundColor: '#1A1A1A' },
  heroFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 110,
    backgroundColor: 'transparent',
    // Simple two-stop fade without adding a gradient dep here: layered views.
  },
  body: { paddingHorizontal: 16, paddingTop: 14, gap: 16 },
  title: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
    lineHeight: 30,
  },
  sectionLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.055)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    minHeight: 44,
  },
  sectionLinkBar: {
    width: 4,
    alignSelf: 'stretch',
    borderRadius: 2,
    backgroundColor: COPPER,
  },
  sectionLinkEyebrow: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  sectionLinkTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginTop: 2,
  },
  backBtn: {
    position: 'absolute',
    left: 14,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.15)',
  },
});
