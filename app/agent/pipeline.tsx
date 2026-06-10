// Agent — Pipeline. Kanban over Deal stages plus athlete-coverage strip.
// File 01.3 spec: agent's portfolio-shaped workspace.

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as React from 'react';
import {
  Image,
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
import { EmptyDealsState } from '@/components/shared/ui-kit';
import {
  AGENT_ATHLETES,
  AGENT_DEALS,
  AGENT_INSIGHTS,
  type AgentDeal,
} from '@/lib/data/mock-agent-data';

const ACCENT = '#EB621A';
const TEAL = '#14B8A6';
const YELLOW = '#FFD60A';

const STAGES: { key: AgentDeal['stage']; label: string; color: string }[] = [
  { key: 'draft', label: 'Drafting', color: 'rgba(255,255,255,0.4)' },
  { key: 'sent', label: 'Sent', color: '#3B82F6' },
  { key: 'negotiation', label: 'Negotiation', color: ACCENT },
  { key: 'signed', label: 'Signed', color: TEAL },
  { key: 'live', label: 'Live', color: TEAL },
];

const COLUMN_WIDTH = 280;

export default function AgentPipelineScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const stalledCount = AGENT_DEALS.filter(
    (d) => d.due.toLowerCase().includes('overdue') || d.due.toLowerCase().includes('week'),
  ).length;
  const totalAthletes = AGENT_ATHLETES.length;

  return (
    <View style={styles.container}>
      <DarkGradientBg />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Pipeline</Text>
          <Text style={styles.headerSub}>Hayes Sports Group</Text>
        </View>
        <TouchableOpacity style={styles.backBtn}>
          <Ionicons name="search" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero summary */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.heroCard}>
          <View style={styles.heroRow}>
            <View style={styles.heroStat}>
              <Text style={styles.heroValue}>{AGENT_INSIGHTS.totalVolume}</Text>
              <Text style={styles.heroLabel}>YTD volume</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroValue}>{AGENT_INSIGHTS.conversionRate}</Text>
              <Text style={styles.heroLabel}>Close rate</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStat}>
              <Text style={[styles.heroValue, { color: stalledCount ? YELLOW : '#FFF' }]}>
                {stalledCount}
              </Text>
              <Text style={styles.heroLabel}>Stalled</Text>
            </View>
          </View>
        </Animated.View>

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          <FilterChip label="All athletes" active />
          <FilterChip label={`${totalAthletes} signed`} />
          <FilterChip label="Basketball" />
          <FilterChip label="Football" />
          <FilterChip label="Soccer" />
          <FilterChip label=">$100k" />
        </ScrollView>

        {/* Kanban */}
        {AGENT_DEALS.length === 0 ? (
          <EmptyDealsState
            role="agent"
            cta={{
              label: 'Log a campaign',
              onPress: () =>
                router.push({
                  pathname: '/agent/athlete/[id]',
                  params: { id: AGENT_ATHLETES[0]?.id ?? '' },
                }),
            }}
          />
        ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.kanbanRow}
          decelerationRate="fast"
          snapToInterval={COLUMN_WIDTH + 12}
        >
          {STAGES.map((s) => {
            const items = AGENT_DEALS.filter((d) => d.stage === s.key);
            return (
              <View key={s.key} style={styles.column}>
                <View style={styles.columnHeader}>
                  <View style={[styles.stageDot, { backgroundColor: s.color }]} />
                  <Text style={styles.columnTitle}>{s.label.toUpperCase()}</Text>
                  <Text style={styles.columnCount}>{items.length}</Text>
                </View>
                {items.length === 0 ? (
                  <View style={styles.columnEmpty}>
                    <Text style={styles.columnEmptyText}>No deals</Text>
                  </View>
                ) : (
                  items.map((d, i) => (
                    <Animated.View
                      key={d.id}
                      entering={FadeInDown.delay(i * 60).duration(360)}
                      style={styles.dealCard}
                    >
                      <View style={styles.dealCardTop}>
                        <View style={[styles.brandBadge, { backgroundColor: d.brandColor }]}>
                          <Text style={styles.brandBadgeText}>{d.brandInitial}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.dealBrand}>{d.brand}</Text>
                          <Text style={styles.dealCategory}>{d.category}</Text>
                        </View>
                        <Text style={styles.dealValue}>{d.value}</Text>
                      </View>
                      <View style={styles.dealCardFooter}>
                        <View style={styles.athleteRow}>
                          <View style={[styles.athleteDot, { backgroundColor: d.athleteColor }]}>
                            <Text style={styles.athleteDotText}>{d.athleteInitial}</Text>
                          </View>
                          <Text style={styles.athleteName} numberOfLines={1}>
                            {d.athleteName}
                          </Text>
                        </View>
                        <Text style={styles.dealDue}>{d.due}</Text>
                      </View>
                    </Animated.View>
                  ))
                )}
              </View>
            );
          })}
        </ScrollView>
        )}

        {/* Athlete coverage strip */}
        <Text style={styles.sectionLabel}>YOUR ATHLETES</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.athleteStripRow}>
          {AGENT_ATHLETES.map((a) => (
            <Pressable
              key={a.id}
              onPress={() =>
                router.push({
                  pathname: '/agent/athlete/[id]',
                  params: { id: a.id },
                })
              }
              style={({ pressed }) => [styles.athleteStripCard, pressed && { opacity: 0.6 }]}
            >
              <View style={[styles.athleteStripAvatar, { backgroundColor: a.color, overflow: 'hidden' }]}>
                {a.headshotUrl ? (
                  <Image
                    source={{ uri: a.headshotUrl }}
                    style={styles.athleteStripImage}
                    accessibilityIgnoresInvertColors
                  />
                ) : (
                  <Text style={styles.athleteStripInitials}>{a.initials}</Text>
                )}
              </View>
              <Text style={styles.athleteStripName} numberOfLines={1}>
                {a.name.split(' ').pop()}
              </Text>
              <Text style={styles.athleteStripMeta}>{a.activeDeals} deals</Text>
            </Pressable>
          ))}
        </ScrollView>
      </ScrollView>
    </View>
  );
}

