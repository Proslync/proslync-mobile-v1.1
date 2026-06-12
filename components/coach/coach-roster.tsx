// components/coach/coach-roster.tsx
// ── COACH ROSTER TAB ─────────────────────────────────────────────────────
// Charter §A Roster tab — per-athlete rows showing:
//   - Name + position
//   - Compliance chip: ✅ CLEAR / ⚠ DISCLOSURE OVERDUE / ◷ IN REVIEW
//   - Rep registry line: "Rep: [name] (verified ✓)" or flagged/none
// NO dollar amounts. Tap row → no-op (no athlete-detail surveillance screen).
// No animations (charter law).

import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

// ── Color constants ────────────────────────────────────────────────────────
const CARD_BG = '#1C1C1E';
const CARD_BORDER = 'rgba(255,255,255,0.07)';
const MUTED = 'rgba(255,255,255,0.50)';
const GREEN = '#34C759';
const RED = '#FF3B30';
const AMBER = '#FFD60A';

// ── Types ─────────────────────────────────────────────────────────────────

type ComplianceState = 'clear' | 'overdue' | 'in-review';
type RepState = 'verified' | 'unverified-flagged' | 'none';

type RosterAthlete = {
  id: string;
  name: string;
  position: string;
  classYear: string;
  initials: string;
  avatarColor: string;
  compliance: ComplianceState;
  rep: RepState;
  repName?: string;
};

// ── Fixture: 6-8 roster athletes ──────────────────────────────────────────
const ROSTER_ATHLETES: RosterAthlete[] = [
  {
    id: 'ra-1',
    name: 'Kiyan Anthony',
    position: 'SG',
    classYear: "Sr '26",
    initials: 'KA',
    avatarColor: '#EB621A',
    compliance: 'clear',
    rep: 'verified',
    repName: 'Marcus Webb',
  },
  {
    id: 'ra-2',
    name: 'Jordan Miles',
    position: 'SF',
    classYear: "Sr '26",
    initials: 'JM',
    avatarColor: '#3B82F6',
    compliance: 'overdue',
    rep: 'verified',
    repName: 'Dana Cole',
  },
  {
    id: 'ra-3',
    name: 'Marcus Reid',
    position: 'PG',
    classYear: "Sr '26",
    initials: 'MR',
    avatarColor: '#A855F7',
    compliance: 'in-review',
    rep: 'unverified-flagged',
    repName: 'T. Simmons',
  },
  {
    id: 'ra-4',
    name: 'Devon Owusu',
    position: 'C',
    classYear: "Jr '27",
    initials: 'DO',
    avatarColor: '#14B8A6',
    compliance: 'clear',
    rep: 'verified',
    repName: 'Proslync Agent Services',
  },
  {
    id: 'ra-5',
    name: 'Aaron Brooks',
    position: 'SF',
    classYear: "So '28",
    initials: 'AB',
    avatarColor: '#FFD60A',
    compliance: 'clear',
    rep: 'none',
  },
  {
    id: 'ra-6',
    name: 'Tyrese Alston',
    position: 'PF',
    classYear: "Fr '29",
    initials: 'TA',
    avatarColor: '#34C759',
    compliance: 'clear',
    rep: 'none',
  },
  {
    id: 'ra-7',
    name: 'Chris Napier',
    position: 'PG',
    classYear: "Jr '27",
    initials: 'CN',
    avatarColor: '#F472B6',
    compliance: 'clear',
    rep: 'verified',
    repName: 'Dana Cole',
  },
  {
    id: 'ra-8',
    name: 'Ben Kamara',
    position: 'C',
    classYear: "So '28",
    initials: 'BK',
    avatarColor: '#FB923C',
    compliance: 'clear',
    rep: 'none',
  },
];

// ── Compliance chip config ─────────────────────────────────────────────────

function complianceChip(state: ComplianceState): {
  label: string;
  icon: string;
  color: string;
  bg: string;
  border: string;
} {
  switch (state) {
    case 'clear':
      return {
        label: 'CLEAR',
        icon: '✅',
        color: GREEN,
        bg: `${GREEN}18`,
        border: `${GREEN}44`,
      };
    case 'overdue':
      return {
        label: 'DISCLOSURE OVERDUE',
        icon: '⚠',
        color: RED,
        bg: `${RED}18`,
        border: `${RED}44`,
      };
    case 'in-review':
      return {
        label: 'IN REVIEW',
        icon: '◷',
        color: AMBER,
        bg: `${AMBER}18`,
        border: `${AMBER}44`,
      };
  }
}

// ── Rep registry line ──────────────────────────────────────────────────────

