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

  const topPad = insets.top + 70;
  const bottomPad = insets.bottom + 120;

  return (
    <View style={styles.container}>
      {activeTab === 'pipeline' && <PipelineTab topPad={topPad} bottomPad={bottomPad} />}
      {activeTab === 'roster' && <RosterTab topPad={topPad} bottomPad={bottomPad} />}
      {activeTab === 'insights' && <InsightsTab topPad={topPad} bottomPad={bottomPad} />}

      {/* Top fade — gives the floating top pill row visual depth */}
      <LinearGradient
        colors={['rgba(0,0,0,0.95)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0)']}
        locations={[0, 0.5, 1]}
        style={[styles.topFade, { height: insets.top + 90 }]}
        pointerEvents="none"
      />

      {/* Floating header row — avatar/menu pill + segmented tabs (TOP) */}
      <View style={[styles.headerScrollFixed, styles.headerScrollContent, { top: insets.top + 8 }]}>
        <Pressable
          style={styles.profilePill}
          onPress={() => setRoleSheetVisible(true)}
          accessibilityLabel="Open menu"
          accessibilityRole="button"
        >
          <View style={styles.glassLayer} pointerEvents="none">
            <GlassView glassEffectStyle="regular" style={[StyleSheet.absoluteFill, { borderRadius: 23 }]} />
          </View>
          <Image source={require('@/assets/images/kiyan-avatar.png')} style={styles.profilePillAvatar} />
          <Ionicons name="menu" size={22} color="#FFF" style={{ marginLeft: 8 }} />
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

      {/* Bottom fade — keeps content fading into the floating native tab bar */}
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.95)']}
        locations={[0, 0.5, 1]}
        style={[styles.bottomFade, { bottom: 0, height: TAB_BAR_TOP_FROM_BOTTOM + 110 }]}
        pointerEvents="none"
      />

      <RoleSwitcherSheet visible={roleSheetVisible} onClose={() => setRoleSheetVisible(false)} />
    </View>
  );
}

// ============================================================
// Tab — Pipeline (sub-tabs Active | Offers)
// ============================================================

const STAGE_META: Record<AgentDeal['stage'], { label: string; color: string }> = {
  draft: { label: 'Drafting', color: 'rgba(255,255,255,0.45)' },
  sent: { label: 'Sent', color: '#3B82F6' },
  negotiation: { label: 'In Negotiation', color: ACCENT },
  signed: { label: 'Signed', color: TEAL },
  live: { label: 'Live', color: '#34C759' },
  wrapped: { label: 'Wrapped', color: 'rgba(255,255,255,0.3)' },
};

const ACTIVE_STAGES: AgentDeal['stage'][] = ['draft', 'sent', 'negotiation', 'signed', 'live'];

function parseMoney(v: string): number {
  const m = v.match(/\$\s*([\d,.]+)\s*([km])?/i);
  if (!m) return 0;
  const n = parseFloat(m[1].replace(/,/g, ''));
  if (!Number.isFinite(n)) return 0;
  const u = (m[2] || '').toLowerCase();
  return u === 'm' ? n * 1_000_000 : u === 'k' ? n * 1_000 : n;
}

function formatMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 ? 1 : 0)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return `$${Math.round(n)}`;
}

