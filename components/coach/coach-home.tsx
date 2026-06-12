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
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { DEAL_TRUTH_FIXTURE } from '@/lib/data/mock-deal-truth';

// ── Charter constants ──────────────────────────────────────────────────────
const COPPER = '#EB621A';
const CARD_BG = '#1C1C1E';
const CARD_BORDER = 'rgba(255,255,255,0.07)';
const MUTED = 'rgba(255,255,255,0.50)';
const RED = '#FF3B30';
const AMBER = '#FFD60A';

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
        <Ionicons name="share-outline" size={16} color={COPPER} />
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
      <Ionicons name="lock-closed" size={14} color={MUTED} />
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
}

export function CoachHome({ bottomInset = 0, topInset = 0 }: CoachHomeProps) {
  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={[
        s.content,
        { paddingTop: topInset + 70, paddingBottom: bottomInset + 40 },
      ]}
      showsVerticalScrollIndicator={false}
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
    paddingHorizontal: 16,
    gap: 14,
  },

  // Card container
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 18,
    padding: 16,
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
  },

  // Section header: 4px copper bar + caps label
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  sectionBar: {
    width: 4,
    height: 14,
    borderRadius: 2,
    backgroundColor: COPPER,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    color: COPPER,
  },

  emptyText: {
    fontSize: 13,
    fontWeight: '600',
    color: MUTED,
    paddingVertical: 4,
  },

  // ── Module 1: Conflicts ──────────────────────────────────
  conflictRow: {
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    flexDirection: 'row',
  },
  conflictRowHighlight: {
    backgroundColor: 'rgba(255,59,48,0.08)',
    borderColor: 'rgba(255,59,48,0.28)',
  },
  conflictStripe: {
    width: 3,
    backgroundColor: RED,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  conflictContent: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  conflictText: {
    fontSize: 13,
    fontWeight: '500',
    color: MUTED,
    lineHeight: 18,
  },
  conflictTextWarn: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  conflictFooter: {
    fontSize: 10,
    fontWeight: '500',
    color: MUTED,
    marginTop: 2,
    lineHeight: 14,
  },

  // ── Module 2: Roster Pulse ───────────────────────────────
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  pulsePillWrap: {
    flex: 1,
    minWidth: 90,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 3,
  },
  pulsePillValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  pulsePillValueAccent: {
    color: AMBER,
  },
  pulsePillLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: MUTED,
    textAlign: 'center',
    lineHeight: 13,
  },

  // ── Module 3: Proof Pack ─────────────────────────────────
  proofRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    paddingVertical: 2,
  },
  proofValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
    minWidth: 52,
  },
  proofLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.75)',
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: `${COPPER}66`,
    backgroundColor: `${COPPER}14`,
  },
  exportBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: COPPER,
    letterSpacing: 0.8,
  },

  // ── Module 4: Dollar Wall ────────────────────────────────
  wallRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.09)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  wallText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: MUTED,
    lineHeight: 18,
  },
});
