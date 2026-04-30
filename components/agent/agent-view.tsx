import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassView } from 'expo-glass-effect';
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
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useStableRouter } from '@/hooks/use-stable-router';
import { RoleSwitcherSheet } from '@/components/shared/role-switcher-menu';
import {
  AGENT_ATHLETES,
  AGENT_DEALS,
  AGENT_INSIGHTS,
  AGENT_OFFERS,
  type AgentDeal,
} from '@/lib/data/mock-agent-data';

const ACCENT = '#FF6F3C';
const TEAL = '#14B8A6';
const TAB_BAR_TOP_FROM_BOTTOM = 90;

type TabKey = 'pipeline' | 'roster' | 'insights';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'pipeline', label: 'Pipeline' },
  { key: 'roster', label: 'Roster' },
  { key: 'insights', label: 'Insights' },
];

export function AgentView() {
  const insets = useSafeAreaInsets();
  const router = useStableRouter();
  const [activeTab, setActiveTab] = React.useState<TabKey>('pipeline');
  const [roleSheetVisible, setRoleSheetVisible] = React.useState(false);

  const activeTabIndex = Math.max(0, TABS.findIndex((t) => t.key === activeTab));
  const tabPillWidth = useSharedValue(0);
  const animatedTabIndex = useSharedValue(activeTabIndex);
  React.useEffect(() => {
    animatedTabIndex.value = withTiming(activeTabIndex, { duration: 180 });
  }, [activeTabIndex, animatedTabIndex]);
  const tabKnobStyle = useAnimatedStyle(() => {
    const segW = tabPillWidth.value / Math.max(TABS.length, 1);
    const inset = 4;
    return {
      width: Math.max(segW - inset * 2, 0),
      transform: [{ translateX: animatedTabIndex.value * segW + inset }],
    };
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top + 4 }]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Agent Desk</Text>
          <Text style={styles.headerSubtitle}>
            Hayes Sports Group · {AGENT_ATHLETES.filter((a) => a.status === 'signed').length} signed
          </Text>
        </View>
        <View style={styles.volumePill}>
          <Ionicons name="trending-up" size={12} color={TEAL} />
          <Text style={styles.volumePillText}>{AGENT_INSIGHTS.totalVolume} YTD</Text>
        </View>
      </View>

      {activeTab === 'pipeline' && <PipelineTab insets={insets.bottom} />}
      {activeTab === 'roster' && <RosterTab insets={insets.bottom} />}
      {activeTab === 'insights' && <InsightsTab insets={insets.bottom} />}

      {/* Bottom darken gradient */}
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.95)']}
        locations={[0, 0.5, 1]}
        style={[styles.bottomFade, { bottom: 0, height: TAB_BAR_TOP_FROM_BOTTOM + 170 }]}
        pointerEvents="none"
      />

      {/* Floating bottom row — profile pill + segmented tabs */}
      <View style={[styles.headerScrollFixed, styles.headerScrollContent]}>
        <Pressable
          style={styles.headerPill}
          onPress={() => setRoleSheetVisible(true)}
          accessibilityLabel="Switch role"
          accessibilityRole="button"
        >
          <View style={styles.glassLayer} pointerEvents="none">
            <GlassView glassEffectStyle="regular" style={[StyleSheet.absoluteFill, { borderRadius: 23 }]} />
          </View>
          <Image source={require('@/assets/images/default-avatar.png')} style={styles.headerPillAvatar} />
          <Ionicons name="menu" size={22} color="#FFF" style={styles.headerPillIcon} />
        </Pressable>

        <View
          style={styles.tabSegmentedPill}
          onLayout={(e) => {
            tabPillWidth.value = e.nativeEvent.layout.width;
          }}
        >
          <View style={styles.glassLayer} pointerEvents="none">
            <GlassView glassEffectStyle="regular" style={[StyleSheet.absoluteFill, { borderRadius: 23 }]} />
          </View>
          <Animated.View style={[styles.tabKnob, tabKnobStyle]} pointerEvents="none" />
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                style={styles.tabSegment}
                onPress={() => setActiveTab(tab.key)}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
              >
                <Text style={[styles.tabPillText, isActive && styles.tabPillTextActive]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <RoleSwitcherSheet visible={roleSheetVisible} onClose={() => setRoleSheetVisible(false)} />
    </View>
  );
}

// ============================================================
// Tab — Pipeline (sub-tabs Active | Offers)
// ============================================================