function PipelineTab({ topPad, bottomPad }: { topPad: number; bottomPad: number }) {
  const [subTab, setSubTab] = React.useState<'active' | 'offers'>('active');
  const activeCount = AGENT_DEALS.filter((d) => ACTIVE_STAGES.includes(d.stage)).length;
  const SUB_TABS = [
    { key: 'active', label: 'Active', count: activeCount },
    { key: 'offers', label: 'Offers', count: AGENT_OFFERS.length },
  ] as const;

  const subIndex = Math.max(0, SUB_TABS.findIndex((t) => t.key === subTab));
  const subPillWidth = useSharedValue(0);
  const animatedSubIndex = useSharedValue(subIndex);
  React.useEffect(() => {
    animatedSubIndex.value = withTiming(subIndex, { duration: 180 });
  }, [subIndex, animatedSubIndex]);
  const subKnobStyle = useAnimatedStyle(() => {
    const segW = subPillWidth.value / Math.max(SUB_TABS.length, 1);
    const inset = 4;
    return {
      width: Math.max(segW - inset * 2, 0),
      transform: [{ translateX: animatedSubIndex.value * segW + inset }],
    };
  });

  return (
    <View style={{ flex: 1, paddingTop: topPad }}>
      <View
        style={styles.subTabsRow}
        onLayout={(e) => {
          subPillWidth.value = e.nativeEvent.layout.width;
        }}
      >
        <View style={styles.glassLayer} pointerEvents="none">
          <GlassView glassEffectStyle="regular" style={[StyleSheet.absoluteFill, { borderRadius: 23 }]} />
        </View>
        <Animated.View style={[styles.tabKnob, subKnobStyle]} pointerEvents="none" />
        {SUB_TABS.map(({ key, label, count }) => {
          const isActive = subTab === key;
          return (
            <Pressable
              key={key}
              style={styles.subTab}
              onPress={() => setSubTab(key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <Text style={[styles.subTabLabel, isActive && styles.subTabLabelActive]}>
                {label}
              </Text>
              <View style={[styles.subTabBadge, isActive && styles.subTabBadgeActive]}>
                <Text style={[styles.subTabBadgeText, isActive && styles.subTabBadgeTextActive]}>
                  {count}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {subTab === 'active' && <ActiveDealsList bottomPad={bottomPad} />}
      {subTab === 'offers' && <OffersList bottomPad={bottomPad} />}
    </View>
  );
}

function ActiveDealsList({ bottomPad }: { bottomPad: number }) {
  const active = AGENT_DEALS.filter((d) => ACTIVE_STAGES.includes(d.stage));
  const total = active.reduce((sum, d) => sum + parseMoney(d.value), 0);
  const stagesPresent = ACTIVE_STAGES.filter((st) => active.some((d) => d.stage === st));

  return (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Pipeline summary */}
      <View style={styles.pipeSummary}>
        <Text style={styles.pipeSummaryLabel}>ACTIVE PIPELINE</Text>
        <Text style={styles.pipeSummaryValue}>{formatMoney(total)}</Text>
        <Text style={styles.pipeSummarySub}>
          {active.length} deals · {stagesPresent.length} stages
        </Text>
        <View style={styles.funnelBar}>
          {stagesPresent.map((st) => {
            const c = active.filter((d) => d.stage === st).length;
            return (
              <View
                key={st}
                style={[styles.funnelSeg, { flex: c, backgroundColor: STAGE_META[st].color }]}
              />
            );
          })}
        </View>
        <View style={styles.funnelLegend}>
          {stagesPresent.map((st) => (
            <View key={st} style={styles.funnelLegendItem}>
              <View style={[styles.funnelDot, { backgroundColor: STAGE_META[st].color }]} />
              <Text style={styles.funnelLegendText}>
                {STAGE_META[st].label} · {active.filter((d) => d.stage === st).length}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Stage groups */}
      {stagesPresent.map((st) => {
        const items = active.filter((d) => d.stage === st);
        const meta = STAGE_META[st];
        return (
          <View key={st} style={{ gap: 8 }}>
            <View style={styles.stageHeader}>
              <View style={[styles.stageDot, { backgroundColor: meta.color }]} />
              <Text style={styles.stageLabel}>{meta.label.toUpperCase()}</Text>
              <Text style={styles.stageCount}>{items.length}</Text>
            </View>
            {items.map((d, i) => {
              const urgent = /due/i.test(d.due);
              return (
                <Animated.View
                  key={d.id}
                  entering={FadeInDown.delay(i * 40).duration(360)}
                  style={styles.dealCard}
                >
                  <View style={[styles.dealAccent, { backgroundColor: meta.color }]} />
                  <View style={styles.dealBody}>
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
                      <View style={styles.dueRow}>
                        {urgent && <Ionicons name="time-outline" size={11} color={ACCENT} />}
                        <Text style={[styles.dealDue, urgent && styles.dealDueUrgent]}>{d.due}</Text>
                      </View>
                    </View>
                  </View>
                </Animated.View>
              );
            })}
          </View>
        );
      })}
    </ScrollView>
  );
}

function OffersList({ bottomPad }: { bottomPad: number }) {
  const [dismissed, setDismissed] = React.useState<Set<string>>(new Set());
  const [countered, setCountered] = React.useState<Set<string>>(new Set());

  const offers = AGENT_OFFERS.filter((o) => !dismissed.has(o.id));
  const total = offers.reduce((sum, o) => sum + parseMoney(o.amount), 0);

  const scoreColor = (n: number) =>
    n >= 85 ? TEAL : n >= 70 ? ACCENT : 'rgba(255,255,255,0.55)';

  if (offers.length === 0) {
    return (
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.offersEmpty}>
          <Ionicons name="checkmark-done-circle-outline" size={36} color="rgba(255,255,255,0.3)" />
          <Text style={styles.offersEmptyTitle}>Inbox zero</Text>
          <Text style={styles.offersEmptyBody}>No inbound offers waiting on you.</Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.offersSummaryRow}>
        <Text style={styles.sectionLabel}>INBOUND OFFERS · {offers.length}</Text>
        <Text style={styles.offersTotal}>{formatMoney(total)} on the table</Text>
      </View>

      {offers.map((o, i) => {
        const sc = scoreColor(o.matchScore);
        const isCountered = countered.has(o.id);
        return (
          <Animated.View
            key={o.id}
            entering={FadeInDown.delay(i * 40).duration(360)}
            style={styles.offerCard}
          >
            <View style={styles.dealCardTop}>
              <View style={[styles.brandBadge, { backgroundColor: o.brandColor }]}>
                <Text style={styles.brandBadgeText}>{o.brandInitial}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.dealBrand}>{o.brand}</Text>
                <View style={styles.offerAthleteRow}>
                  <Ionicons name="arrow-forward" size={11} color="rgba(255,255,255,0.4)" />
                  <View style={[styles.athleteDotSm, { backgroundColor: o.athleteColor }]}>
                    <Text style={styles.athleteDotSmText}>{o.athleteInitial}</Text>
                  </View>
                  <Text style={styles.offerAthleteName}>{o.athleteName}</Text>
                </View>
              </View>
              <View style={[styles.matchBadge, { borderColor: `${sc}66`, backgroundColor: `${sc}1F` }]}>
                <Text style={[styles.matchBadgeScore, { color: sc }]}>{o.matchScore}</Text>
                <Text style={styles.matchBadgeLabel}>MATCH</Text>
              </View>
            </View>

            <Text style={styles.offerSummary}>{o.summary}</Text>

            <View style={styles.offerMetaRow}>
              <View style={styles.offerAmountPill}>
                <Text style={styles.offerAmountText}>{o.amount}</Text>
              </View>
              <Text style={styles.offerReceived}>{o.received}</Text>
            </View>

            <View style={styles.matchTrack}>
              <View
                style={[
                  styles.matchFill,
                  { width: `${Math.max(6, Math.min(100, o.matchScore))}%`, backgroundColor: sc },
                ]}
              />
            </View>

            <View style={styles.offerActions}>
              <TouchableOpacity
                style={styles.offerSecondaryBtn}
                activeOpacity={0.7}
                onPress={() => setDismissed((prev) => new Set(prev).add(o.id))}
              >
                <Ionicons name="close" size={14} color="rgba(255,255,255,0.85)" />
                <Text style={styles.offerSecondaryBtnText}>Pass</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.offerPrimaryBtn, isCountered && styles.offerCounteredBtn]}
                activeOpacity={0.85}
                disabled={isCountered}
                onPress={() => setCountered((prev) => new Set(prev).add(o.id))}
              >
                <Ionicons
                  name={isCountered ? 'checkmark' : 'swap-horizontal'}
                  size={14}
                  color={isCountered ? TEAL : '#000'}
                />
                <Text style={[styles.offerPrimaryBtnText, isCountered && { color: TEAL }]}>
                  {isCountered ? 'Countered' : 'Counter'}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        );
      })}
    </ScrollView>
  );
}

// ============================================================
// Tab — Roster
// ============================================================

function RosterTab({ topPad, bottomPad }: { topPad: number; bottomPad: number }) {
  const router = useStableRouter();
  return (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, { paddingTop: topPad, paddingBottom: bottomPad }]}
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

function InsightsTab({ topPad, bottomPad }: { topPad: number; bottomPad: number }) {
  return (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, { paddingTop: topPad, paddingBottom: bottomPad }]}
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

  // Sub-tab segmented switcher (Active | Offers) — glass pill matching the
  // Pipeline/Roster/Insights row above it.
  subTabsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
    position: 'relative',
  },
  subTab: {
    flex: 1,
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  subTabLabel: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.55)' },
  subTabLabelActive: { color: '#FFF' },
  subTabBadge: {
    minWidth: 20,
    height: 18,
    paddingHorizontal: 6,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  subTabBadgeActive: { backgroundColor: ACCENT },
  subTabBadgeText: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.6)' },
  subTabBadgeTextActive: { color: '#FFF' },

  // Pipeline summary + funnel
  pipeSummary: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 4,
  },
  pipeSummaryLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, color: 'rgba(255,255,255,0.55)' },
  pipeSummaryValue: { fontSize: 30, fontWeight: '900', color: '#FFF', letterSpacing: -0.6 },
  pipeSummarySub: { fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: '600' },
  funnelBar: {
    flexDirection: 'row',
    gap: 3,
    height: 8,
    marginTop: 12,
  },
  funnelSeg: { height: '100%', borderRadius: 4 },
  funnelLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 },
  funnelLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  funnelDot: { width: 7, height: 7, borderRadius: 4 },
  funnelLegendText: { fontSize: 10.5, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },

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

  // Deal card — left stage-accent stripe + body
  dealCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  dealAccent: { width: 4, alignSelf: 'stretch' },
  dealBody: { flex: 1, padding: 12, gap: 10 },
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
  dueRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dealDue: { fontSize: 11, color: 'rgba(255,255,255,0.55)' },
  dealDueUrgent: { color: ACCENT, fontWeight: '700' },

  // Offer card
  offerCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  offerAthleteRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  athleteDotSm: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  athleteDotSmText: { fontSize: 9, fontWeight: '900', color: '#FFF' },
  offerAthleteName: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  matchBadge: {
    minWidth: 52,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  matchBadgeScore: { fontSize: 18, fontWeight: '900', letterSpacing: -0.4 },
  matchBadgeLabel: { fontSize: 8, fontWeight: '800', letterSpacing: 0.8, color: 'rgba(255,255,255,0.5)' },
  offerSummary: { fontSize: 13, color: 'rgba(255,255,255,0.82)', lineHeight: 18 },
  offerMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  offerAmountPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  offerAmountText: { fontSize: 13, fontWeight: '800', color: '#FFF' },
  offerReceived: { fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: '600' },
  matchTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  matchFill: { height: '100%', borderRadius: 3 },
  offerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  offerSecondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  offerSecondaryBtnText: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },
  offerPrimaryBtn: {
    flex: 1.4,
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
  },
  offerCounteredBtn: {
    backgroundColor: 'rgba(20,184,166,0.16)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(20,184,166,0.5)',
  },
  offerPrimaryBtnText: { fontSize: 13, fontWeight: '700', color: '#000' },

  // Offers summary + empty
  offersSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  offersTotal: { fontSize: 11, fontWeight: '700', color: TEAL, letterSpacing: 0.3 },
  offersEmpty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 72, gap: 8 },
  offersEmptyTitle: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  offersEmptyBody: { fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },

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

  // Floating header row + fades
  topFade: { position: 'absolute', top: 0, left: 0, right: 0, height: 160, zIndex: 99 },
  bottomFade: { position: 'absolute', left: 0, right: 0, zIndex: 99 },
  headerScrollFixed: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 100,
  },
  headerScrollContent: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    alignItems: 'center',
  },
  profilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    paddingLeft: 3,
    paddingRight: 12,
    borderRadius: 23,
    overflow: 'hidden',
  },
  profilePillAvatar: { width: 40, height: 40, borderRadius: 20 },
  glassLayer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 23, overflow: 'hidden' },
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
    left: 0,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  tabSegment: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabPillText: { fontSize: 13, fontWeight: '600', color: '#FFF' },
  tabPillTextActive: { color: ACCENT, fontWeight: '800' },
});
