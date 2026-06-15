// GamePageShell — shared chrome for the single comprehensive game page
// (box score / highlights / schedule). Renders the back button, a GameHeader
// (two team rows + status line + venue·date·broadcast meta), and a segmented
// switcher that calls onSelect() to swap the body in-place (local tab state) so
// nothing navigates or re-animates. Children render the active body below.

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ACCENT,
  CANVAS,
  HAIRLINE,
  HAIRLINE_SUBTLE,
  RADIUS_CARD,
  RADIUS_PILL,
  SP_LG,
  SP_MD,
  SP_SM,
  SP_XS,
  SURFACE,
  SURFACE_SUBTLE,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_TERTIARY,
} from '@/components/shared/ui-kit/tokens';
import type { GameDetail, GameTeam } from '@/lib/data/mock-games';

export type GameTab = 'box-score' | 'highlights' | 'schedule';

const TABS: { key: GameTab; label: string }[] = [
  { key: 'box-score', label: 'Box Score' },
  { key: 'highlights', label: 'Highlights' },
  { key: 'schedule', label: 'Schedule' },
];

function formatMeta(game: GameDetail): string {
  const d = new Date(game.dateISO);
  const date = isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return [game.venue, date, game.broadcast].filter(Boolean).join('  ·  ');
}

function statusLine(game: GameDetail): React.ReactNode {
  if (game.status === 'live') {
    const seg = [game.period, game.clock].filter(Boolean).join(' ');
    return (
      <View style={styles.liveRow}>
        <View style={styles.liveDot} />
        <Text style={styles.liveText}>{`LIVE  ·  ${seg}`}</Text>
      </View>
    );
  }
  if (game.status === 'final') {
    return <Text style={styles.finalText}>FINAL</Text>;
  }
  const d = new Date(game.dateISO);
  const tip = isNaN(d.getTime())
    ? 'UPCOMING'
    : d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return <Text style={styles.upcomingText}>{tip}</Text>;
}

function TeamRow({ team, dim }: { team: GameTeam; dim: boolean }) {
  return (
    <View style={styles.teamRow}>
      <View style={[styles.colorChip, { backgroundColor: team.color }]} />
      <View style={styles.teamId}>
        {team.rank ? <Text style={styles.rank}>{team.rank}</Text> : null}
        <Text style={styles.abbr}>{team.abbr}</Text>
      </View>
      <View style={styles.teamNameWrap}>
        <Text style={styles.teamName} numberOfLines={1}>
          {team.name}
        </Text>
        <Text style={styles.teamRecord}>{team.record}</Text>
      </View>
      <Text style={[styles.score, dim && styles.scoreDim]}>{team.score}</Text>
    </View>
  );
}

export function GamePageShell({
  game,
  active,
  onSelect,
  children,
}: {
  game: GameDetail;
  active: GameTab;
  onSelect: (tab: GameTab) => void;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const awayWins = game.status === 'final' && game.away.score > game.home.score;
  const homeWins = game.status === 'final' && game.home.score > game.away.score;

  const go = (tab: GameTab) => {
    if (tab === active) return;
    onSelect(tab);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 52 }]}>
          <Text style={styles.league}>{game.league.toUpperCase()}</Text>
          <View style={styles.headerCard}>
            <TeamRow team={game.away} dim={homeWins} />
            <View style={styles.headerDivider} />
            <TeamRow team={game.home} dim={awayWins} />
          </View>
          <View style={styles.statusWrap}>{statusLine(game)}</View>
          <Text style={styles.meta} numberOfLines={1}>
            {formatMeta(game)}
          </Text>
        </View>

        {/* Segmented switcher */}
        <View style={styles.segment}>
          {TABS.map((t) => {
            const on = t.key === active;
            return (
              <Pressable
                key={t.key}
                style={[styles.segItem, on && styles.segItemOn]}
                onPress={() => go(t.key)}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={t.label}
              >
                <Text style={[styles.segLabel, on && styles.segLabelOn]}>{t.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Page body */}
        <View style={styles.body}>{children}</View>
      </ScrollView>

      {/* Floating back button */}
      <Pressable
        style={[styles.backBtn, { top: insets.top + 8 }]}
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={8}
      >
        <Ionicons name="chevron-back" size={22} color={TEXT_PRIMARY} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CANVAS },

  // Header
  header: { paddingHorizontal: SP_LG, paddingBottom: SP_MD, gap: SP_SM },
  league: {
    color: TEXT_TERTIARY,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  headerCard: {
    backgroundColor: SURFACE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
    borderRadius: RADIUS_CARD,
    paddingHorizontal: 14,
    paddingVertical: SP_XS,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP_MD,
    paddingVertical: SP_MD,
  },
  colorChip: { width: 6, height: 34, borderRadius: 3 },
  teamId: { flexDirection: 'row', alignItems: 'baseline', gap: SP_XS, width: 78 },
  rank: { color: TEXT_TERTIARY, fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },
  abbr: { color: TEXT_PRIMARY, fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  teamNameWrap: { flex: 1 },
  teamName: { color: TEXT_SECONDARY, fontSize: 14, fontWeight: '600' },
  teamRecord: { color: TEXT_TERTIARY, fontSize: 12, marginTop: 1, fontVariant: ['tabular-nums'] },
  score: {
    color: TEXT_PRIMARY,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
    minWidth: 50,
    textAlign: 'right',
  },
  scoreDim: { color: TEXT_TERTIARY },
  headerDivider: { height: StyleSheet.hairlineWidth, backgroundColor: HAIRLINE_SUBTLE },

  statusWrap: { marginTop: SP_XS },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: SP_SM },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: ACCENT },
  liveText: { color: ACCENT, fontSize: 13, fontWeight: '800', letterSpacing: 0.5, fontVariant: ['tabular-nums'] },
  finalText: { color: TEXT_SECONDARY, fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  upcomingText: { color: TEXT_SECONDARY, fontSize: 13, fontWeight: '700', letterSpacing: 0.3, fontVariant: ['tabular-nums'] },
  meta: { color: TEXT_TERTIARY, fontSize: 12, fontWeight: '500' },

  // Segmented switcher
  segment: {
    flexDirection: 'row',
    marginHorizontal: SP_LG,
    marginTop: SP_SM,
    backgroundColor: SURFACE_SUBTLE,
    borderRadius: RADIUS_PILL,
    padding: 4,
    gap: 4,
  },
  segItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SP_SM,
    borderRadius: RADIUS_PILL,
  },
  segItemOn: { backgroundColor: ACCENT },
  segLabel: { color: TEXT_SECONDARY, fontSize: 13, fontWeight: '700' },
  segLabelOn: { color: '#FFFFFF' },

  // Body
  body: { paddingHorizontal: SP_LG, paddingTop: SP_LG, gap: SP_LG },

  // Back button
  backBtn: {
    position: 'absolute',
    left: 14,
    width: 40,
    height: 40,
    borderRadius: RADIUS_PILL,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(14,14,16,0.55)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
  },
});