function RepLine({ state, name }: { state: RepState; name?: string }) {
  if (state === 'none') {
    return (
      <Text style={[s.repLine, s.repLineMuted]}>No rep on file</Text>
    );
  }
  if (state === 'verified') {
    return (
      <Text style={s.repLine}>
        <Text style={s.repLineMuted}>Rep: </Text>
        <Text style={s.repLineName}>{name}</Text>
        <Text style={s.repLineVerified}> (verified ✓)</Text>
      </Text>
    );
  }
  // unverified-flagged
  return (
    <Text style={s.repLine}>
      <Text style={s.repLineMuted}>Rep: </Text>
      <Text style={s.repLineFlagged}>{name ?? 'unverified'} — flagged</Text>
    </Text>
  );
}

// ── Row component ──────────────────────────────────────────────────────────

function AthleteRow({ athlete }: { athlete: RosterAthlete }) {
  const chip = complianceChip(athlete.compliance);

  return (
    <Pressable
      style={({ pressed }) => [s.row, { opacity: pressed ? 0.75 : 1 }]}
      // Intentional no-op: no athlete-detail surveillance screen (charter)
      onPress={() => {}}
      accessibilityRole="button"
      accessibilityLabel={`${athlete.name} — compliance ${chip.label}`}
    >
      {/* Avatar */}
      <View style={[s.avatar, { backgroundColor: athlete.avatarColor }]}>
        <Text style={s.avatarText}>{athlete.initials}</Text>
      </View>

      {/* Main content */}
      <View style={s.rowBody}>
        <View style={s.nameRow}>
          <Text style={s.athleteName} numberOfLines={1}>{athlete.name}</Text>
          <Text style={s.posChip}>{athlete.position}</Text>
          <Text style={s.classYear}>{athlete.classYear}</Text>
        </View>

        {/* Compliance chip */}
        <View
          style={[
            s.complianceChip,
            { backgroundColor: chip.bg, borderColor: chip.border },
          ]}
        >
          <Text style={s.complianceIcon}>{chip.icon}</Text>
          <Text style={[s.complianceLabel, { color: chip.color }]}>
            {chip.label}
          </Text>
        </View>

        {/* Rep registry */}
        <RepLine state={athlete.rep} name={athlete.repName} />
      </View>
    </Pressable>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────

export interface CoachRosterProps {
  bottomInset?: number;
  topInset?: number;
}

export function CoachRoster({ bottomInset = 0, topInset = 0 }: CoachRosterProps) {
  const flaggedCount = ROSTER_ATHLETES.filter((a) => a.rep === 'unverified-flagged').length;
  const overdueCount = ROSTER_ATHLETES.filter((a) => a.compliance === 'overdue').length;

  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={[
        s.content,
        { paddingTop: topInset + 70, paddingBottom: bottomInset + 40 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header row */}
      <View style={s.headerRow}>
        <Text style={s.headerTitle}>ROSTER · {ROSTER_ATHLETES.length}</Text>
        <View style={s.headerPills}>
          {overdueCount > 0 && (
            <View style={[s.headerPill, { borderColor: `${RED}55`, backgroundColor: `${RED}14` }]}>
              <Text style={[s.headerPillText, { color: RED }]}>
                {overdueCount} overdue
              </Text>
            </View>
          )}
          {flaggedCount > 0 && (
            <View style={[s.headerPill, { borderColor: `${AMBER}55`, backgroundColor: `${AMBER}14` }]}>
              <Text style={[s.headerPillText, { color: AMBER }]}>
                {flaggedCount} rep flagged
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Roster list */}
      {ROSTER_ATHLETES.map((athlete) => (
        <AthleteRow key={athlete.id} athlete={athlete} />
      ))}

      {/* Footer note */}
      <View style={s.footerNote}>
        <Ionicons name="information-circle-outline" size={13} color={MUTED} />
        <Text style={s.footerNoteText}>
          Compliance status is read-only. Tap rows have no action — escalate to NIL Manager for athlete-specific review.
        </Text>
      </View>
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    gap: 8,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    color: 'rgba(255,255,255,0.45)',
  },
  headerPills: {
    flexDirection: 'row',
    gap: 6,
  },
  headerPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  headerPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: CARD_BG,
    borderRadius: 14,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
  },

  // Avatar
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },

  // Body
  rowBody: {
    flex: 1,
    gap: 5,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  athleteName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    flexShrink: 1,
    letterSpacing: -0.2,
  },
  posChip: {
    fontSize: 10,
    fontWeight: '800',
    color: MUTED,
    letterSpacing: 0.4,
  },
  classYear: {
    fontSize: 10,
    fontWeight: '600',
    color: MUTED,
  },

  // Compliance chip
  complianceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  complianceIcon: {
    fontSize: 11,
  },
  complianceLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
  },

  // Rep line
  repLine: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15,
  },
  repLineMuted: {
    color: MUTED,
  },
  repLineName: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  repLineVerified: {
    color: GREEN,
    fontWeight: '600',
  },
  repLineFlagged: {
    color: AMBER,
    fontWeight: '700',
  },

  // Footer note
  footerNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    backgroundColor: 'rgba(255,255,255,0.025)',
  },
  footerNoteText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '500',
    color: MUTED,
    lineHeight: 15,
  },
});
