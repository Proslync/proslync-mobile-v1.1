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
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RoleSwitcherSheet } from '@/components/shared/role-switcher-menu';

import {
  BRAND_ATHLETES,
  BRAND_CAMPAIGNS,
  BRAND_DEALS,
  BRAND_INSIGHTS,
  type Athlete,
  type Campaign,
  type Deal,
} from '@/lib/data/mock-brand-data';

const ACCENT = '#FF6F3C';
const TEAL = '#00C6B0';
const CARD_BG = 'rgba(255,255,255,0.05)';
const CARD_BORDER = 'rgba(255,255,255,0.09)';
const TAB_BAR_TOP_FROM_BOTTOM = 90; // iOS 26 floating glass tab bar — top edge from screen bottom (incl. safe area)

type TabKey = 'pipeline' | 'athletes' | 'insights';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'pipeline', label: 'Pipeline' },
  { key: 'athletes', label: 'Athletes' },
  { key: 'insights', label: 'Insights' },
];

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

export function BrandView() {
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
      {activeTab === 'athletes' && <AthletesTab topPad={topPad} bottomPad={bottomPad} />}
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
          style={styles.headerPill}
          onPress={() => setRoleSheetVisible(true)}
          accessibilityLabel="Open menu"
          accessibilityRole="button"
        >
          <View style={styles.glassLayer} pointerEvents="none">
            <GlassView glassEffectStyle="regular" style={[StyleSheet.absoluteFill, { borderRadius: 23 }]} />
          </View>
          <Image source={require('@/assets/images/kiyan-avatar.png')} style={styles.headerPillAvatar} />
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
                accessibilityLabel={`${tab.label} tab`}
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
// Tab 1 — Pipeline (Campaigns + Deals combined)
// ============================================================

function PipelineTab({ topPad, bottomPad }: { topPad: number; bottomPad: number }) {
  const [subTab, setSubTab] = React.useState<'campaigns' | 'deals'>('campaigns');
  const SUB_TABS = [
    { key: 'campaigns', label: 'Campaigns', count: BRAND_CAMPAIGNS.length },
    { key: 'deals', label: 'Deals', count: BRAND_DEALS.length },
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

      {subTab === 'campaigns' && <CampaignsTab bottomPad={bottomPad} />}
      {subTab === 'deals' && <DealsTab bottomPad={bottomPad} />}
    </View>
  );
}

// ============================================================
// Tab 1a — Campaigns
// ============================================================

function CampaignsTab({ bottomPad }: { bottomPad: number }) {
  const live = BRAND_CAMPAIGNS.filter((c) => c.status === 'live');
  const upcoming = BRAND_CAMPAIGNS.filter((c) => c.status === 'upcoming');
  const wrapped = BRAND_CAMPAIGNS.filter((c) => c.status === 'wrapped');
  const totalBudget = BRAND_CAMPAIGNS.reduce((s, c) => s + parseMoney(c.budget), 0);
  const statuses = [
    { key: 'live', label: 'Live', color: TEAL, count: live.length },
    { key: 'upcoming', label: 'Upcoming', color: ACCENT, count: upcoming.length },
    { key: 'wrapped', label: 'Wrapped', color: 'rgba(255,255,255,0.45)', count: wrapped.length },
  ].filter((s) => s.count > 0);

  return (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad }]}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeIn.duration(300)} style={styles.pipeSummary}>
        <Text style={styles.pipeSummaryLabel}>CAMPAIGN SPEND</Text>
        <Text style={styles.pipeSummaryValue}>{formatMoney(totalBudget)}</Text>
        <Text style={styles.pipeSummarySub}>
          {BRAND_CAMPAIGNS.length} campaigns · {live.length} live
        </Text>
        <View style={styles.funnelBar}>
          {statuses.map((s) => (
            <View key={s.key} style={[styles.funnelSeg, { flex: s.count, backgroundColor: s.color }]} />
          ))}
        </View>
        <View style={styles.funnelLegend}>
          {statuses.map((s) => (
            <View key={s.key} style={styles.funnelLegendItem}>
              <View style={[styles.funnelDot, { backgroundColor: s.color }]} />
              <Text style={styles.funnelLegendText}>{s.label} · {s.count}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      <Text style={styles.kicker}>LIVE · {live.length}</Text>
      {live.map((c, i) => (
        <CampaignCard key={c.id} c={c} delay={i * 60} />
      ))}

      <Text style={styles.kicker}>UPCOMING</Text>
      {upcoming.map((c, i) => (
        <CampaignCard key={c.id} c={c} delay={i * 60} />
      ))}

      <Text style={styles.kicker}>WRAPPED</Text>
      {wrapped.map((c, i) => (
        <CampaignCard key={c.id} c={c} delay={i * 60} />
      ))}
    </ScrollView>
  );
}

function CampaignCard({ c, delay }: { c: Campaign; delay: number }) {
  const isLive = c.status === 'live';
  const isUp = c.status === 'upcoming';
  const badgeColor = isLive ? TEAL : isUp ? ACCENT : 'rgba(255,255,255,0.4)';
  const badgeLabel = isLive ? 'LIVE' : isUp ? 'UPCOMING' : 'WRAPPED';

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(380)}
      style={[styles.campaignCard, isLive && { borderColor: 'rgba(0,198,176,0.35)' }]}
    >
      <View style={[styles.dealAccent, { backgroundColor: badgeColor }]} />
      <View style={styles.campaignBody}>
        {isLive && (
          <LinearGradient
            colors={['rgba(0,198,176,0.12)', 'transparent']}
            style={StyleSheet.absoluteFill}
          />
        )}
        <View style={styles.campaignTop}>
          <View style={[styles.statusPill, { borderColor: badgeColor, backgroundColor: `${badgeColor}20` }]}>
            <Text style={[styles.statusPillText, { color: badgeColor }]}>{badgeLabel}</Text>
          </View>
          <Text style={styles.campaignRange}>{c.startDate} – {c.endDate}</Text>
        </View>
        <Text style={styles.campaignName}>{c.name}</Text>
        <Text style={styles.campaignAthlete}>{c.athlete}</Text>

        <View style={styles.metricsRow}>
          <Metric label="Reach" value={c.reach} />
          <View style={styles.metricDivider} />
          <Metric label="Impressions" value={c.impressions} />
          <View style={styles.metricDivider} />
          <Metric label="ER" value={c.engagement} />
        </View>

        <View style={styles.budgetRow}>
          <Text style={styles.budgetLabel}>Budget</Text>
          <Text style={styles.budgetValue}>{c.budget}</Text>
        </View>
        <View style={styles.spendTrack}>
          <View style={[styles.spendFill, { width: `${c.spent}%` }]} />
        </View>
        <Text style={styles.spendMeta}>
          {c.spent}% spent · {c.status === 'live' ? 'pacing on-plan' : c.status === 'upcoming' ? 'launching in ' + daysUntil(c.startDate) + ' days' : 'final report ready'}
        </Text>
      </View>
    </Animated.View>
  );
}

