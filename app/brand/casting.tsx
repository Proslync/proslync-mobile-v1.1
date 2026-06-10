// Brand — Casting. Filter-driven athlete search with fit score + warm chain.
// File 01.4 spec: brand-only motion to spin a paid casting brief.

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
import {
  BRAND_ATHLETES,
  BRAND_PROFILE,
  type Athlete,
} from '@/lib/data/mock-brand-data';

const TEAL = '#14B8A6';
const ACCENT = '#EB621A';
const YELLOW = '#FFD60A';

// Mock graph-warmth: athletes already linked to brand network or repped athletes.
const WARM_IDS = new Set(['a-1', 'a-3', 'a-4']); // Kiyan, Cooper, JJ

export default function CastingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [shortlist, setShortlist] = React.useState<Set<string>>(new Set());

  const sorted = React.useMemo(
    () => [...BRAND_ATHLETES].sort((a, b) => b.fitScore - a.fitScore),
    [],
  );

  const totalBudget = '$450K';
  const slots = 12;

  const toggle = (id: string) => {
    setShortlist((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <View style={styles.container}>
      <DarkGradientBg />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Casting</Text>
          <Text style={styles.headerSub}>{BRAND_PROFILE.name}</Text>
        </View>
        <TouchableOpacity style={styles.backBtn}>
          <Ionicons name="add" size={26} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 140 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Brief summary */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.briefCard}>
          <View style={styles.briefHead}>
            <Text style={styles.briefTitle}>FY26 ACC Hoops Capsule</Text>
            <View style={styles.briefStatusPill}>
              <View style={styles.briefStatusDot} />
              <Text style={styles.briefStatusText}>DRAFTING</Text>
            </View>
          </View>
          <View style={styles.briefChipsRow}>
            <BriefChip label="Basketball" />
            <BriefChip label="ACC + Big East" />
            <BriefChip label="≥ 100K followers" />
            <BriefChip label="Lifestyle + in-game" />
          </View>
          <View style={styles.briefStatsRow}>
            <View style={styles.briefStat}>
              <Text style={styles.briefStatValue}>{sorted.length}</Text>
              <Text style={styles.briefStatLabel}>Athletes match</Text>
            </View>
            <View style={styles.briefStatDivider} />
            <View style={styles.briefStat}>
              <Text style={styles.briefStatValue}>{slots}</Text>
              <Text style={styles.briefStatLabel}>Slots</Text>
            </View>
            <View style={styles.briefStatDivider} />
            <View style={styles.briefStat}>
              <Text style={styles.briefStatValue}>{totalBudget}</Text>
              <Text style={styles.briefStatLabel}>Budget</Text>
            </View>
          </View>
        </Animated.View>

        {/* Filter chips row (collapsed editor) */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsRow}>
          <FilterChip label="Sport" />
          <FilterChip label="Region" />
          <FilterChip label="Followers" />
          <FilterChip label="Age band" />
          <FilterChip label="Style" />
          <FilterChip label="Per-athlete $" />
        </ScrollView>

        {/* Results */}
        <View style={styles.resultsHeaderRow}>
          <Text style={styles.sectionLabel}>RANKED RESULTS</Text>
          <Text style={styles.sortLabel}>by Fit Score</Text>
        </View>
        <View style={styles.cardGroup}>
          {sorted.map((a, i) => (
            <Animated.View
              key={a.id}
              entering={FadeInDown.delay(i * 60).duration(380)}
              style={[styles.athleteRow, i < sorted.length - 1 && styles.athleteRowBorder]}
            >
              <AthleteCard
                athlete={a}
                warm={WARM_IDS.has(a.id)}
                shortlisted={shortlist.has(a.id)}
                onShortlist={() => toggle(a.id)}
              />
            </Animated.View>
          ))}
        </View>
      </ScrollView>

      {/* Shortlist drawer */}
      {shortlist.size > 0 && (
        <View style={[styles.shortlistBar, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.shortlistInner}>
            <Text style={styles.shortlistText}>
              <Text style={styles.shortlistCount}>{shortlist.size}</Text> shortlisted
            </Text>
            <GlassButton
              label={`Send brief to ${shortlist.size}`}
              onPress={() => undefined}
            />
          </View>
        </View>
      )}
    </View>
  );
}

function BriefChip({ label }: { label: string }) {
  return (
    <View style={styles.briefChip}>
      <Text style={styles.briefChipText}>{label}</Text>
    </View>
  );
}

function FilterChip({ label }: { label: string }) {
  return (
    <Pressable style={styles.filterChip}>
      <Text style={styles.filterChipText}>{label}</Text>
      <Ionicons name="chevron-down" size={11} color="rgba(255,255,255,0.7)" />
    </Pressable>
  );
}

function AthleteCard({
  athlete,
  warm,
  shortlisted,
  onShortlist,
}: {
  athlete: Athlete;
  warm: boolean;
  shortlisted: boolean;
  onShortlist: () => void;
}) {
  return (
    <View style={styles.athleteCardInner}>
      <View style={styles.athleteAvatar}>
        <Text style={styles.athleteInitials}>{athlete.initials}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.athleteNameRow}>
          <Text style={styles.athleteName}>{athlete.name}</Text>
          {warm && (
            <View style={styles.warmBadge}>
              <Ionicons name="flame" size={9} color={YELLOW} />
              <Text style={styles.warmBadgeText}>WARM</Text>
            </View>
          )}
          {athlete.signed && (
            <View style={styles.signedDot} />
          )}
        </View>
        <Text style={styles.athleteMeta}>
          {athlete.school} · {athlete.position} · {athlete.rank}
        </Text>
        <View style={styles.athleteStatsRow}>
          <Text style={styles.athleteFollowers}>{athlete.followers}</Text>
          <Text style={styles.athleteDot}>·</Text>
          <Text style={styles.athleteEng}>6.4% ER</Text>
          {athlete.contract && (
            <>
              <Text style={styles.athleteDot}>·</Text>
              <Text style={styles.athleteContract}>{athlete.contract}</Text>
            </>
          )}
        </View>
      </View>
      <View style={{ alignItems: 'center', gap: 8 }}>
        <View style={[styles.fitPill, athlete.fitScore >= 90 && styles.fitPillHi]}>
          <Text style={[styles.fitScore, athlete.fitScore >= 90 && { color: TEAL }]}>{athlete.fitScore}</Text>
          <Text style={styles.fitLabel}>FIT</Text>
        </View>
        <Pressable
          onPress={onShortlist}
          style={[styles.shortlistBtn, shortlisted && styles.shortlistBtnActive]}
        >
          <Ionicons
            name={shortlisted ? 'star' : 'star-outline'}
            size={14}
            color={shortlisted ? YELLOW : 'rgba(255,255,255,0.7)'}
          />
        </Pressable>
      </View>
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

  briefCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 14,
  },
  briefHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  briefTitle: { fontSize: 17, fontWeight: '800', color: '#FFF' },
  briefStatusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,214,10,0.12)',
  },
  briefStatusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: YELLOW },
  briefStatusText: { fontSize: 9, fontWeight: '900', color: YELLOW, letterSpacing: 0.6 },

  briefChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  briefChip: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.1)',
  },
  briefChipText: { fontSize: 11, color: '#FFF', fontWeight: '600' },

  briefStatsRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 4 },
  briefStat: { flex: 1, alignItems: 'center', gap: 2 },
  briefStatDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.08)' },
  briefStatValue: { fontSize: 18, fontWeight: '900', color: '#FFF' },
  briefStatLabel: { fontSize: 10, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: 0.6 },

  filterChipsRow: { paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.1)',
  },
  filterChipText: { fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },

  resultsHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, marginTop: 10 },
  sectionLabel: {
    fontSize: 11, fontWeight: '800', letterSpacing: 1.2,
    color: 'rgba(255,255,255,0.55)',
    paddingHorizontal: 16, marginBottom: 8,
  },
  sortLabel: {
    fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: '600',
    paddingHorizontal: 16,
  },

  cardGroup: {
    marginHorizontal: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  athleteRow: {},
  athleteRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.06)' },
  athleteCardInner: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  athleteAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.18)',
  },
  athleteInitials: { fontSize: 16, fontWeight: '900', color: '#FFF' },
  athleteNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  athleteName: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  signedDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: TEAL },
  warmBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(255,214,10,0.16)',
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,214,10,0.4)',
  },
  warmBadgeText: { fontSize: 8, fontWeight: '900', color: YELLOW, letterSpacing: 0.4 },
  athleteMeta: { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  athleteStatsRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4, flexWrap: 'wrap' },
  athleteFollowers: { fontSize: 11, color: '#FFF', fontWeight: '700' },
  athleteEng: { fontSize: 10, color: 'rgba(255,255,255,0.6)' },
  athleteContract: { fontSize: 10, color: TEAL, fontWeight: '600' },
  athleteDot: { fontSize: 11, color: 'rgba(255,255,255,0.3)' },

  fitPill: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    minWidth: 44,
  },
  fitPillHi: {
    borderColor: 'rgba(20,184,166,0.5)',
    backgroundColor: 'rgba(20,184,166,0.08)',
  },
  fitScore: { fontSize: 16, fontWeight: '900', color: '#FFF' },
  fitLabel: { fontSize: 8, fontWeight: '900', letterSpacing: 0.6, color: 'rgba(255,255,255,0.5)' },

  shortlistBtn: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.12)',
  },
  shortlistBtnActive: {
    backgroundColor: 'rgba(255,214,10,0.16)',
    borderColor: 'rgba(255,214,10,0.4)',
  },

  shortlistBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.92)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 12,
  },
  shortlistInner: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  shortlistText: { fontSize: 13, color: '#FFF', fontWeight: '600' },
  shortlistCount: { fontSize: 18, fontWeight: '900', color: YELLOW },
});
