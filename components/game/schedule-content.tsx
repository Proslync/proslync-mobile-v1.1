// Schedule content — a record-summary header for the home team, then the season
// in chronological order. Each row shows date, vs/@ + opponent rank+abbr, and
// either a W/L score pill (green/red) or an upcoming tip time. The current game
// is highlighted with a copper left edge and a "TODAY" tag.
// Pure content: takes { game } and renders only the section body (no shell).

import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  ACCENT,
  HAIRLINE,
  HAIRLINE_SUBTLE,
  RADIUS_CARD,
  RADIUS_PILL,
  RADIUS_SM,
  SIGNAL_NEGATIVE,
  SIGNAL_POSITIVE,
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
import type { GameDetail, ScheduleEntry } from '@/lib/data/mock-games';

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 'TBD';
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function Row({ e }: { e: ScheduleEntry }) {
  return (
    <View style={[styles.row, e.isCurrent && styles.rowCurrent]}>
      {e.isCurrent ? <View style={styles.currentEdge} /> : null}
      <View style={styles.dateCol}>
        <Text style={styles.date}>{fmtDate(e.dateISO)}</Text>
        {e.isCurrent ? (
          <View style={styles.todayTag}>
            <Text style={styles.todayText}>TODAY</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.oppCol}>
        <Text style={styles.vs}>{e.homeAway === 'H' ? 'vs' : '@'}</Text>
        {e.opponentRank ? <Text style={styles.oppRank}>{e.opponentRank}</Text> : null}
        <Text style={styles.oppAbbr}>{e.opponentAbbr}</Text>
      </View>

      <View style={styles.resultCol}>
        {e.result ? (
          <View style={styles.resultPill}>
            <Text style={[styles.resultLetter, { color: e.result === 'W' ? SIGNAL_POSITIVE : SIGNAL_NEGATIVE }]}>
              {e.result}
            </Text>
            <Text style={styles.resultScore}>{`${e.teamScore}-${e.oppScore}`}</Text>
          </View>
        ) : (
          <Text style={styles.tipTime}>{fmtTime(e.dateISO)}</Text>
        )}
      </View>
    </View>
  );
}

export function ScheduleContent({ game }: { game: GameDetail }) {
  const played = game.schedule.filter((e) => e.result);
  const wins = played.filter((e) => e.result === 'W').length;
  const losses = played.filter((e) => e.result === 'L').length;

  return (
    <>
      {/* Record summary */}
      <View style={styles.summary}>
        <View style={styles.summaryMain}>
          <Text style={styles.summaryAbbr}>{game.home.abbr}</Text>
          <Text style={styles.summaryName}>{game.home.name}</Text>
        </View>
        <View style={styles.summaryRecord}>
          <Text style={styles.recordVal}>{`${wins}-${losses}`}</Text>
          <Text style={styles.recordLabel}>SEASON</Text>
        </View>
      </View>

      {/* Season list */}
      <View style={styles.block}>
        <Text style={styles.sectionTitle}>Full Schedule</Text>
        <View style={styles.list}>
          {game.schedule.map((e, i) => (
            <View key={`${e.dateISO}-${i}`}>
              {i > 0 ? <View style={styles.divider} /> : null}
              <Row e={e} />
            </View>
          ))}
        </View>
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

  // Summary
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: SURFACE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
    borderRadius: RADIUS_CARD,
    paddingHorizontal: SP_LG,
    paddingVertical: SP_MD,
  },
  summaryMain: { gap: 2 },
  summaryAbbr: { color: TEXT_PRIMARY, fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  summaryName: { color: TEXT_SECONDARY, fontSize: 13, fontWeight: '600' },
  summaryRecord: { alignItems: 'flex-end' },
  recordVal: { color: TEXT_PRIMARY, fontSize: 22, fontWeight: '800', ...tnum },
  recordLabel: { color: TEXT_TERTIARY, fontSize: 10, fontWeight: '800', letterSpacing: 1 },

  // List
  list: {
    backgroundColor: SURFACE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
    borderRadius: RADIUS_CARD,
    overflow: 'hidden',
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: HAIRLINE_SUBTLE, marginHorizontal: SP_MD },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: SP_MD, paddingHorizontal: SP_MD, gap: SP_MD },
  rowCurrent: { backgroundColor: SURFACE_SUBTLE },
  currentEdge: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: ACCENT,
  },
  dateCol: { width: 72, gap: SP_XS },
  date: { color: TEXT_SECONDARY, fontSize: 13, fontWeight: '700', ...tnum },
  todayTag: { alignSelf: 'flex-start', backgroundColor: ACCENT, borderRadius: RADIUS_SM, paddingHorizontal: SP_XS, paddingVertical: 1 },
  todayText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800', letterSpacing: 0.6 },

  oppCol: { flex: 1, flexDirection: 'row', alignItems: 'baseline', gap: SP_XS },
  vs: { color: TEXT_TERTIARY, fontSize: 12, fontWeight: '600' },
  oppRank: { color: TEXT_TERTIARY, fontSize: 11, fontWeight: '700', ...tnum },
  oppAbbr: { color: TEXT_PRIMARY, fontSize: 15, fontWeight: '800' },

  resultCol: { alignItems: 'flex-end', minWidth: 84 },
  resultPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP_XS,
    borderRadius: RADIUS_PILL,
    paddingHorizontal: SP_SM,
    paddingVertical: 3,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  resultLetter: { fontSize: 12, fontWeight: '800' },
  resultScore: { color: TEXT_SECONDARY, fontSize: 12, fontWeight: '700', ...tnum },
  tipTime: { color: TEXT_SECONDARY, fontSize: 13, fontWeight: '700', ...tnum },
});