function daysUntil(_s: string) {
  // Demo: return deterministic-ish value
  return 24;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

// ============================================================
// Tab 2 — Athletes
// ============================================================

function AthletesTab({ topPad, bottomPad }: { topPad: number; bottomPad: number }) {
  const signed = BRAND_ATHLETES.filter((a) => a.signed);
  const discovery = BRAND_ATHLETES.filter((a) => !a.signed);

  return (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, { paddingTop: topPad, paddingBottom: bottomPad }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.kicker}>SIGNED ATHLETES · {signed.length}</Text>
      {signed.map((a, i) => (
        <AthleteRow key={a.id} a={a} delay={i * 50} />
      ))}

      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.kicker, { marginBottom: 0 }]}>AI MATCHES · {discovery.length}</Text>
        <View style={styles.sparkChip}>
          <Ionicons name="sparkles" size={10} color={ACCENT} />
          <Text style={styles.sparkChipText}>FIT SCORE</Text>
        </View>
      </View>

      {discovery.map((a, i) => (
        <AthleteRow key={a.id} a={a} delay={i * 50} />
      ))}

      <TouchableOpacity activeOpacity={0.85} style={styles.primaryWideBtn}>
        <Ionicons name="search" size={15} color="#FFFFFF" />
        <Text style={styles.primaryWideBtnText}>Open Discovery Engine</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function AthleteRow({ a, delay }: { a: Athlete; delay: number }) {
  const fitColor = a.fitScore >= 90 ? TEAL : a.fitScore >= 80 ? ACCENT : 'rgba(255,255,255,0.5)';
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(380)}
      style={styles.athleteRow}
    >
      <View style={styles.athleteAvatar}>
        <Text style={styles.athleteAvatarText}>{a.initials}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.athleteTopRow}>
          <Text style={styles.athleteName}>{a.name}</Text>
          <View style={styles.rankPill}>
            <Text style={styles.rankPillText}>{a.rank}</Text>
          </View>
        </View>
        <Text style={styles.athleteMeta}>
          {a.school} · {a.position} · {a.followers} followers
        </Text>
        {a.signed && a.contract && (
          <View style={styles.contractPill}>
            <Ionicons name="ribbon-outline" size={11} color={TEAL} />
            <Text style={styles.contractPillText}>{a.contract}</Text>
          </View>
        )}
      </View>
      <View style={styles.fitCol}>
        <Text style={[styles.fitValue, { color: fitColor }]}>{a.fitScore}</Text>
        <Text style={styles.fitLabel}>fit</Text>
      </View>
    </Animated.View>
  );
}

