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
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  HAIRLINE,
  HAIRLINE_SUBTLE,
  RADIUS_CARD,
  RADIUS_SM,
  SIGNAL_NEGATIVE,
  SIGNAL_POSITIVE,
  SIGNAL_WARN,
  SP_LG,
  SP_MD,
  SP_SM,
  SP_XS,
  SURFACE,
  SURFACE_SUBTLE,
  TEXT,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_TERTIARY,
  WEIGHT,
} from '@/components/shared/ui-kit/tokens';

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
        color: SIGNAL_POSITIVE,
        bg: `${SIGNAL_POSITIVE}18`,
        border: `${SIGNAL_POSITIVE}44`,
      };
    case 'overdue':
      return {
        label: 'DISCLOSURE OVERDUE',
        icon: '⚠',
        color: SIGNAL_NEGATIVE,
        bg: `${SIGNAL_NEGATIVE}18`,
        border: `${SIGNAL_NEGATIVE}44`,
      };
    case 'in-review':
      return {
        label: 'IN REVIEW',
        icon: '◷',
        color: SIGNAL_WARN,
        bg: `${SIGNAL_WARN}18`,
        border: `${SIGNAL_WARN}44`,
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
  onScroll?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

export function CoachRoster({ bottomInset = 0, topInset = 0, onScroll }: CoachRosterProps) {
  const flaggedCount = ROSTER_ATHLETES.filter((a) => a.rep === 'unverified-flagged').length;
  const overdueCount = ROSTER_ATHLETES.filter((a) => a.compliance === 'overdue').length;

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
      {/* Header row */}
      <View style={s.headerRow}>
        <Text style={s.headerTitle}>ROSTER · {ROSTER_ATHLETES.length}</Text>
        <View style={s.headerPills}>
          {overdueCount > 0 && (
            <View style={[s.headerPill, { borderColor: `${SIGNAL_NEGATIVE}55`, backgroundColor: `${SIGNAL_NEGATIVE}14` }]}>
              <Text style={[s.headerPillText, { color: SIGNAL_NEGATIVE }]}>
                {overdueCount} overdue
              </Text>
            </View>
          )}
          {flaggedCount > 0 && (
            <View style={[s.headerPill, { borderColor: `${SIGNAL_WARN}55`, backgroundColor: `${SIGNAL_WARN}14` }]}>
              <Text style={[s.headerPillText, { color: SIGNAL_WARN }]}>
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
        <Ionicons name="information-circle-outline" size={13} color={TEXT_TERTIARY} />
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
    paddingHorizontal: SP_LG,
    gap: SP_SM,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SP_XS,
  },
  headerTitle: {
    fontSize: TEXT.caption,
    fontWeight: WEIGHT.bold,
    letterSpacing: 1.2,
    color: TEXT_TERTIARY,
  },
  headerPills: {
    flexDirection: 'row',
    gap: 6,
  },
  headerPill: {
    paddingHorizontal: SP_SM,
    paddingVertical: 3,
    borderRadius: RADIUS_SM,
    borderWidth: StyleSheet.hairlineWidth,
  },
  headerPillText: {
    fontSize: TEXT.caption,
    fontWeight: WEIGHT.bold,
    letterSpacing: 0.3,
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SP_MD,
    backgroundColor: SURFACE,
    borderRadius: RADIUS_CARD,
    padding: SP_MD,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
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
    fontSize: TEXT.label,
    fontWeight: WEIGHT.bold,
    color: TEXT_PRIMARY,
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
    fontSize: TEXT.body,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    flexShrink: 1,
    letterSpacing: -0.2,
  },
  posChip: {
    fontSize: TEXT.caption,
    fontWeight: WEIGHT.bold,
    color: TEXT_SECONDARY,
    letterSpacing: 0.4,
  },
  classYear: {
    fontSize: TEXT.caption,
    fontWeight: WEIGHT.semibold,
    color: TEXT_SECONDARY,
  },

  // Compliance chip
  complianceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP_XS,
    alignSelf: 'flex-start',
    paddingHorizontal: SP_SM,
    paddingVertical: 3,
    borderRadius: RADIUS_SM,
    borderWidth: StyleSheet.hairlineWidth,
  },
  complianceIcon: {
    fontSize: 11,
  },
  complianceLabel: {
    fontSize: TEXT.caption,
    fontWeight: WEIGHT.bold,
    letterSpacing: 0.4,
  },

  // Rep line
  repLine: {
    fontSize: 11,
    fontWeight: WEIGHT.medium,
    lineHeight: 15,
  },
  repLineMuted: {
    color: TEXT_SECONDARY,
  },
  repLineName: {
    color: TEXT_PRIMARY,
    fontWeight: '700',
  },
  repLineVerified: {
    color: SIGNAL_POSITIVE,
    fontWeight: WEIGHT.semibold,
  },
  repLineFlagged: {
    color: SIGNAL_WARN,
    fontWeight: '700',
  },

  // Footer note
  footerNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    marginTop: 6,
    paddingHorizontal: SP_MD,
    paddingVertical: SP_SM,
    borderRadius: RADIUS_CARD,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE_SUBTLE,
    backgroundColor: SURFACE_SUBTLE,
  },
  footerNoteText: {
    flex: 1,
    fontSize: 11,
    fontWeight: WEIGHT.medium,
    color: TEXT_SECONDARY,
    lineHeight: 15,
  },
});
