// components/school/school-vault.tsx
// ── SCHOOL / AD VAULT TAB ────────────────────────────────────────────────
// Charter §A — Vault tab, two modules:
//   1. EVIDENCE VAULT — per-athlete immutable timeline cards + EXPORT CASE FILE ghost
//   2. TITLE IX LENS — aggregate deal split by program type (banded)
// Muted footer: raw dollar amounts never held by the school.
// No animations (charter law). Tabular numerals throughout.

import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import {
  Alert,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  ACCENT,
  HAIRLINE,
  HAIRLINE_SUBTLE,
  RADIUS_CARD,
  RADIUS_LG,
  RADIUS_PILL,
  RADIUS_SM,
  SIGNAL_POSITIVE,
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

// ── Module helpers ─────────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return (
    <View style={s.sectionHeader}>
      <View style={s.sectionBar} />
      <Text style={s.sectionLabel}>{label}</Text>
    </View>
  );
}

// ── MODULE 1: EVIDENCE VAULT ──────────────────────────────────────────────

type TimelineEvent = {
  label: string;
  date: string;
  terminal?: boolean;
};

type CaseCard = {
  id: string;
  athleteName: string;
  events: TimelineEvent[];
};

const CASE_CARDS: CaseCard[] = [
  {
    id: 'cc-1',
    athleteName: 'Kiyan Anthony',
    events: [
      { label: 'deal logged',          date: 'Jun 2'  },
      { label: 'NIL Go receipt',        date: 'Jun 4'  },
      { label: 'cleared',              date: 'Jun 5'  },
      { label: 'paid-state confirmed', date: 'Jun 9', terminal: true },
    ],
  },
  {
    id: 'cc-2',
    athleteName: 'Jordan Miles',
    events: [
      { label: 'deal logged',          date: 'May 28' },
      { label: 'NIL Go receipt',        date: 'May 30' },
      { label: 'cleared',              date: 'Jun 1'  },
      { label: 'paid-state confirmed', date: 'Jun 6', terminal: true },
    ],
  },
  {
    id: 'cc-3',
    athleteName: 'Marcus Reid',
    events: [
      { label: 'deal logged',   date: 'Jun 3'  },
      { label: 'NIL Go receipt', date: 'Jun 5'  },
      { label: 'in review',     date: 'Jun 7'  },
      { label: 'cleared',       date: 'Jun 9', terminal: true },
    ],
  },
];

function TimelineDot({ terminal }: { terminal?: boolean }) {
  return (
    <View style={[s.dot, terminal && s.dotTerminal]} />
  );
}