// ============================================================
// Tab 3 — Deal Pipeline
// ============================================================

function DealsTab({ bottomPad }: { bottomPad: number }) {
  const stages: { key: Deal['stage']; label: string; color: string }[] = [
    { key: 'draft', label: 'Drafts', color: 'rgba(255,255,255,0.4)' },
    { key: 'sent', label: 'Sent', color: '#3B82F6' },
    { key: 'negotiation', label: 'In Negotiation', color: ACCENT },
    { key: 'signed', label: 'Signed', color: TEAL },
    { key: 'live', label: 'Live', color: TEAL },
  ];

  const total = BRAND_DEALS.reduce((s, d) => s + parseMoney(d.value), 0);
  const present = stages.filter((st) => BRAND_DEALS.some((d) => d.stage === st.key));

  return (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad }]}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeIn.duration(300)} style={styles.pipeSummary}>
        <Text style={styles.pipeSummaryLabel}>DEAL PIPELINE</Text>
        <Text style={styles.pipeSummaryValue}>{formatMoney(total)}</Text>
        <Text style={styles.pipeSummarySub}>
          {BRAND_DEALS.length} deals · {present.length} stages
        </Text>
        <View style={styles.funnelBar}>
          {present.map((st) => {
            const c = BRAND_DEALS.filter((d) => d.stage === st.key).length;
            return (
              <View key={st.key} style={[styles.funnelSeg, { flex: c, backgroundColor: st.color }]} />
            );
          })}
        </View>
        <View style={styles.funnelLegend}>
          {present.map((st) => (
            <View key={st.key} style={styles.funnelLegendItem}>
              <View style={[styles.funnelDot, { backgroundColor: st.color }]} />
              <Text style={styles.funnelLegendText}>
                {st.label} · {BRAND_DEALS.filter((d) => d.stage === st.key).length}
              </Text>
            </View>
          ))}
        </View>
      </Animated.View>

      {stages.map((stage) => {
        const deals = BRAND_DEALS.filter((d) => d.stage === stage.key);
        if (deals.length === 0) return null;
        return (
          <View key={stage.key} style={{ marginBottom: 18, gap: 8 }}>
            <View style={styles.stageHeader}>
              <View style={[styles.stageDot, { backgroundColor: stage.color }]} />
              <Text style={styles.stageLabel}>{stage.label.toUpperCase()}</Text>
              <Text style={styles.stageCount}>{deals.length}</Text>
            </View>
            {deals.map((d, i) => (
              <Animated.View
                key={d.id}
                entering={FadeInDown.delay(i * 40).duration(360)}
                style={styles.dealCard}
              >
                <View style={[styles.dealAccent, { backgroundColor: stage.color }]} />
                <View style={styles.dealBody}>
                  <View style={styles.dealTop}>
                    <Text style={styles.dealAthlete}>{d.athlete}</Text>
                    <Text style={styles.dealValue}>{d.value}</Text>
                  </View>
                  <Text style={styles.dealTerm}>{d.term}</Text>
                  <View style={styles.dealFooter}>
                    <Text style={styles.dealFooterText}>{d.lastTouched}</Text>
                    <Text style={styles.dealOwner}>{d.owner}</Text>
                  </View>
                </View>
              </Animated.View>
            ))}
          </View>
        );
      })}
    </ScrollView>
  );
}

// ============================================================
// Tab 4 — Insights
// ============================================================

