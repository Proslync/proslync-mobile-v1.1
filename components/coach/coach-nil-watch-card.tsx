// ── COACH NIL WATCH CARD ─────────────────────────────────
// Sprint 4 — read-only NIL observation surface for the coach.
// Joins the coach's roster (lib/data/mock-coach-roster.ts) with
// `BRAND_DEALS` + `MOCK_DISCLOSURES` to surface:
//   • A 4-tile rollup (roster size / active / pending / flagged)
//   • A per-athlete row with NIL status, last deal value,
//     last disclosure review state.
//
// The coach is OBSERVATION-ONLY. There are no edit/mutate CTAs
// on this surface — every row is a read deep-link into the
// athlete disclosure index. The footer caveat reinforces that
// compliance escalation lives with the NIL Manager, not coach.

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  CARD_BG,
  CARD_BG_INSET,
  CARD_BORDER,
  RADIUS_MD,
  SectionCard,
  StatPill,
  StatusPill,
  TONE_COLOR,
  type Tone,
} from '@/components/shared/ui-kit';
import { useCoachRoster } from '@/hooks/use-coach-roster';
import { BRAND_ATHLETES, BRAND_DEALS } from '@/lib/data/mock-brand-data';
import { listMockDisclosuresForAthlete } from '@/lib/data/mock-disclosures';
import {
  DEMO_COACH_ID,
  type CoachRosterNilStatus,
} from '@/lib/data/mock-coach-roster';
import {
  buildCoachNilRows,
  countByNilStatus,
  type CoachNilRow,
} from '@/lib/coach/coach-nil-watch-model';

export interface CoachNilWatchCardProps {
  /** Defaults to the demo coach (`coach-001`). */
  coachId?: string;
}

export function CoachNilWatchCard({
  coachId = DEMO_COACH_ID,
}: CoachNilWatchCardProps) {
  const router = useRouter();
  const { data: roster } = useCoachRoster(coachId);

  const rows = React.useMemo<CoachNilRow[]>(
    () =>
      buildCoachNilRows({
        entries: roster?.entries ?? [],
        athletes: BRAND_ATHLETES,
        deals: BRAND_DEALS,
        listDisclosures: listMockDisclosuresForAthlete,
      }),
    [roster],
  );

  const counts = React.useMemo(() => countByNilStatus(rows), [rows]);

  return (
    <View style={styles.wrap}>
      {/* Hero — eyebrow + 4 stat pills */}
      <Text style={styles.eyebrow}>NIL WATCH</Text>
      <View style={styles.heroRow}>
        <StatPill value={String(rows.length)} label="Roster" />
        <StatPill
          value={String(counts.active)}
          label="Active"
          tint={TONE_COLOR.success}
        />
        <StatPill
          value={String(counts['pending-disclosure'])}
          label="Pending"
          tint={TONE_COLOR.warning}
        />
        <StatPill
          value={String(counts.flagged)}
          label="Flagged"
          tint={TONE_COLOR.danger}
        />
      </View>

      {/* Roster NIL activity list */}
      <View style={styles.section}>
        <SectionCard title="Roster NIL activity" icon="trending-up-outline">
          {rows.length === 0 ? (
            <Text style={styles.empty}>No roster athletes loaded yet.</Text>
          ) : (
            rows.map((row, i) => (
              <NilWatchRow
                key={row.athleteId}
                row={row}
                isLast={i === rows.length - 1}
                onPress={() =>
                  router.push({
                    pathname: '/athlete/disclosures',
                    params: { athleteId: row.athleteId },
                  })
                }
              />
            ))
          )}
        </SectionCard>
      </View>

      {/* Footer caveat — read-only posture */}
      <View style={styles.caveat}>
        <Ionicons
          name="information-circle-outline"
          size={13}
          color="rgba(255,255,255,0.55)"
        />
        <Text style={styles.caveatText}>
          Coach view is read-only. NIL deals are athlete + brand-driven.
          Contact the NIL Manager for compliance escalation.
        </Text>
      </View>
    </View>
  );
}

// ── INTERNAL ROW ─────────────────────────────────────────

function NilWatchRow({
  row,
  isLast,
  onPress,
}: {
  row: CoachNilRow;
  isLast: boolean;
  onPress: () => void;
}) {
  const tone = NIL_STATUS_TONE[row.nilStatus];
  const label = NIL_STATUS_LABEL[row.nilStatus];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !isLast && styles.rowDivider,
        pressed && { opacity: 0.6 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Open NIL disclosures for ${row.athleteName}`}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{row.initials}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.rowHead}>
          <Text style={styles.athleteName} numberOfLines={1}>
            #{row.jerseyNumber} · {row.athleteName}
          </Text>
          <StatusPill label={label} tone={tone} />
        </View>
        <Text style={styles.rowMeta} numberOfLines={1}>
          {row.position} · {row.classYear} · {row.school}
        </Text>
        <View style={styles.rowFootRow}>
          <Text style={styles.rowFootLabel}>Last deal</Text>
          <Text style={styles.rowFootValue}>
            {row.lastDealStatus ?? '—'}
          </Text>
          <Text style={styles.rowFootLabel}>· Disclosure</Text>
          <Text style={styles.rowFootValue}>
            {row.lastDisclosureLabel ?? '—'}
          </Text>
        </View>
      </View>
      <Ionicons
        name="chevron-forward"
        size={16}
        color="rgba(255,255,255,0.35)"
      />
    </Pressable>
  );
}

// ── TONE / LABEL MAPS ────────────────────────────────────

const NIL_STATUS_TONE: Record<CoachRosterNilStatus, Tone> = {
  active: 'success',
  'pending-disclosure': 'warning',
  flagged: 'danger',
  cleared: 'info',
};

const NIL_STATUS_LABEL: Record<CoachRosterNilStatus, string> = {
  active: 'Active',
  'pending-disclosure': 'Pending',
  flagged: 'Flagged',
  cleared: 'Cleared',
};

// ── STYLES ───────────────────────────────────────────────

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
  eyebrow: {
    color: 'rgba(255,255,255,0.46)',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  heroRow: {
    flexDirection: 'row',
    gap: 8,
  },
  section: {
    marginTop: 4,
  },
  empty: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: CARD_BORDER,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: RADIUS_MD,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CARD_BG_INSET,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  rowHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'space-between',
  },
  athleteName: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  rowMeta: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    marginTop: 2,
  },
  rowFootRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
    marginTop: 5,
  },
  rowFootLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    fontWeight: '600',
  },
  rowFootValue: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11.5,
    fontWeight: '700',
  },
  caveat: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    padding: 10,
    borderRadius: RADIUS_MD,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG,
  },
  caveatText: {
    flex: 1,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11.5,
    lineHeight: 16,
  },
});