function FilterChip({ label, active }: { label: string; active?: boolean }) {
  return (
    <Pressable style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 },

  scroll: { flex: 1 },
  content: { paddingTop: 8 },

  heroCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  heroRow: { flexDirection: 'row', alignItems: 'center' },
  heroStat: { flex: 1, alignItems: 'center' },
  heroDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.08)' },
  heroValue: { fontSize: 22, fontWeight: '900', color: '#FFF', letterSpacing: -0.4 },
  heroLabel: { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.6 },

  chipsRow: { paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  chipActive: { backgroundColor: 'rgba(255,255,255,0.18)', borderColor: 'rgba(255,255,255,0.3)' },
  chipText: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  chipTextActive: { color: '#FFF', fontWeight: '700' },

  kanbanRow: { paddingHorizontal: 16, gap: 12, paddingBottom: 8 },
  column: {
    width: COLUMN_WIDTH,
    gap: 8,
  },
  columnHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4, marginBottom: 4 },
  stageDot: { width: 8, height: 8, borderRadius: 4 },
  columnTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1, color: 'rgba(255,255,255,0.7)' },
  columnCount: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.4)', marginLeft: 'auto' },
  columnEmpty: {
    height: 64,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.06)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  columnEmptyText: { fontSize: 12, color: 'rgba(255,255,255,0.3)' },

  dealCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 12,
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  dealCardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  brandBadge: { width: 36, height: 36, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  brandBadgeText: { fontSize: 14, fontWeight: '900', color: '#FFF' },
  dealBrand: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  dealCategory: { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 1 },
  dealValue: { fontSize: 12, fontWeight: '800', color: '#FFF' },
  dealCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  athleteRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  athleteDot: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  athleteDotText: { fontSize: 10, fontWeight: '900', color: '#FFF' },
  athleteName: { fontSize: 12, color: '#FFF', fontWeight: '600', flex: 1 },
  dealDue: { fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: '600' },

  sectionLabel: {
    fontSize: 11, fontWeight: '800', letterSpacing: 1.2,
    color: 'rgba(255,255,255,0.55)',
    paddingHorizontal: 20, marginTop: 16, marginBottom: 8,
  },
  athleteStripRow: { paddingHorizontal: 16, gap: 10, paddingBottom: 8 },
  athleteStripCard: {
    width: 84,
    alignItems: 'center',
    gap: 6,
  },
  athleteStripAvatar: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.18)',
  },
  athleteStripInitials: { fontSize: 17, fontWeight: '900', color: '#FFF' },
  athleteStripImage: { width: 52, height: 52, borderRadius: 26 },
  athleteStripName: { fontSize: 12, color: '#FFF', fontWeight: '700' },
  athleteStripMeta: { fontSize: 10, color: 'rgba(255,255,255,0.5)' },
});
