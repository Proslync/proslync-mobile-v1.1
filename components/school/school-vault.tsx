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

// ── Charter constants ──────────────────────────────────────────────────────
const COPPER = '#EB621A';
const CARD_BG = '#1C1C1E';
const CARD_BORDER = 'rgba(255,255,255,0.07)';
const MUTED = 'rgba(255,255,255,0.50)';
const GREEN = '#34C759';

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
  return (
    <View style={s.caseCard}>
      {/* Athlete header */}
      <View style={s.caseCardHeader}>
        <View style={s.caseAvatar}>
          <Text style={s.caseAvatarText}>
            {card.athleteName.split(' ').map((p) => p[0]).join('')}
          </Text>
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

      {/* Export ghost CTA */}
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
        <Ionicons name="folder-outline" size={13} color={COPPER} />
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
        {/* Women's bar */}
        <View style={s.lensBarWrap}>
          <View style={[s.lensBar, { width: '46%', backgroundColor: '#AF52DE' }]} />
        </View>
        <Text style={s.lensBarLabel}>Women's programs</Text>
        <Text style={s.lensBarValue}>46%</Text>
      </View>

      <View style={s.lensRow}>
        {/* Men's bar */}
        <View style={s.lensBarWrap}>
          <View style={[s.lensBar, { width: '54%', backgroundColor: COPPER }]} />
        </View>
        <Text style={s.lensBarLabel}>Men's programs</Text>
        <Text style={s.lensBarValue}>54%</Text>
      </View>

      <View style={s.lensNoteRow}>
        <Ionicons name="checkmark-circle" size={13} color={GREEN} />
        <Text style={s.lensNote}>Gap within conference norms</Text>
      </View>
    </View>
  );
}

// ── MUTED FOOTER ───────────────────────────────────────────────────────────

function VaultFooter() {
  return (
    <View style={s.footerRow}>
      <Ionicons name="lock-closed-outline" size={12} color={MUTED} />
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
        { paddingTop: topInset + 16, paddingBottom: bottomInset + 120 },
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
    paddingHorizontal: 16,
    gap: 14,
  },

  // Card container
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 18,
    padding: 16,
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
  },

  // Section header
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

  // ── Module 1: Evidence Vault ─────────────────────────────
  caseCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 13,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    padding: 12,
    gap: 10,
  },
  caseCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  caseAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${COPPER}28`,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${COPPER}55`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caseAvatarText: {
    fontSize: 11,
    fontWeight: '900',
    color: COPPER,
    letterSpacing: -0.2,
  },
  caseAthleteLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Timeline
  timeline: {
    gap: 0,
    paddingLeft: 4,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 10,
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
    backgroundColor: MUTED,
    marginTop: 3,
    flexShrink: 0,
  },
  dotTerminal: {
    backgroundColor: GREEN,
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 2,
  },
  timelineLine: {
    flex: 1,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.10)',
    marginTop: 2,
  },
  timelineRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  timelineLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.80)',
    fontVariant: ['tabular-nums'],
  },
  timelineDate: {
    fontSize: 11,
    fontWeight: '500',
    color: MUTED,
    fontVariant: ['tabular-nums'],
  },

  // Ghost button (per-card export)
  ghostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: `${COPPER}55`,
    backgroundColor: `${COPPER}10`,
  },
  ghostBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: COPPER,
    letterSpacing: 0.6,
  },

  // ── Module 2: Title IX Lens ──────────────────────────────
  lensIntro: {
    fontSize: 12,
    fontWeight: '600',
    color: MUTED,
    marginBottom: 2,
  },
  lensRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  lensBarWrap: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  lensBar: {
    height: '100%',
    borderRadius: 3,
  },
  lensBarLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
    minWidth: 110,
  },
  lensBarValue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
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
    fontSize: 12,
    fontWeight: '600',
    color: GREEN,
  },

  // ── Vault footer ─────────────────────────────────────────
  footerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    backgroundColor: 'rgba(255,255,255,0.025)',
  },
  footerText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '500',
    color: MUTED,
    lineHeight: 15,
  },
});
