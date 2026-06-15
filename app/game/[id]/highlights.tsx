// Highlights page — a featured Top Play card, then clip cards grouped by
// period. Each clip uses a seeded AbstractArt thumbnail with a play-type chip,
// a play glyph, title, scorer·team, period·clock, and m:ss duration. Tapping a
// clip raises a demo Alert (playback not enabled).

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { AbstractArt } from '@/components/fan/abstract-art';
import { GamePageShell } from '@/components/game/game-page-shell';
import {
  ACCENT,
  HAIRLINE,
  RADIUS_CARD,
  RADIUS_PILL,
  RADIUS_SM,
  SP_MD,
  SP_SM,
  SP_XS,
  SURFACE,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_TERTIARY,
} from '@/components/shared/ui-kit/tokens';
import { getGame, type GamePlayType, type Highlight } from '@/lib/data/mock-games';

const PLAY_GLYPH: Record<GamePlayType, keyof typeof Ionicons.glyphMap> = {
  DUNK: 'basketball-outline',
  '3PT': 'locate-outline',
  BLOCK: 'hand-left-outline',
  STEAL: 'flash-outline',
  LAYUP: 'arrow-up-circle-outline',
  ASSIST: 'git-merge-outline',
};

function dur(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function onPlay() {
  Alert.alert('Highlights', 'Clip playback not enabled in demo.');
}

function ClipThumb({ seed, small }: { seed: string; small?: boolean }) {
  const w = small ? 96 : 340;
  const h = small ? 64 : 180;
  return (
    <View style={[styles.thumb, { width: small ? 96 : undefined, height: h }, small ? null : styles.thumbFull]}>
      <AbstractArt seed={seed} width={small ? w : 600} height={h} />
      <View style={styles.thumbScrim} pointerEvents="none" />
      <View style={[styles.playGlyph, small && styles.playGlyphSmall]}>
        <Ionicons name="play" size={small ? 14 : 22} color="#FFFFFF" />
      </View>
    </View>
  );
}

function FeaturedCard({ clip }: { clip: Highlight }) {
  return (
    <Pressable style={styles.featured} onPress={onPlay} accessibilityRole="button" accessibilityLabel={clip.title}>
      <ClipThumb seed={`feat-${clip.id}`} />
      <View style={styles.featuredBody}>
        <View style={styles.chipRow}>
          <View style={styles.topChip}>
            <Text style={styles.topChipText}>TOP PLAY</Text>
          </View>
          <PlayChip type={clip.playType} />
        </View>
        <Text style={styles.featuredTitle}>{clip.title}</Text>
        <Text style={styles.featuredMeta}>
          {`${clip.scorer} · ${clip.team}   ·   ${clip.period} ${clip.clock}   ·   ${dur(clip.durationSec)}`}
        </Text>
      </View>
    </Pressable>
  );
}

function PlayChip({ type }: { type: GamePlayType }) {
  return (
    <View style={styles.playChip}>
      <Ionicons name={PLAY_GLYPH[type]} size={12} color={TEXT_SECONDARY} />
      <Text style={styles.playChipText}>{type}</Text>
    </View>
  );
}

function ClipCard({ clip }: { clip: Highlight }) {
  return (
    <Pressable style={styles.clip} onPress={onPlay} accessibilityRole="button" accessibilityLabel={clip.title}>
      <ClipThumb seed={clip.id} small />
      <View style={styles.clipBody}>
        <PlayChip type={clip.playType} />
        <Text style={styles.clipTitle} numberOfLines={2}>
          {clip.title}
        </Text>
        <Text style={styles.clipMeta} numberOfLines={1}>
          {`${clip.scorer} · ${clip.team}`}
        </Text>
      </View>
      <View style={styles.clipRight}>
        <Text style={styles.clipClock}>{`${clip.period} ${clip.clock}`}</Text>
        <Text style={styles.clipDur}>{dur(clip.durationSec)}</Text>
      </View>
    </Pressable>
  );
}

export default function HighlightsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const game = React.useMemo(() => getGame(id ?? ''), [id]);

  const [featured, ...rest] = game.highlights;

  // Group remaining clips by period in encounter order.
  const groups = React.useMemo(() => {
    const order: string[] = [];
    const map = new Map<string, Highlight[]>();
    for (const c of rest) {
      if (!map.has(c.period)) {
        map.set(c.period, []);
        order.push(c.period);
      }
      map.get(c.period)!.push(c);
    }
    return order.map((p) => ({ period: p, clips: map.get(p)! }));
  }, [rest]);

  return (
    <GamePageShell game={game} active="highlights">
      {featured ? <FeaturedCard clip={featured} /> : null}
      {groups.map((g) => (
        <View key={g.period} style={styles.group}>
          <Text style={styles.groupTitle}>{periodLabel(g.period)}</Text>
          <View style={styles.groupList}>
            {g.clips.map((c) => (
              <ClipCard key={c.id} clip={c} />
            ))}
          </View>
        </View>
      ))}
    </GamePageShell>
  );
}