function PipelineTab({ insets }: { insets: number }) {
  const [subTab, setSubTab] = React.useState<'active' | 'offers'>('active');
  const SUB_TABS: { key: 'active' | 'offers'; label: string }[] = [
    { key: 'active', label: 'Active' },
    { key: 'offers', label: 'Offers' },
  ];

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.subTabsRow}>
        {SUB_TABS.map(({ key, label }) => {
          const isActive = subTab === key;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.subTab, isActive && styles.subTabActive]}
              onPress={() => setSubTab(key)}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <Text style={[styles.subTabLabel, isActive && styles.subTabLabelActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {subTab === 'active' && <ActiveDealsList insets={insets} />}
      {subTab === 'offers' && <OffersList insets={insets} />}
    </View>
  );
}

function ActiveDealsList({ insets }: { insets: number }) {
  // Group by stage
  const stages: { key: AgentDeal['stage']; label: string; color: string }[] = [
    { key: 'draft', label: 'Drafting', color: 'rgba(255,255,255,0.4)' },
    { key: 'sent', label: 'Sent', color: '#3B82F6' },
    { key: 'negotiation', label: 'In Negotiation', color: ACCENT },
    { key: 'signed', label: 'Signed', color: TEAL },
    { key: 'live', label: 'Live', color: TEAL },
  ];

  return (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, { paddingBottom: insets + 40 }]}
      showsVerticalScrollIndicator={false}
    >
      {stages.map((s) => {
        const items = AGENT_DEALS.filter((d) => d.stage === s.key);
        if (items.length === 0) return null;
        return (
          <View key={s.key} style={{ gap: 8 }}>
            <View style={styles.stageHeader}>
              <View style={[styles.stageDot, { backgroundColor: s.color }]} />
              <Text style={styles.stageLabel}>{s.label.toUpperCase()}</Text>
              <Text style={styles.stageCount}>{items.length}</Text>
            </View>
            {items.map((d, i) => (
              <Animated.View
                key={d.id}
                entering={FadeInDown.delay(i * 50).duration(380)}
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
                  <View style={styles.athletePillRow}>
                    <View style={[styles.athleteDot, { backgroundColor: d.athleteColor }]}>
                      <Text style={styles.athleteDotText}>{d.athleteInitial}</Text>
                    </View>
                    <Text style={styles.athleteName}>{d.athleteName}</Text>
                  </View>
                  <Text style={styles.dealDue}>{d.due}</Text>
                </View>
              </Animated.View>
            ))}
          </View>
        );
      })}
    </ScrollView>
  );
}

function OffersList({ insets }: { insets: number }) {
  return (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, { paddingBottom: insets + 40 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.sectionLabel}>INBOUND OFFERS · {AGENT_OFFERS.length}</Text>
      {AGENT_OFFERS.map((o, i) => (
        <Animated.View
          key={o.id}
          entering={FadeInDown.delay(i * 50).duration(380)}
          style={styles.offerCard}
        >
          <View style={styles.dealCardTop}>
            <View style={[styles.brandBadge, { backgroundColor: o.brandColor }]}>
              <Text style={styles.brandBadgeText}>{o.brandInitial}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.dealBrand}>{o.brand} → {o.athleteName}</Text>
              <Text style={styles.dealCategory}>{o.summary}</Text>
              <Text style={styles.dealAmount}>{o.amount} · {o.received}</Text>
            </View>
            <View style={styles.matchPill}>
              <Text style={styles.matchPillLabel}>MATCH</Text>
              <Text style={styles.matchPillScore}>{o.matchScore}</Text>
            </View>
          </View>
          <View style={styles.offerActions}>
            <TouchableOpacity style={styles.offerSecondaryBtn} activeOpacity={0.7}>
              <Text style={styles.offerSecondaryBtnText}>Pass</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.offerPrimaryBtn} activeOpacity={0.85}>
              <Text style={styles.offerPrimaryBtnText}>Counter</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      ))}
    </ScrollView>
  );
}

// ============================================================
// Tab — Roster
// ============================================================

