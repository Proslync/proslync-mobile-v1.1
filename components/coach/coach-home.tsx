// components/coach/coach-home.tsx
// ── COACH OWNER HOME ─────────────────────────────────────────────────────
// Charter §A — thin four-module home screen for the coach role.
// Dollar-blindness wall IS the product: no amounts, no per-athlete $$$.
// Modules (max 4):
//   1. THIS WEEK — CONFLICTS (hero)
//   2. ROSTER PULSE (aggregate pills)
//   3. RECRUITING PROOF PACK (aggregates + export CTA)
//   4. THE WALL (deliberate lock row)
// No animations (charter law). Tabular numerals throughout.

import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import {
  Alert,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { DEAL_TRUTH_FIXTURE } from '@/lib/data/mock-deal-truth';

import {
  ACCENT,
  CANVAS,
  HAIRLINE,
  HAIRLINE_SUBTLE,
  RADIUS_CARD,
  RADIUS_LG,
  RADIUS_PILL,
  RADIUS_SM,
  SIGNAL_NEGATIVE,
  SIGNAL_WARN,
  SP_LG,
  SP_MD,
  SP_SM,
  SP_XL,
  SP_XS,
  SURFACE,
  SURFACE_SUBTLE,
  TEXT,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_TERTIARY,
  WEIGHT,
} from '@/components/shared/ui-kit/tokens';

// ── Fixture: team calendar events this week ────────────────────────────────
// Mon–Sun of a demo week; coach sees TIME commitments, never dollar values.
type TeamEvent = {
  id: string;
  day: string;    // e.g. "Mon 6/9"
  time: string;   // e.g. "3:30 PM"
  label: string;  // "Practice", "Team Travel", "Game vs Gonzaga"
  type: 'practice' | 'travel' | 'game';
};

const TEAM_CALENDAR: TeamEvent[] = [
  { id: 'tc-1', day: 'Mon 6/9',  time: '3:30 PM', label: 'Practice',           type: 'practice' },
  { id: 'tc-2', day: 'Tue 6/10', time: '9:00 AM', label: 'Team Travel — Boston', type: 'travel'   },
  { id: 'tc-3', day: 'Tue 6/10', time: '7:30 PM', label: 'Game vs DeMatha',    type: 'game'     },
  { id: 'tc-4', day: 'Thu 6/12', time: '3:30 PM', label: 'Practice',           type: 'practice' },
  { id: 'tc-5', day: 'Sat 6/14', time: '5:00 PM', label: 'Game vs Gonzaga HS', type: 'game'     },
];

// ── Fixture: athlete deliverable obligations (from DEAL_TRUTH + extras) ───
type AthleteObligation = {
  athleteShort: string;  // "Kiyan A."
  deliverable: string;   // "IG Reel due Thu 6pm"
  // Which team-event IDs this conflicts with (overlapping day/travel)
  conflictsWith: string[];
};

const ATHLETE_OBLIGATIONS: AthleteObligation[] = [
  {
    athleteShort: 'Kiyan A.',
    deliverable: 'IG Reel due Thu 6pm (Nike)',
    conflictsWith: ['tc-4'], // Practice Thu — same block
  },
  {
    athleteShort: 'Marcus R.',
    deliverable: 'Social post due Tue (JMA Wireless)',
    conflictsWith: ['tc-2', 'tc-3'], // Travel day + game day
  },
  {
    athleteShort: 'Jordan M.',
    deliverable: 'Product shoot due Sat (Legacy Athletics)',
    conflictsWith: ['tc-5'], // Game Saturday
  },
  {
    athleteShort: 'Devon O.',
    deliverable: 'Story series due Mon (Gatorade)',
    conflictsWith: [], // Clear
  },
  {
    athleteShort: 'Aaron B.',
    deliverable: 'Recap post due Fri (Adidas)',
    conflictsWith: [], // Clear
  },
];

// Build conflict rows: combine event + obligation context
type ConflictRow = {
  id: string;
  isConflict: boolean;
  text: string;
  eventType: TeamEvent['type'];
};

function buildConflictRows(): ConflictRow[] {
  const rows: ConflictRow[] = [];

  // Conflict rows first
  for (const obl of ATHLETE_OBLIGATIONS) {
    if (obl.conflictsWith.length > 0) {
      // Find first conflicting event for context
      const event = TEAM_CALENDAR.find((e) => obl.conflictsWith.includes(e.id));
      const context = event ? ` overlaps ${event.label}` : '';
      rows.push({
        id: `conflict-${obl.athleteShort}`,
        isConflict: true,
        text: `⚠ ${obl.athleteShort} — ${obl.deliverable}${context}`,
        eventType: event?.type ?? 'practice',
      });
    }
  }

  // Clean rows (no conflict)
  for (const obl of ATHLETE_OBLIGATIONS) {
    if (obl.conflictsWith.length === 0) {
      rows.push({
        id: `clean-${obl.athleteShort}`,
        isConflict: false,
        text: `${obl.athleteShort} — ${obl.deliverable}`,
        eventType: 'practice',
      });
    }
  }

  return rows.slice(0, 5);
}

// ── Module helpers ─────────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return (
    <View style={s.sectionHeader}>
      <View style={s.sectionBar} />
      <Text style={s.sectionLabel}>{label}</Text>
    </View>
  );
}