function periodLabel(p: string): string {
  if (p === 'H1') return 'FIRST HALF';
  if (p === 'H2') return 'SECOND HALF';
  if (p === 'OT') return 'OVERTIME';
  return p.toUpperCase();
}

const styles = StyleSheet.create({
  // Thumbnail
  thumb: { borderRadius: RADIUS_SM, overflow: 'hidden', backgroundColor: SURFACE },
  thumbFull: { width: '100%' },
  thumbScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(14,14,16,0.18)' },
  playGlyph: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 44,
    height: 44,
    marginTop: -22,
    marginLeft: -22,
    borderRadius: RADIUS_PILL,
    backgroundColor: 'rgba(14,14,16,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playGlyphSmall: { width: 28, height: 28, marginTop: -14, marginLeft: -14 },

  // Featured
  featured: {
    backgroundColor: SURFACE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
    borderRadius: RADIUS_CARD,
    overflow: 'hidden',
  },
  featuredBody: { padding: SP_MD, gap: SP_XS },
  chipRow: { flexDirection: 'row', alignItems: 'center', gap: SP_SM },
  topChip: {
    backgroundColor: ACCENT,
    borderRadius: RADIUS_PILL,
    paddingHorizontal: SP_SM,
    paddingVertical: 3,
  },
  topChipText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  featuredTitle: { color: TEXT_PRIMARY, fontSize: 17, fontWeight: '800', letterSpacing: -0.2, marginTop: SP_XS },
  featuredMeta: { color: TEXT_TERTIARY, fontSize: 12, fontWeight: '500', fontVariant: ['tabular-nums'] },

  // Groups
  group: { gap: SP_SM },
  groupTitle: { color: TEXT_TERTIARY, fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  groupList: {
    backgroundColor: SURFACE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
    borderRadius: RADIUS_CARD,
    padding: SP_SM,
    gap: SP_SM,
  },

  // Clip card
  clip: { flexDirection: 'row', alignItems: 'center', gap: SP_MD },
  clipBody: { flex: 1, gap: 3 },
  clipTitle: { color: TEXT_PRIMARY, fontSize: 14, fontWeight: '700', lineHeight: 18 },
  clipMeta: { color: TEXT_TERTIARY, fontSize: 12, fontWeight: '500' },
  clipRight: { alignItems: 'flex-end', gap: 2 },
  clipClock: { color: TEXT_SECONDARY, fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },
  clipDur: { color: TEXT_TERTIARY, fontSize: 11, fontWeight: '600', fontVariant: ['tabular-nums'] },

  // Play-type chip
  playChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP_XS,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: RADIUS_PILL,
    paddingHorizontal: SP_SM,
    paddingVertical: 3,
  },
  playChipText: { color: TEXT_SECONDARY, fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
});