function InsightsTab({ topPad, bottomPad }: { topPad: number; bottomPad: number }) {
  return (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, { paddingTop: topPad, paddingBottom: bottomPad }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.kicker}>KPIs · LAST 30 DAYS</Text>
      <View style={styles.kpiGrid}>
        {BRAND_INSIGHTS.kpis.map((k, i) => (
          <Animated.View
            key={k.label}
            entering={FadeInDown.delay(i * 50).duration(380)}
            style={styles.kpiTile}
          >
            <Text style={styles.kpiValue}>{k.value}</Text>
            <Text style={styles.kpiLabel}>{k.label}</Text>
            <View style={styles.kpiDeltaRow}>
              <Ionicons
                name={k.positive ? 'trending-up' : 'trending-down'}
                size={11}
                color={k.positive ? TEAL : '#FF4444'}
              />
              <Text
                style={[
                  styles.kpiDelta,
                  { color: k.positive ? TEAL : '#FF4444' },
                ]}
              >
                {k.delta}
              </Text>
            </View>
          </Animated.View>
        ))}
      </View>

      <Text style={styles.kicker}>TOP CONTENT · LAST 14 DAYS</Text>
      {BRAND_INSIGHTS.topContent.map((t, i) => (
        <Animated.View
          key={t.id}
          entering={FadeInDown.delay(i * 60).duration(380)}
          style={styles.topContentRow}
        >
          <View style={styles.contentRank}>
            <Text style={styles.contentRankText}>{i + 1}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.contentTitle}>{t.title}</Text>
            <Text style={styles.contentMeta}>
              {t.athlete} · {t.metric}
            </Text>
            <Text style={styles.contentNote}>{t.note}</Text>
          </View>
          <Ionicons name="open-outline" size={16} color={ACCENT} />
        </Animated.View>
      ))}

      <Text style={styles.kicker}>IMPRESSIONS · BY PLATFORM</Text>
      <View style={styles.breakdownCard}>
        <View style={styles.breakdownBar}>
          {BRAND_INSIGHTS.breakdown.map((b) => (
            <View
              key={b.label}
              style={{ flex: b.pct, backgroundColor: b.color }}
            />
          ))}
        </View>
        <View style={styles.breakdownLegend}>
          {BRAND_INSIGHTS.breakdown.map((b) => (
            <View key={b.label} style={styles.breakdownRow}>
              <View style={[styles.breakdownDot, { backgroundColor: b.color }]} />
              <Text style={styles.breakdownLabel}>{b.label}</Text>
              <Text style={styles.breakdownPct}>{b.pct}%</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  // Sub-tab segmented switcher (Campaigns | Deals) — glass pill matching the
  // Pipeline/Athletes/Insights row above it.
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

  tabRow: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 14,
    gap: 8,
    alignItems: 'center',
  },
  tabPill: {
    paddingHorizontal: 16,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  tabPillActive: {
    backgroundColor: 'rgba(255,111,60,0.12)',
    borderColor: 'rgba(255,111,60,0.4)',
  },
  tabPillText: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '500',
  },
  tabPillTextActive: { color: '#FF6F3C', fontWeight: '700' },

  // Floating header row — avatar pill + segmented tabs (matches player activity)
  topFade: { position: 'absolute', top: 0, left: 0, right: 0, height: 160, zIndex: 99 },
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
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: 23,
    paddingLeft: 3,
    paddingRight: 12,
    overflow: 'hidden',
  },
  headerPillAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerPillIcon: {
    marginLeft: 8,
  },
  glassLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    borderRadius: 23,
  },
  tabSegmentedPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
  },
  tabSegment: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabKnob: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 0,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },

  scrollContent: { paddingHorizontal: 16, paddingTop: 4 },

  kicker: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.8,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 14,
  },
  kickerRow: { marginBottom: 14 },
  kickerTitle: { fontSize: 15, color: '#FFFFFF', fontWeight: '700' },
  kickerSub: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 3 },

  // Pipeline/Campaign summary hero + funnel bar
  pipeSummary: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    gap: 4,
    marginTop: 4,
  },
  pipeSummaryLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, color: 'rgba(255,255,255,0.55)' },
  pipeSummaryValue: { fontSize: 30, fontWeight: '900', color: '#FFF', letterSpacing: -0.6 },
  pipeSummarySub: { fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: '600' },
  funnelBar: { flexDirection: 'row', gap: 3, height: 8, marginTop: 12 },
  funnelSeg: { height: '100%', borderRadius: 4 },
  funnelLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 },
  funnelLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  funnelDot: { width: 7, height: 7, borderRadius: 4 },
  funnelLegendText: { fontSize: 10.5, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },

  // Campaign card — left status-accent stripe + body
  campaignCard: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    marginBottom: 10,
    backgroundColor: CARD_BG,
    overflow: 'hidden',
  },
  campaignBody: { flex: 1, padding: 14 },
  dealAccent: { width: 4, alignSelf: 'stretch' },
  dealBody: { flex: 1, padding: 12 },
  campaignTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 9.5,
    letterSpacing: 0.6,
    fontWeight: '800',
  },
  campaignRange: { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  campaignName: { fontSize: 15, color: '#FFFFFF', fontWeight: '700' },
  campaignAthlete: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 3 },

  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  metric: { flex: 1, alignItems: 'center' },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  metricValue: { fontSize: 14, color: '#FFFFFF', fontWeight: '800' },
  metricLabel: { fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 2, letterSpacing: 0.4 },

  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  budgetLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
  budgetValue: { fontSize: 13, color: '#FFFFFF', fontWeight: '700' },
  spendTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    marginTop: 6,
    marginBottom: 6,
  },
  spendFill: { height: 5, borderRadius: 3, backgroundColor: ACCENT },
  spendMeta: { fontSize: 11, color: 'rgba(255,255,255,0.5)' },

  // Athletes
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 14,
  },
  sparkChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(255,111,60,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,111,60,0.3)',
  },
  sparkChipText: {
    fontSize: 9,
    color: ACCENT,
    letterSpacing: 0.6,
    fontWeight: '800',
  },

  athleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG,
    marginBottom: 8,
  },
  athleteAvatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(0,198,176,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0,198,176,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  athleteAvatarText: { color: TEAL, fontSize: 14, fontWeight: '800' },
  athleteTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  athleteName: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  rankPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  rankPillText: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: '700' },
  athleteMeta: { color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 3 },
  contractPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 7,
    backgroundColor: 'rgba(0,198,176,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0,198,176,0.3)',
  },
  contractPillText: { color: TEAL, fontSize: 10.5, fontWeight: '700' },
  fitCol: { alignItems: 'center', minWidth: 42 },
  fitValue: { fontSize: 20, fontWeight: '800' },
  fitLabel: { fontSize: 9, color: 'rgba(255,255,255,0.45)', letterSpacing: 0.5, marginTop: 2 },

  primaryWideBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
    marginTop: 18,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,111,60,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,111,60,0.4)',
  },
  primaryWideBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },

  // Deals
  stageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  stageDot: { width: 8, height: 8, borderRadius: 4 },
  stageLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.3,
    flex: 1,
  },
  stageCount: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '700',
  },
  dealCard: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG,
    overflow: 'hidden',
  },
  dealTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dealAthlete: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  dealValue: { color: ACCENT, fontSize: 13.5, fontWeight: '800' },
  dealTerm: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 4 },
  dealFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  dealFooterText: { color: 'rgba(255,255,255,0.45)', fontSize: 11 },
  dealOwner: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600' },

  // Insights
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  kpiTile: {
    width: '48.5%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG,
  },
  kpiValue: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
  kpiLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 4 },
  kpiDeltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  kpiDelta: { fontSize: 11, fontWeight: '700' },

  topContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG,
    marginBottom: 8,
  },
  contentRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,111,60,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,111,60,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentRankText: { color: ACCENT, fontSize: 12, fontWeight: '800' },
  contentTitle: { color: '#FFFFFF', fontSize: 13.5, fontWeight: '700' },
  contentMeta: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 3 },
  contentNote: { color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 2 },

  breakdownCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG,
    padding: 14,
  },
  breakdownBar: {
    height: 8,
    flexDirection: 'row',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  breakdownLegend: { gap: 8 },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  breakdownDot: { width: 10, height: 10, borderRadius: 5 },
  breakdownLabel: { flex: 1, color: '#FFFFFF', fontSize: 13 },
  breakdownPct: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '700' },

  bottomToolbar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    zIndex: 100,
  },
  bottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 99,
  },
  toolbarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolbarPill: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbarPillText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
});