// ── MODULE 1: THIS WEEK — CONFLICTS ────────────────────────────────────────

function ConflictsModule() {
  const rows = buildConflictRows();

  return (
    <View style={s.card}>
      <SectionHeader label="THIS WEEK — CONFLICTS" />
      {rows.length === 0 ? (
        <Text style={s.emptyText}>No conflicts this week.</Text>
      ) : (
        rows.map((row) => (
          <View
            key={row.id}
            style={[s.conflictRow, row.isConflict && s.conflictRowHighlight]}
          >
            {row.isConflict && (
              <View style={s.conflictStripe} />
            )}
            <View style={s.conflictContent}>
              <Text
                style={[s.conflictText, row.isConflict && s.conflictTextWarn]}
                numberOfLines={2}
              >
                {row.text}
              </Text>
            </View>
          </View>
        ))
      )}
      <Text style={s.conflictFooter}>
        Deliverables pulled from logged NIL deals — athletes control logging.
      </Text>
    </View>
  );
}

// ── MODULE 2: ROSTER PULSE ─────────────────────────────────────────────────
// Aggregate stat pills — NO dollar figures anywhere.

type PulsePill = { value: string; label: string; accent?: boolean };

const PULSE_PILLS: PulsePill[] = [
  { value: '4',    label: 'deals signed this wk',          accent: false },
  { value: '92%',  label: 'on-time deliverables',          accent: false },
  { value: '3',    label: 'athletes idle 30d+',            accent: true  },
];

