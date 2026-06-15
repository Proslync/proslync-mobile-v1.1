// Box score content — scoring-by-period table, team-stat comparison rows with a
// proportional bar, and two horizontally-scrolling player box-score tables
// (starters then bench, plus a TOTALS row). All stats use tabular-nums.
// Pure content: takes { game } and renders only the section body (no shell).

import * as React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  ACCENT,
  HAIRLINE,
  HAIRLINE_SUBTLE,
  RADIUS_CARD,
  RADIUS_SM,
  SP_MD,
  SP_SM,
  SP_XS,
  SURFACE,
  SURFACE_SUBTLE,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_TERTIARY,
} from '@/components/shared/ui-kit/tokens';
import type { BoxScoreLine, BoxScoreTeam, GameDetail } from '@/lib/data/mock-games';

const STAT_COLS: { key: keyof BoxScoreLine; label: string; w: number }[] = [
  { key: 'min', label: 'MIN', w: 40 },
  { key: 'pts', label: 'PTS', w: 40 },
  { key: 'reb', label: 'REB', w: 40 },
  { key: 'ast', label: 'AST', w: 40 },
  { key: 'fg', label: 'FG', w: 56 },
  { key: 'threes', label: '3PT', w: 56 },
  { key: 'ft', label: 'FT', w: 52 },
  { key: 'stl', label: 'STL', w: 40 },
  { key: 'blk', label: 'BLK', w: 40 },
  { key: 'to', label: 'TO', w: 36 },
  { key: 'plusMinus', label: '+/-', w: 44 },
];

const NAME_W = 132;

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

function ScoringTable({ game }: { game: GameDetail }) {
  const periods = game.scoring.filter((r) => r.label !== 'F');
  const final = game.scoring.find((r) => r.label === 'F');
  return (
    <View style={styles.card}>
      <View style={styles.scoreHeadRow}>
        <Text style={[styles.scoreCell, styles.scoreTeamCell, styles.scoreHeadText]}> </Text>
        {periods.map((p) => (
          <Text key={p.label} style={[styles.scoreCell, styles.scoreHeadText]}>
            {p.label}
          </Text>
        ))}
        <Text style={[styles.scoreCell, styles.scoreHeadText, styles.scoreFinalText]}>F</Text>
      </View>
      {(['away', 'home'] as const).map((side) => {
        const team = game[side];
        return (
          <View key={side} style={styles.scoreBodyRow}>
            <Text style={[styles.scoreCell, styles.scoreTeamCell, styles.scoreAbbr]}>{team.abbr}</Text>
            {periods.map((p) => (
              <Text key={p.label} style={[styles.scoreCell, styles.scoreVal]}>
                {p[side]}
              </Text>
            ))}
            <Text style={[styles.scoreCell, styles.scoreFinal]}>{final ? final[side] : team.score}</Text>
          </View>
        );
      })}
    </View>
  );
}

