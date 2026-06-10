// School — Compliance Room. Cross-roster Deal review with SLA timers.
// File 01.5 spec: replaces the Excel sheet on every Athletic Compliance
// Officer's desktop.

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { GlassButton } from '@/components/glass/glass-button';
import { ComplianceRing, type ComplianceRingState } from '@/components/shared/ui-kit';

const TEAL = '#14B8A6';
const ACCENT = '#EB621A';
const YELLOW = '#FFD60A';
const RED = '#FF453A';
const SCHOOL_BLUE = '#3B82F6';

type ComplianceState = 'undisclosed' | 'disclosed' | 'under_review' | 'approved' | 'flagged';

type ComplianceDeal = {
  id: string;
  athleteName: string;
  athleteInitials: string;
  athleteColor: string;
  brand: string;
  sport: string;
  value: string;
  state: ComplianceState;
  daysSince: number;
  slaDays: number; // days remaining
  conflictCluster?: string;
};

const DEALS: ComplianceDeal[] = [
  { id: 'cd-1', athleteName: 'Kiyan Anthony', athleteInitials: 'KA', athleteColor: '#EB621A', brand: 'Nike Hoops', sport: "M Basketball", value: '$220K', state: 'under_review', daysSince: 2, slaDays: 5 },
  { id: 'cd-2', athleteName: 'JJ Starling', athleteInitials: 'JS', athleteColor: '#EB621A', brand: 'Nike', sport: "M Basketball", value: '$85K', state: 'disclosed', daysSince: 4, slaDays: 3, conflictCluster: 'Apparel · multi-athlete' },
  { id: 'cd-3', athleteName: 'Donnie Freeman', athleteInitials: 'DF', athleteColor: '#EB621A', brand: 'Bojangles', sport: "M Basketball", value: '$28K', state: 'approved', daysSince: 12, slaDays: 0 },
  { id: 'cd-4', athleteName: 'Leila Walker', athleteInitials: 'LW', athleteColor: '#461D7C', brand: 'Athletic Brewing', sport: "W Basketball", value: '$34K', state: 'flagged', daysSince: 8, slaDays: -1 },
  { id: 'cd-5', athleteName: 'Marcus Reid', athleteInitials: 'MR', athleteColor: '#34C759', brand: 'EA Sports', sport: 'Football', value: '$17K', state: 'undisclosed', daysSince: 6, slaDays: 1 },
  { id: 'cd-6', athleteName: 'Tyrese Alston', athleteInitials: 'TA', athleteColor: '#7BAFD4', brand: 'Champion', sport: 'Football', value: '$42K', state: 'disclosed', daysSince: 1, slaDays: 6, conflictCluster: 'Apparel · multi-athlete' },
];

const ROSTER_LENS = [
  { id: 'rl-1', name: 'Kiyan Anthony', sport: 'M Basketball', initials: 'KA', color: '#EB621A', activeDeals: 3, score: 96 },
  { id: 'rl-2', name: 'JJ Starling', sport: 'M Basketball', initials: 'JS', color: '#EB621A', activeDeals: 2, score: 84 },
  { id: 'rl-3', name: 'Cooper Flagg', sport: 'M Basketball', initials: 'CF', color: '#001A57', activeDeals: 6, score: 88 },
  { id: 'rl-4', name: 'Leila Walker', sport: 'W Basketball', initials: 'LW', color: '#461D7C', activeDeals: 1, score: 62 },
  { id: 'rl-5', name: 'Donnie Freeman', sport: 'M Basketball', initials: 'DF', color: '#EB621A', activeDeals: 1, score: 100 },
  { id: 'rl-6', name: 'Marcus Reid', sport: 'Football', initials: 'MR', color: '#34C759', activeDeals: 4, score: 72 },
];

function stateMeta(s: ComplianceState): { label: string; color: string } {
  if (s === 'undisclosed') return { label: 'UNDISCLOSED', color: 'rgba(255,255,255,0.5)' };
  if (s === 'disclosed') return { label: 'DISCLOSED', color: SCHOOL_BLUE };
  if (s === 'under_review') return { label: 'IN REVIEW', color: YELLOW };
  if (s === 'approved') return { label: 'APPROVED', color: TEAL };
  return { label: 'FLAGGED', color: RED };
}

// SYNTHETIC 3-track derivation. The local `ComplianceState` here is a
// single per-deal status (`undisclosed | disclosed | under_review |
// approved | flagged`) — not the per-track NCAA/school/ethics triple
// that <ComplianceRing> takes. Until this screen swaps in real per-track
// payload, mirror the deal-level state across all three tracks so the
// ring summary stays faithful to what the row already reads as:
//   undisclosed  → all not-required (no review yet → ring stays muted)
//   disclosed    → all pending      (filed, review not yet started)
//   under_review → all pending      (in flight)
//   approved     → all approved
//   flagged      → all flagged      (warn-tone copper across the ring)
function deriveTrackState(s: ComplianceState): ComplianceRingState {
  if (s === 'approved') return 'approved';
  if (s === 'flagged') return 'flagged';
  if (s === 'under_review' || s === 'disclosed') return 'pending';
  return 'not-required';
}