function RosterPulseModule() {
  return (
    <View style={s.card}>
      <SectionHeader label="ROSTER PULSE" />
      <View style={s.pillsRow}>
        {PULSE_PILLS.map((pill) => (
          <View key={pill.label} style={s.pulsePillWrap}>
            <Text style={[s.pulsePillValue, pill.accent && s.pulsePillValueAccent]}>
              {pill.value}
            </Text>
            <Text style={s.pulsePillLabel}>{pill.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── MODULE 3: RECRUITING PROOF PACK ───────────────────────────────────────

// Aggregate proof lines — no per-athlete dollar breakdowns, NO "athletes earn $X"
const PROOF_LINES = [
  { value: '47',    label: 'deals completed by roster this season' },
  { value: '12',    label: 'brand partners active'                 },
  { value: '1,250', label: 'paying supporters on roster'           },
];

async function exportProofPack() {
  const summary = [
    'PROSLYNC PROGRAM PROOF PACK — Paul VI Catholic Basketball',
    '────────────────────────────────',
    '47 deals completed by our roster this season',
    '12 active brand partners',
    '1,250 paying supporters on roster',
    '92% on-time deliverable rate',
    '',
    'Generated via Proslync NIL Platform — data verified.',
  ].join('\n');

  try {
    await Share.share({ message: summary, title: 'Program Proof Pack' });
  } catch (_err) {
    // Silently ignore share cancellation
  }
}

function ProofPackModule() {
  return (
    <View style={s.card}>
      <SectionHeader label="RECRUITING PROOF PACK" />
      {PROOF_LINES.map((line) => (
        <View key={line.label} style={s.proofRow}>
          <Text style={s.proofValue}>{line.value}</Text>
          <Text style={s.proofLabel} numberOfLines={1}>{line.label}</Text>
        </View>
      ))}
      <Pressable
        style={({ pressed }) => [s.exportBtn, { opacity: pressed ? 0.75 : 1 }]}
        onPress={exportProofPack}
        accessibilityRole="button"
        accessibilityLabel="Export recruiting proof pack"
      >
        <Ionicons name="share-outline" size={16} color={ACCENT} />
        <Text style={s.exportBtnText}>EXPORT PROOF PACK</Text>
      </Pressable>
    </View>
  );
}

// ── MODULE 4: THE WALL ─────────────────────────────────────────────────────
// Deliberate feature — the dollar-blindness wall. Charter law.

function DollarWallModule() {
  return (
    <View style={s.wallRow}>
      <Ionicons name="lock-closed" size={14} color={TEXT_TERTIARY} />
      <Text style={s.wallText}>
        Deal dollar amounts are visible only to athletes and compliance — not coaches.
      </Text>
    </View>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────

export interface CoachHomeProps {
  bottomInset?: number;
  topInset?: number;
  onScroll?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

export function CoachHome({ bottomInset = 0, topInset = 0, onScroll }: CoachHomeProps) {
  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={[
        s.content,
        { paddingTop: topInset + SP_LG, paddingBottom: bottomInset + 120 },
      ]}
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={16}
    >
      <ConflictsModule />
      <RosterPulseModule />
      <ProofPackModule />
      <DollarWallModule />
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: SP_LG,
    gap: SP_MD,
  },

  // Card container
  card: {
    backgroundColor: SURFACE,
    borderRadius: RADIUS_LG,
    padding: SP_LG,
    gap: SP_SM,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
  },

  // Section header: 4px copper bar + caps label (TEXT_PRIMARY per copper-restraint)
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP_SM,
    marginBottom: 2,
  },
  sectionBar: {
    width: 4,
    height: 14,
    borderRadius: 2,
    backgroundColor: ACCENT,
  },
  sectionLabel: {
    fontSize: TEXT.caption,
    fontWeight: WEIGHT.bold,
    letterSpacing: 1.2,
    color: TEXT_PRIMARY,
  },

  emptyText: {
    fontSize: TEXT.label,
    fontWeight: WEIGHT.semibold,
    color: TEXT_SECONDARY,
    paddingVertical: SP_XS,
  },

  // ── Module 1: Conflicts ──────────────────────────────────
  conflictRow: {
    borderRadius: RADIUS_SM,
    overflow: 'hidden',
    backgroundColor: SURFACE_SUBTLE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
    flexDirection: 'row',
  },
  conflictRowHighlight: {
    backgroundColor: 'rgba(255,59,48,0.08)',
    borderColor: 'rgba(255,59,48,0.28)',
  },
  conflictStripe: {
    width: 3,
    backgroundColor: SIGNAL_NEGATIVE,
    borderTopLeftRadius: RADIUS_SM,
    borderBottomLeftRadius: RADIUS_SM,
  },
  conflictContent: {
    flex: 1,
    paddingHorizontal: SP_SM,
    paddingVertical: 9,
  },
  conflictText: {
    fontSize: TEXT.label,
    fontWeight: WEIGHT.medium,
    color: TEXT_SECONDARY,
    lineHeight: 18,
  },
  conflictTextWarn: {
    color: TEXT_PRIMARY,
    fontWeight: WEIGHT.semibold,
  },
  conflictFooter: {
    fontSize: TEXT.caption,
    fontWeight: WEIGHT.medium,
    color: TEXT_TERTIARY,
    marginTop: 2,
    lineHeight: 14,
  },

  // ── Module 2: Roster Pulse ───────────────────────────────
  pillsRow: {
    flexDirection: 'row',
    gap: SP_SM,
    flexWrap: 'wrap',
  },
  pulsePillWrap: {
    flex: 1,
    minWidth: 90,
    backgroundColor: SURFACE_SUBTLE,
    borderRadius: RADIUS_CARD,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
    paddingVertical: SP_MD,
    paddingHorizontal: SP_SM,
    alignItems: 'center',
    gap: 3,
  },
  pulsePillValue: {
    fontSize: 22,
    fontWeight: WEIGHT.bold,
    color: TEXT_PRIMARY,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  pulsePillValueAccent: {
    color: SIGNAL_WARN,
  },
  pulsePillLabel: {
    fontSize: TEXT.caption,
    fontWeight: WEIGHT.semibold,
    color: TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 13,
  },

  // ── Module 3: Proof Pack ─────────────────────────────────
  proofRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SP_SM,
    paddingVertical: 2,
  },
  proofValue: {
    fontSize: 20,
    fontWeight: WEIGHT.bold,
    color: TEXT_PRIMARY,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
    minWidth: 52,
  },
  proofLabel: {
    flex: 1,
    fontSize: TEXT.label,
    fontWeight: WEIGHT.medium,
    color: TEXT_SECONDARY,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SP_SM,
    marginTop: 6,
    paddingVertical: SP_MD,
    borderRadius: RADIUS_CARD,
    borderWidth: 1,
    borderColor: `${ACCENT}66`,
    backgroundColor: `${ACCENT}14`,
  },
  exportBtnText: {
    fontSize: TEXT.label,
    fontWeight: WEIGHT.bold,
    color: ACCENT,
    letterSpacing: 0.8,
  },

  // ── Module 4: Dollar Wall ────────────────────────────────
  wallRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SP_SM,
    paddingHorizontal: SP_MD,
    paddingVertical: SP_MD,
    borderRadius: RADIUS_CARD,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE_SUBTLE,
    backgroundColor: SURFACE_SUBTLE,
  },
  wallText: {
    flex: 1,
    fontSize: TEXT.label,
    fontWeight: WEIGHT.medium,
    color: TEXT_SECONDARY,
    lineHeight: 18,
  },
});