function TeamStats({ game }: { game: GameDetail }) {
  return (
    <View style={styles.card}>
      <View style={styles.statsLegend}>
        <Text style={styles.statsLegendText}>{game.away.abbr}</Text>
        <Text style={styles.statsLegendText}>{game.home.abbr}</Text>
      </View>
      {game.teamStats.map((s, i) => (
        <View key={s.label} style={[styles.statRow, i > 0 && styles.statRowBorder]}>
          <View style={styles.statValsRow}>
            <Text style={[styles.statVal, styles.statValLeft]}>{s.away}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
            <Text style={[styles.statVal, styles.statValRight]}>{s.home}</Text>
          </View>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { flex: Math.max(0.02, s.awayPct), backgroundColor: ACCENT }]} />
            <View style={[styles.barFill, { flex: Math.max(0.02, 1 - s.awayPct), backgroundColor: HAIRLINE }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

function PlayerRow({ player, totals }: { player?: BoxScoreLine; totals?: BoxScoreTeam['totals'] }) {
  const isTotals = !!totals;
  const cellFor = (key: keyof BoxScoreLine): string | number => {
    if (isTotals) {
      if (key === 'plusMinus') return '';
      return (totals as any)[key];
    }
    return (player as any)[key];
  };
  return (
    <View style={[styles.pRow, isTotals && styles.pTotalsRow]}>
      <View style={[styles.pNameCell, { width: NAME_W }]}>
        {isTotals ? (
          <Text style={styles.pTotalsLabel}>TOTALS</Text>
        ) : (
          <>
            <Text style={styles.pName} numberOfLines={1}>
              {player!.name}
            </Text>
            <Text style={styles.pPos}>{player!.pos}</Text>
          </>
        )}
      </View>
      {STAT_COLS.map((c) => (
        <Text
          key={c.key}
          style={[styles.pStat, { width: c.w }, isTotals && styles.pStatTotals]}
        >
          {String(cellFor(c.key))}
        </Text>
      ))}
    </View>
  );
}

function BoxTable({ team }: { team: BoxScoreTeam }) {
  const starters = team.players.filter((p) => p.starter);
  const bench = team.players.filter((p) => !p.starter);
  return (
    <View>
      <Text style={styles.boxTeamLabel}>{team.abbr}</Text>
      <View style={styles.card}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false}>
          <View>
            {/* header */}
            <View style={styles.pHeadRow}>
              <Text style={[styles.pHeadText, { width: NAME_W, textAlign: 'left' }]}>STARTERS</Text>
              {STAT_COLS.map((c) => (
                <Text key={c.key} style={[styles.pHeadText, { width: c.w }]}>
                  {c.label}
                </Text>
              ))}
            </View>
            {starters.map((p) => (
              <PlayerRow key={p.name} player={p} />
            ))}
            {bench.length > 0 && (
              <View style={styles.benchHeadRow}>
                <Text style={[styles.pHeadText, { width: NAME_W, textAlign: 'left' }]}>BENCH</Text>
              </View>
            )}
            {bench.map((p) => (
              <PlayerRow key={p.name} player={p} />
            ))}
            <PlayerRow totals={team.totals} />
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

export function BoxScoreContent({ game }: { game: GameDetail }) {
  return (
    <>
      <View style={styles.block}>
        <SectionTitle>Scoring</SectionTitle>
        <ScoringTable game={game} />
      </View>

      <View style={styles.block}>
        <SectionTitle>Team Stats</SectionTitle>
        <TeamStats game={game} />
      </View>

      <View style={styles.block}>
        <SectionTitle>Box Score</SectionTitle>
        <BoxTable team={game.boxScore.away} />
        <View style={{ height: SP_MD }} />
        <BoxTable team={game.boxScore.home} />
      </View>
    </>
  );
}

const tnum = { fontVariant: ['tabular-nums' as const] };

const styles = StyleSheet.create({
  block: { gap: SP_SM },
  sectionTitle: {
    color: TEXT_TERTIARY,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: SURFACE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
    borderRadius: RADIUS_CARD,
    padding: SP_MD,
  },

  // Scoring table
  scoreHeadRow: { flexDirection: 'row', alignItems: 'center', paddingBottom: SP_SM },
  scoreBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SP_SM,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: HAIRLINE_SUBTLE,
  },
  scoreCell: { width: 44, textAlign: 'center', ...tnum },
  scoreTeamCell: { flex: 1, textAlign: 'left' },
  scoreHeadText: { color: TEXT_TERTIARY, fontSize: 12, fontWeight: '700' },
  scoreFinalText: { color: TEXT_SECONDARY },
  scoreAbbr: { color: TEXT_PRIMARY, fontSize: 15, fontWeight: '800' },
  scoreVal: { color: TEXT_SECONDARY, fontSize: 15, fontWeight: '600' },
  scoreFinal: { color: TEXT_PRIMARY, fontSize: 16, fontWeight: '800' },

  // Team stats
  statsLegend: { flexDirection: 'row', justifyContent: 'space-between', paddingBottom: SP_SM },
  statsLegendText: { color: TEXT_TERTIARY, fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  statRow: { paddingVertical: SP_SM, gap: SP_XS },
  statRowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: HAIRLINE_SUBTLE },
  statValsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statVal: { color: TEXT_PRIMARY, fontSize: 14, fontWeight: '700', ...tnum },
  statValLeft: { textAlign: 'left', minWidth: 90 },
  statValRight: { textAlign: 'right', minWidth: 90 },
  statLabel: { color: TEXT_TERTIARY, fontSize: 11, fontWeight: '600', textAlign: 'center', flex: 1 },
  barTrack: { flexDirection: 'row', height: 4, borderRadius: 2, overflow: 'hidden', gap: 2 },
  barFill: { height: 4, borderRadius: 2 },

  // Player box table
  boxTeamLabel: { color: TEXT_SECONDARY, fontSize: 13, fontWeight: '800', marginBottom: SP_XS, letterSpacing: 0.5 },
  pHeadRow: { flexDirection: 'row', alignItems: 'center', paddingBottom: SP_SM },
  pHeadText: { color: TEXT_TERTIARY, fontSize: 11, fontWeight: '700', textAlign: 'center', ...tnum },
  benchHeadRow: {
    flexDirection: 'row',
    paddingTop: SP_SM,
    marginTop: SP_XS,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: HAIRLINE_SUBTLE,
  },
  pRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SP_SM,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: HAIRLINE_SUBTLE,
  },
  pTotalsRow: { backgroundColor: SURFACE_SUBTLE, borderRadius: RADIUS_SM, marginTop: SP_XS },
  pNameCell: { paddingRight: SP_SM, flexDirection: 'row', alignItems: 'baseline', gap: SP_XS },
  pName: { color: TEXT_PRIMARY, fontSize: 13, fontWeight: '600', flexShrink: 1 },
  pPos: { color: TEXT_TERTIARY, fontSize: 10, fontWeight: '700' },
  pTotalsLabel: { color: TEXT_SECONDARY, fontSize: 12, fontWeight: '800', letterSpacing: 0.5, paddingLeft: SP_XS },
  pStat: { color: TEXT_SECONDARY, fontSize: 13, fontWeight: '600', textAlign: 'center', ...tnum },
  pStatTotals: { color: TEXT_PRIMARY, fontWeight: '800' },
});