function RosterTab({ insets }: { insets: number }) {
  const router = useStableRouter();
  return (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, { paddingBottom: insets + 40 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.sectionLabel}>YOUR ATHLETES · {AGENT_ATHLETES.length}</Text>
      {AGENT_ATHLETES.map((a, i) => (
        <Animated.View
          key={a.id}
          entering={FadeInDown.delay(i * 50).duration(380)}
        >
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/agent/athlete/[id]',
                params: { id: a.id },
              })
            }
            style={({ pressed }) => [
              styles.rosterCard,
              pressed && { opacity: 0.6 },
            ]}
            accessibilityRole="button"
          >
            <View style={[styles.rosterAvatar, { backgroundColor: a.color }]}>
              <Text style={styles.rosterAvatarText}>{a.initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.rosterNameRow}>
                <Text style={styles.rosterName}>{a.name}</Text>
                {a.status === 'pending' && (
                  <View style={[styles.statusPill, { backgroundColor: 'rgba(255,214,10,0.16)' }]}>
                    <Text style={[styles.statusPillText, { color: '#FFD60A' }]}>PENDING</Text>
                  </View>
                )}
                {a.status === 'signed' && (
                  <View style={[styles.statusPill, { backgroundColor: 'rgba(255,214,10,0.16)' }]}>
                    <Text style={[styles.statusPillText, { color: '#FFD60A' }]}>SIGNED</Text>
                  </View>
                )}
              </View>
              <Text style={styles.rosterMeta}>
                {a.sport} · {a.school} · {a.classYear}
              </Text>
              <View style={styles.rosterStatsRow}>
                <Text style={styles.rosterStat}>{a.activeDeals} active</Text>
                <Text style={styles.rosterStatDot}>·</Text>
                <Text style={styles.rosterStatHighlight}>{a.totalDealValue}</Text>
                <Text style={styles.rosterStatDot}>·</Text>
                <Text style={styles.rosterStat}>{a.followers}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.3)" />
          </Pressable>
        </Animated.View>
      ))}
    </ScrollView>
  );
}

// ============================================================
// Tab — Insights
// ============================================================