function CaseCardView({ card }: { card: CaseCard }) {
  const initials = card.athleteName.split(' ').map((p) => p[0]).join('');
  return (
    <View style={s.caseCard}>
      {/* Athlete header */}
      <View style={s.caseCardHeader}>
        {/* Avatar — demoted from copper bg/border to neutral SURFACE_SUBTLE */}
        <View style={s.caseAvatar}>
          <Text style={s.caseAvatarText}>{initials}</Text>
        </View>
        <Text style={s.caseAthleteLabel}>{card.athleteName}</Text>
      </View>

      {/* Immutable timeline */}
      <View style={s.timeline}>
        {card.events.map((ev, idx) => {
          const isLast = idx === card.events.length - 1;
          return (
            <View key={ev.label} style={s.timelineRow}>
              {/* Connector line */}
              <View style={s.timelineLeft}>
                <TimelineDot terminal={ev.terminal} />
                {!isLast && <View style={s.timelineLine} />}
              </View>
              {/* Label + date */}
              <View style={s.timelineRight}>
                <Text style={s.timelineLabel}>{ev.label}</Text>
                <Text style={s.timelineDate}>{ev.date}</Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Export ghost CTA — primary act-now affordance, keeps ACCENT */}
      <Pressable
        style={({ pressed }) => [s.ghostBtn, { opacity: pressed ? 0.65 : 1 }]}
        onPress={() =>
          Alert.alert(
            'Case File Export (DEMO)',
            'CSC inquiry response assembled — same-day, not 2.5 weeks. (DEMO)',
          )
        }
        accessibilityRole="button"
        accessibilityLabel={`Export case file for ${card.athleteName}`}
      >
        <Ionicons name="folder-outline" size={13} color={ACCENT} />
        <Text style={s.ghostBtnText}>EXPORT CASE FILE</Text>
      </Pressable>
    </View>
  );
}

function EvidenceVaultModule() {
  return (
    <View style={s.card}>
      <SectionHeader label="EVIDENCE VAULT" />
      {CASE_CARDS.map((card) => (
        <CaseCardView key={card.id} card={card} />
      ))}
    </View>
  );
}

// ── MODULE 2: TITLE IX LENS ────────────────────────────────────────────────

function TitleIxLensModule() {
  return (
    <View style={s.card}>
      <SectionHeader label="TITLE IX LENS" />
      <Text style={s.lensIntro}>Third-party deal activity (aggregates only)</Text>

      <View style={s.lensRow}>
        {/* Women's bar — uses purple identity (not copper) */}
        <View style={s.lensBarWrap}>
          <View style={[s.lensBar, { width: '46%', backgroundColor: '#AF52DE' }]} />
        </View>
        <Text style={s.lensBarLabel}>Women's programs</Text>
        <Text style={s.lensBarValue}>46%</Text>
      </View>

      <View style={s.lensRow}>
        {/* Men's bar — data viz bar, demoted from COPPER to TEXT_TERTIARY (neutral) */}
        <View style={s.lensBarWrap}>
          <View style={[s.lensBar, { width: '54%', backgroundColor: TEXT_TERTIARY }]} />
        </View>
        <Text style={s.lensBarLabel}>Men's programs</Text>
        <Text style={s.lensBarValue}>54%</Text>
      </View>

      <View style={s.lensNoteRow}>
        <Ionicons name="checkmark-circle" size={13} color={SIGNAL_POSITIVE} />
        <Text style={s.lensNote}>Gap within conference norms</Text>
      </View>
    </View>
  );
}

// ── MUTED FOOTER ───────────────────────────────────────────────────────────

function VaultFooter() {
  return (
    <View style={s.footerRow}>
      <Ionicons name="lock-closed-outline" size={12} color={TEXT_TERTIARY} />
      <Text style={s.footerText}>
        Dollar amounts are banded. Raw figures require athlete consent or statutory compulsion — what the school never holds can't be FOIA'd from it.
      </Text>
    </View>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────

export interface SchoolVaultProps {
  bottomInset?: number;
  topInset?: number;
  onScroll?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

export function SchoolVault({ bottomInset = 0, topInset = 0, onScroll }: SchoolVaultProps) {
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
      <EvidenceVaultModule />
      <TitleIxLensModule />
      <VaultFooter />
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
    gap: SP_MD,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
  },

  // Section header
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

  // ── Module 1: Evidence Vault ─────────────────────────────
  caseCard: {
    backgroundColor: SURFACE_SUBTLE,
    borderRadius: RADIUS_CARD,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
    padding: SP_MD,
    gap: SP_SM,
  },
  caseCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP_SM,
  },
  // Avatar — demoted from copper bg/border to neutral SURFACE_SUBTLE
  caseAvatar: {
    width: 32,
    height: 32,
    borderRadius: RADIUS_PILL,
    backgroundColor: SURFACE_SUBTLE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caseAvatarText: {
    fontSize: TEXT.caption,
    fontWeight: WEIGHT.bold,
    color: TEXT_SECONDARY,
    letterSpacing: -0.2,
  },
  caseAthleteLabel: {
    fontSize: TEXT.body,
    fontWeight: WEIGHT.bold,
    color: TEXT_PRIMARY,
  },

  // Timeline
  timeline: {
    gap: 0,
    paddingLeft: SP_XS,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: SP_SM,
    minHeight: 28,
  },
  timelineLeft: {
    alignItems: 'center',
    width: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: TEXT_TERTIARY,
    marginTop: 3,
    flexShrink: 0,
  },
  dotTerminal: {
    backgroundColor: SIGNAL_POSITIVE,
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 2,
  },
  timelineLine: {
    flex: 1,
    width: 1,
    backgroundColor: HAIRLINE,
    marginTop: 2,
  },
  timelineRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: SP_SM,
  },
  timelineLabel: {
    fontSize: TEXT.caption,
    fontWeight: WEIGHT.semibold,
    color: TEXT_SECONDARY,
    fontVariant: ['tabular-nums'],
  },
  timelineDate: {
    fontSize: TEXT.caption,
    fontWeight: WEIGHT.medium,
    color: TEXT_TERTIARY,
    fontVariant: ['tabular-nums'],
  },

  // Ghost button (per-card export) — primary act-now affordance, ACCENT kept
  ghostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: RADIUS_SM,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${ACCENT}55`,
    backgroundColor: `${ACCENT}10`,
  },
  ghostBtnText: {
    fontSize: TEXT.caption,
    fontWeight: WEIGHT.bold,
    color: ACCENT,
    letterSpacing: 0.6,
  },

  // ── Module 2: Title IX Lens ──────────────────────────────
  lensIntro: {
    fontSize: TEXT.caption,
    fontWeight: WEIGHT.semibold,
    color: TEXT_SECONDARY,
    marginBottom: 2,
  },
  lensRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP_SM,
  },
  lensBarWrap: {
    flex: 1,
    height: 6,
    backgroundColor: SURFACE_SUBTLE,
    borderRadius: 3,
    overflow: 'hidden',
  },
  lensBar: {
    height: '100%',
    borderRadius: 3,
  },
  lensBarLabel: {
    fontSize: TEXT.caption,
    fontWeight: WEIGHT.semibold,
    color: TEXT_SECONDARY,
    minWidth: 110,
  },
  lensBarValue: {
    fontSize: TEXT.body,
    fontWeight: WEIGHT.bold,
    color: TEXT_PRIMARY,
    fontVariant: ['tabular-nums'],
    minWidth: 36,
    textAlign: 'right',
  },
  lensNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  lensNote: {
    fontSize: TEXT.caption,
    fontWeight: WEIGHT.semibold,
    color: SIGNAL_POSITIVE,
  },

  // ── Vault footer ─────────────────────────────────────────
  footerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    paddingHorizontal: SP_MD,
    paddingVertical: 11,
    borderRadius: RADIUS_CARD,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE_SUBTLE,
    backgroundColor: SURFACE_SUBTLE,
  },
  footerText: {
    flex: 1,
    fontSize: TEXT.caption,
    fontWeight: WEIGHT.medium,
    color: TEXT_TERTIARY,
    lineHeight: 15,
  },
});