export default function ComplianceRoomScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Sort by SLA risk (least time first)
  const sorted = [...DEALS].sort((a, b) => a.slaDays - b.slaDays);

  const disclosed = DEALS.filter((d) => d.state !== 'undisclosed').length;
  const totalKnown = DEALS.length;
  const disclosedPct = Math.round((disclosed / totalKnown) * 100);
  const flagged = DEALS.filter((d) => d.state === 'flagged').length;

  const conflicts = DEALS.filter((d) => d.conflictCluster).length;

  return (
    <View style={styles.container}>
      <DarkGradientBg />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Compliance Room</Text>
          <Text style={styles.headerSub}>Syracuse University · 2025-26</Text>
        </View>
        <TouchableOpacity style={styles.backBtn}>
          <Ionicons name="filter" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero ring */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.heroCard}>
          <View style={styles.heroRing}>
            <Text style={styles.heroPct}>{disclosedPct}<Text style={styles.heroPctSign}>%</Text></Text>
            <Text style={styles.heroRingLabel}>disclosed</Text>
          </View>
          <View style={{ flex: 1, gap: 10 }}>
            <View style={styles.heroBreakRow}>
              <Text style={styles.heroBreakLabel}>Total deals</Text>
              <Text style={styles.heroBreakValue}>{totalKnown}</Text>
            </View>
            <View style={styles.heroBreakRow}>
              <Text style={styles.heroBreakLabel}>In review</Text>
              <Text style={styles.heroBreakValue}>{DEALS.filter((d) => d.state === 'under_review').length}</Text>
            </View>
            <View style={styles.heroBreakRow}>
              <Text style={styles.heroBreakLabel}>Flagged</Text>
              <Text style={[styles.heroBreakValue, flagged > 0 && { color: RED }]}>{flagged}</Text>
            </View>
            <View style={styles.heroBreakRow}>
              <Text style={styles.heroBreakLabel}>Conflicts</Text>
              <Text style={[styles.heroBreakValue, conflicts > 0 && { color: YELLOW }]}>{conflicts}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Inbox */}
        <Text style={styles.sectionLabel}>INBOX · SORTED BY SLA RISK</Text>
        <View style={styles.cardGroup}>
          {sorted.map((d, i) => {
            const meta = stateMeta(d.state);
            const overdue = d.slaDays < 0;
            const trackState = deriveTrackState(d.state);
            return (
              <Animated.View
                key={d.id}
                entering={FadeInDown.delay(i * 50).duration(360)}
                style={[styles.dealRow, i < sorted.length - 1 && styles.dealRowBorder]}
              >
                <View style={[styles.athleteAvatar, { backgroundColor: d.athleteColor }]}>
                  <Text style={styles.athleteInitials}>{d.athleteInitials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.dealNameRow}>
                    <Text style={styles.dealName} numberOfLines={1}>{d.athleteName}</Text>
                    <Text style={styles.dealValue}>{d.value}</Text>
                  </View>
                  <Text style={styles.dealMeta} numberOfLines={1}>
                    {d.brand} · {d.sport}
                  </Text>
                  <View style={styles.dealStateRow}>
                    <View style={[styles.statePill, { backgroundColor: `${meta.color}1f`, borderColor: `${meta.color}66` }]}>
                      <Text style={[styles.statePillText, { color: meta.color }]}>{meta.label}</Text>
                    </View>
                    {!['approved'].includes(d.state) && (
                      <View style={[styles.slaPill, overdue && styles.slaOverdue]}>
                        <Ionicons name="time-outline" size={10} color={overdue ? RED : 'rgba(255,255,255,0.7)'} />
                        <Text style={[styles.slaText, overdue && { color: RED }]}>
                          {overdue ? `${Math.abs(d.slaDays)}d overdue` : `${d.slaDays}d left`}
                        </Text>
                      </View>
                    )}
                    {d.conflictCluster && (
                      <View style={styles.conflictPill}>
                        <Ionicons name="warning-outline" size={10} color={YELLOW} />
                        <Text style={styles.conflictText}>conflict</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.dealRing}>
                  <ComplianceRing
                    ncaa={trackState}
                    school={trackState}
                    ethics={trackState}
                    size={36}
                    hideLabel
                  />
                </View>
              </Animated.View>
            );
          })}
        </View>

        {/* Roster lens */}
        <Text style={styles.sectionLabel}>ROSTER LENS</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rosterRow}>
          {ROSTER_LENS.map((p) => (
            <Pressable key={p.id} style={styles.rosterCard}>
              <View style={[styles.rosterAvatar, { backgroundColor: p.color }]}>
                <Text style={styles.rosterInitials}>{p.initials}</Text>
              </View>
              <Text style={styles.rosterName} numberOfLines={1}>{p.name.split(' ').pop()}</Text>
              <Text style={styles.rosterMeta}>{p.activeDeals} deals</Text>
              <View style={styles.scoreBadge}>
                <Text style={[styles.scoreText, p.score < 70 && { color: RED }, p.score >= 95 && { color: TEAL }]}>{p.score}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>

        {/* Audit log preview */}
        <Text style={styles.sectionLabel}>AUDIT LOG · LAST 7 DAYS</Text>
        <View style={styles.cardGroup}>
          {[
            { id: 'a-1', when: '2h ago', actor: 'L. Whitcombe', text: 'Approved Donnie Freeman → Bojangles deal' },
            { id: 'a-2', when: 'Yesterday', actor: 'L. Whitcombe', text: 'Flagged Leila Walker → Athletic Brewing (alcohol category)' },
            { id: 'a-3', when: '3 days ago', actor: 'System', text: 'Disclosure SLA expiring on 4 deals' },
            { id: 'a-4', when: '5 days ago', actor: 'L. Whitcombe', text: 'Updated NIL policy v2.4 · roster blast sent' },
          ].map((e, i, arr) => (
            <View key={e.id} style={[styles.auditRow, i < arr.length - 1 && styles.dealRowBorder]}>
              <View style={styles.auditDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.auditText}>{e.text}</Text>
                <Text style={styles.auditMeta}>{e.actor} · {e.when}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
          <GlassButton label="Export disclosed deals to NCAA portal" onPress={() => undefined} fullWidth />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 8 },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 },

  content: { paddingTop: 8 },

  heroCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  heroRing: {
    width: 88, height: 88, borderRadius: 44,
    borderWidth: 4, borderColor: TEAL,
    alignItems: 'center', justifyContent: 'center',
  },
  heroPct: { fontSize: 26, fontWeight: '900', color: '#FFF', letterSpacing: -0.6 },
  heroPctSign: { fontSize: 14, color: 'rgba(255,255,255,0.6)' },
  heroRingLabel: { fontSize: 9, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: -2 },
  heroBreakRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroBreakLabel: { fontSize: 11, color: 'rgba(255,255,255,0.55)' },
  heroBreakValue: { fontSize: 13, color: '#FFF', fontWeight: '800' },

  sectionLabel: {
    fontSize: 11, fontWeight: '800', letterSpacing: 1.2,
    color: 'rgba(255,255,255,0.55)',
    paddingHorizontal: 20, marginTop: 18, marginBottom: 8,
  },

  cardGroup: {
    marginHorizontal: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  dealRow: { flexDirection: 'row', gap: 12, padding: 14, alignItems: 'center' },
  dealRing: { alignItems: 'center', justifyContent: 'center' },
  dealRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.06)' },
  athleteAvatar: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  athleteInitials: { fontSize: 13, fontWeight: '900', color: '#FFF' },
  dealNameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dealName: { fontSize: 14, color: '#FFF', fontWeight: '700', flex: 1 },
  dealValue: { fontSize: 12, color: '#FFF', fontWeight: '800' },
  dealMeta: { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 },

  dealStateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  statePill: {
    paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 4, borderWidth: StyleSheet.hairlineWidth,
  },
  statePillText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.6 },
  slaPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  slaOverdue: { backgroundColor: 'rgba(255,69,58,0.12)' },
  slaText: { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.8)' },
  conflictPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: 'rgba(255,214,10,0.12)',
  },
  conflictText: { fontSize: 9, fontWeight: '700', color: YELLOW, textTransform: 'uppercase' },

  rosterRow: { paddingHorizontal: 16, gap: 10 },
  rosterCard: { width: 84, alignItems: 'center', gap: 4 },
  rosterAvatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  rosterInitials: { fontSize: 16, fontWeight: '900', color: '#FFF' },
  rosterName: { fontSize: 12, color: '#FFF', fontWeight: '700' },
  rosterMeta: { fontSize: 10, color: 'rgba(255,255,255,0.5)' },
  scoreBadge: {
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    minWidth: 30, alignItems: 'center',
  },
  scoreText: { fontSize: 11, fontWeight: '900', color: '#FFF' },

  auditRow: { flexDirection: 'row', gap: 12, padding: 14, alignItems: 'flex-start' },
  auditDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)', marginTop: 6 },
  auditText: { fontSize: 12, color: '#FFF', fontWeight: '600' },
  auditMeta: { fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
});