function InsightsTab({ insets }: { insets: number }) {
  return (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, { paddingBottom: insets + 40 }]}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.duration(380)} style={styles.heroStatCard}>
        <LinearGradient
          colors={['rgba(20,184,166,0.18)', 'rgba(20,184,166,0.02)']}
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.heroStatLabel}>YTD DEAL VOLUME</Text>
        <Text style={styles.heroStatValue}>{AGENT_INSIGHTS.totalVolume}</Text>
        <Text style={[styles.heroStatDelta, { color: TEAL }]}>{AGENT_INSIGHTS.totalVolumeDelta}</Text>
      </Animated.View>

      <Text style={styles.sectionLabel}>SNAPSHOT</Text>
      <View style={styles.insightsGrid}>
        <View style={styles.insightTile}>
          <Text style={styles.insightTileLabel}>Pipeline value</Text>
          <Text style={styles.insightTileValue}>{AGENT_INSIGHTS.pipelineValue}</Text>
        </View>
        <View style={styles.insightTile}>
          <Text style={styles.insightTileLabel}>Conversion rate</Text>
          <Text style={styles.insightTileValue}>{AGENT_INSIGHTS.conversionRate}</Text>
        </View>
        <View style={styles.insightTile}>
          <Text style={styles.insightTileLabel}>Top athlete</Text>
          <Text style={styles.insightTileValue}>{AGENT_INSIGHTS.topAthlete.name}</Text>
          <Text style={styles.insightTileMeta}>{AGENT_INSIGHTS.topAthlete.value}</Text>
        </View>
        <View style={styles.insightTile}>
          <Text style={styles.insightTileLabel}>Top category</Text>
          <Text style={styles.insightTileValue}>{AGENT_INSIGHTS.topCategory}</Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>ATHLETES BY VOLUME</Text>
      <View style={styles.barChartCard}>
        {AGENT_ATHLETES.filter((a) => a.status === 'signed')
          .map((a) => {
            const num = parseFloat(a.totalDealValue.replace(/[^0-9.]/g, '')) || 0;
            return { ...a, num };
          })
          .sort((a, b) => b.num - a.num)
          .map((a, i, arr) => {
            const max = arr[0].num || 1;
            const pct = (a.num / max) * 100;
            return (
              <View key={a.id} style={styles.barRow}>
                <Text style={styles.barName}>{a.name}</Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      { width: `${Math.max(8, pct)}%`, backgroundColor: a.color },
                    ]}
                  />
                </View>
                <Text style={styles.barValue}>{a.totalDealValue}</Text>
              </View>
            );
          })}
      </View>
    </ScrollView>
  );
}

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  // Sub-tab pill switcher (Active | Offers inside Pipeline tab)
  subTabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  subTab: {
    flex: 1,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    alignItems: 'center',
  },
  subTabActive: { borderBottomColor: ACCENT },
  subTabLabel: { fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.55)' },
  subTabLabelActive: { color: '#FFF', fontWeight: '700' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
  headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  volumePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(20,184,166,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(20,184,166,0.4)',
  },
  volumePillText: { fontSize: 11, fontWeight: '700', color: TEAL, letterSpacing: 0.4 },

  scrollContent: { paddingHorizontal: 16, gap: 12 },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: 'rgba(255,255,255,0.55)',
    paddingHorizontal: 4,
    marginTop: 6,
    marginBottom: 4,
  },

  // Stage groupings
  stageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
    marginTop: 6,
  },
  stageDot: { width: 8, height: 8, borderRadius: 4 },
  stageLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    color: 'rgba(255,255,255,0.7)',
  },
  stageCount: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
    marginLeft: 'auto',
  },

  // Deal card
  dealCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 12,
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  dealCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandBadgeText: { fontSize: 16, fontWeight: '900', color: '#FFF' },
  dealBrand: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  dealCategory: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  dealAmount: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2, fontWeight: '600' },
  dealValue: { fontSize: 13, fontWeight: '800', color: '#FFF' },
  dealCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  athletePillRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  athleteDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  athleteDotText: { fontSize: 11, fontWeight: '900', color: '#FFF' },
  athleteName: { fontSize: 13, color: '#FFF', fontWeight: '600' },
  dealDue: { fontSize: 11, color: 'rgba(255,255,255,0.55)' },

  // Offer card
  offerCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 12,
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  matchPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(20,184,166,0.14)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(20,184,166,0.45)',
    alignItems: 'center',
  },
  matchPillLabel: { fontSize: 8, fontWeight: '800', letterSpacing: 0.8, color: TEAL },
  matchPillScore: { fontSize: 16, fontWeight: '900', color: TEAL },
  offerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  offerSecondaryBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  offerSecondaryBtnText: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },
  offerPrimaryBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  offerPrimaryBtnText: { fontSize: 13, fontWeight: '700', color: '#000' },

  // Roster (matches athlete-detail aesthetic — solid dark cards, no borders, yellow accents)
  rosterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 14,
  },
  rosterAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,214,10,0.35)',
  },
  rosterAvatarText: { fontSize: 19, fontWeight: '900', color: '#FFF' },
  rosterNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  rosterName: { fontSize: 16, fontWeight: '700', color: '#FFF', letterSpacing: -0.2 },
  rosterMeta: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  rosterStatsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  rosterStat: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  rosterStatHighlight: { fontSize: 11, color: '#FFD60A', fontWeight: '700' },
  rosterStatDot: { fontSize: 11, color: 'rgba(255,255,255,0.3)' },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusPillText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },

  // Insights
  heroStatCard: {
    borderRadius: 16,
    padding: 18,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(20,184,166,0.3)',
    gap: 4,
  },
  heroStatLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, color: 'rgba(255,255,255,0.55)' },
  heroStatValue: { fontSize: 32, fontWeight: '900', color: '#FFF', letterSpacing: -0.6 },
  heroStatDelta: { fontSize: 13, fontWeight: '700' },

  insightsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  insightTile: {
    flexBasis: '48%',
    flexGrow: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 4,
  },
  insightTileLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, color: 'rgba(255,255,255,0.5)' },
  insightTileValue: { fontSize: 17, fontWeight: '800', color: '#FFF' },
  insightTileMeta: { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 },

  barChartCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 14,
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  barName: { fontSize: 12, color: '#FFF', fontWeight: '600', width: 100 },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 4 },
  barValue: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '700', width: 80, textAlign: 'right' },

  // Floating bottom toolbar
  bottomFade: { position: 'absolute', left: 0, right: 0, zIndex: 5 },
  headerScrollFixed: {
    position: 'absolute',
    bottom: TAB_BAR_TOP_FROM_BOTTOM + 10,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  headerScrollContent: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    gap: 8,
    alignItems: 'center',
  },
  headerPill: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassLayer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 23, overflow: 'hidden' },
  headerPillAvatar: { width: 30, height: 30, borderRadius: 15, position: 'absolute', left: 4, top: 8 },
  headerPillIcon: { position: 'absolute', right: 6, top: 12 },
  tabSegmentedPill: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
    flexDirection: 'row',
    position: 'relative',
  },
  tabKnob: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  tabSegment: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabPillText: { fontSize: 13, fontWeight: '600', color: '#FFF' },
  tabPillTextActive: { color: ACCENT, fontWeight: '800' },
});
