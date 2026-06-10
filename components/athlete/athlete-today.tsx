// ── ATHLETE TODAY DASHBOARD ───────────────────────────────
// Broadcast-hybrid command center. Single ScrollView, 7 zones.
// Spec: docs/superpowers/specs/2026-06-10-athlete-today-dashboard-design.md
//
// Jersey outline approach: solid copper at full saturation (#EB621A) with
// fontWeight '900' and a condensed letterSpacing. RN's textShadow is
// unreliable cross-platform; the "outline" effect is achieved via a thin
// copper bottom-bar accent beneath the number + extra letterSpacing to
// evoke a broadcast jersey graphic. Choice documented: clean & premium.
//
// Animation budget (2 total, hard Law):
//   1. Sparkline one-shot draw — static SVG (sparkline component is static)
//   2. ACTIVE pipeline segment — Reanimated opacity 0.85↔1.0 / ~3s loop
//
// Copper budget above the fold (2 objects, hard Law):
//   1. Jersey number (#7) in COPPER
//   2. The most-urgent CTA chip text in COPPER
//   Status strip row 2 uses muted-copper (rgba(235,98,26,0.75)) — spec exception.

import * as React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useAthleteContracts } from '@/hooks/use-athlete-contracts';
import { useAthleteOffers } from '@/hooks/use-athlete-offers';
import { useAthleteWallet } from '@/hooks/use-athlete-wallet';
import { useAthleteSocialReach } from '@/hooks/use-social-reach';
import { deriveUrgencyItems, formatCountdown, stripeForHours } from '@/lib/athlete/urgency';
import type { UrgencyItem } from '@/lib/athlete/urgency';
import { MOCK_DEAL_COMPS } from '@/lib/data/mock-deal-comps';
import {
  CARD_BG,
  CARD_BORDER,
  RADIUS_MD,
  Sparkline,
  StatPill,
} from '@/components/shared/ui-kit';

// ── Constants ─────────────────────────────────────────────
const COPPER = '#EB621A';
const COPPER_MUTED = 'rgba(235,98,26,0.75)';
const CARD_BG_LOCAL = '#1C1C1E';
const GUTTER = 6;
const MARGIN = 8;

// Demo fixture IDs
const DEMO_ATHLETE_ID = 'a-1';
const DEMO_JERSEY = '7';

// Stage buckets for the pipeline matchup strip
type PipelineBucket = 'OFFERS' | 'NEGOTIATING' | 'ACTIVE' | 'AWAITING PMT';

// Mock 30-day earnings sparkline data (for the wallet zone)
const SPARKLINE_DATA = [2100, 2400, 2200, 2800, 3100, 2900, 3400, 3200, 3600, 3800, 3500, 4200];

// Schedule fixture (from athlete-schedule-section)
const SCHEDULE_ITEMS = [
  { id: 's-1', date: 'Tue · Apr 22', day: 'TUE', opponent: 'vs Duke', status: 'upcoming' as const },
  { id: 's-2', date: 'Sat · Apr 26', day: 'SAT', opponent: '@ Miami', status: 'upcoming' as const },
  { id: 's-3', date: 'Tue · Apr 29', day: 'TUE', opponent: '@ UConn', status: 'upcoming' as const },
  { id: 's-4', date: 'Sat · May 3', day: 'SAT', opponent: 'vs Virginia', status: 'upcoming' as const },
];

export interface AthleteTodayProps {
  onNavigateTab: (tab: 'stats' | 'team' | 'schedule' | 'deals' | 'wallet') => void;
  topPad?: number;
  bottomPad?: number;
}

// ── Helpers ───────────────────────────────────────────────

function formatCentsShort(cents: number): string {
  if (cents <= 0) return '$0';
  const dollars = cents / 100;
  if (dollars >= 1_000_000) return `$${(dollars / 1_000_000).toFixed(1)}M`;
  if (dollars >= 1_000) return `$${Math.round(dollars / 1_000)}K`;
  return `$${Math.round(dollars).toLocaleString()}`;
}

function formatCentsFull(cents: number): string {
  if (cents <= 0) return '$0';
  const dollars = Math.round(cents / 100);
  return `$${dollars.toLocaleString()}`;
}

function formatDate(): string {
  const now = new Date();
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  return `${days[now.getDay()]} · ${months[now.getMonth()]} ${now.getDate()}`;
}

function stripeColor(stripe: UrgencyItem['stripe']): string {
  if (stripe === 'red') return '#FF453A';
  if (stripe === 'amber') return '#FFD60A';
  return '#4DA3FF';
}

// Compute the 4 pipeline bucket counts from contracts
function computePipelineCounts(contracts: ReturnType<typeof useAthleteContracts>['data'], offerCount: number) {
  const counts: Record<PipelineBucket, number> = {
    OFFERS: offerCount,
    NEGOTIATING: 0,
    ACTIVE: 0,
    'AWAITING PMT': 0,
  };
  if (!contracts) return counts;
  for (const c of contracts.contracts) {
    if (c.stage === 'negotiating' || c.stage === 'committed') {
      counts.NEGOTIATING += 1;
    } else if (c.stage === 'live') {
      counts.ACTIVE += 1;
    } else if (c.stage === 'delivered') {
      counts['AWAITING PMT'] += 1;
    }
  }
  return counts;
}

// ── Zone 1: Masthead + status strip ──────────────────────

function MastheadZone({
  urgencyItems,
  pendingCents,
  onScrollToNeeds,
}: {
  urgencyItems: UrgencyItem[];
  pendingCents: number;
  onScrollToNeeds: () => void;
}) {
  const urgentCount = urgencyItems.filter((i) => i.stripe === 'red' || i.stripe === 'amber').length;
  const closestDeadline = urgencyItems.find((i) => i.hoursUntil !== null && i.hoursUntil > 0);

  let windowText = '';
  if (closestDeadline?.hoursUntil != null) {
    const hours = closestDeadline.hoursUntil;
    if (hours <= 24) windowText = '· CLOSES TODAY';
    else if (hours <= 72) windowText = `· WINDOW CLOSES ${formatCountdown(hours).toUpperCase()} FROM NOW`;
    else {
      const d = new Date(closestDeadline.deadlineISO ?? '');
      if (!Number.isNaN(d.getTime())) {
        const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        windowText = `· WINDOW CLOSES ${dayNames[d.getDay()]}`;
      }
    }
  }

  const statusText = urgentCount > 0
    ? `${urgentCount} URGENT · ${formatCentsShort(pendingCents)} PENDING${windowText}`
    : pendingCents > 0
      ? `${formatCentsShort(pendingCents)} PENDING — NO URGENT ITEMS`
      : '✓ ALL CLEAR — nothing due this week';

  return (
    <View style={styles.mastheadRow}>
      <Text style={styles.mastheadEyebrow}>PROSLYNC</Text>
      <Pressable
        onPress={onScrollToNeeds}
        accessibilityRole="button"
        accessibilityLabel="View needs attention"
        style={styles.mastheadStatusStrip}
      >
        <Text style={[styles.mastheadStatus, urgentCount > 0 && { color: COPPER_MUTED }]} numberOfLines={1}>
          {statusText}
        </Text>
      </Pressable>
      <Text style={styles.mastheadDate}>{formatDate()}</Text>
    </View>
  );
}

// ── Zone 2: Score-bug money zone ─────────────────────────

function MoneyZone({
  ytdCents,
  pendingCents,
  availableCents,
  onPress,
}: {
  ytdCents: number;
  pendingCents: number;
  availableCents: number;
  onPress: () => void;
}) {
  // Tax set-aside approximation: ~24%
  const taxCents = Math.round(ytdCents * 0.24);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Open wallet"
      style={styles.moneyCard}
    >
      {/* Left: jersey number — copper solid, condensed, heavy */}
      <View style={styles.jerseyCol}>
        <Text style={styles.jerseyNumber}>{DEMO_JERSEY}</Text>
        <View style={styles.jerseyAccentBar} />
      </View>

      {/* Right: money figures */}
      <View style={styles.moneyRight}>
        <Text style={styles.moneyEyebrow}>TOTAL EARNED</Text>
        <Text style={styles.moneyFigure} allowFontScaling={false}>
          {formatCentsFull(ytdCents)}
        </Text>

        {/* Three micro-pills row */}
        <View style={styles.microPillRow}>
          <View style={styles.microPill}>
            <Text style={styles.microPillText} numberOfLines={1}>
              PENDING {formatCentsShort(pendingCents)}
            </Text>
          </View>
          <View style={styles.microPill}>
            <Text style={styles.microPillText} numberOfLines={1}>
              AVAILABLE {formatCentsShort(availableCents)}
            </Text>
          </View>
          <View style={styles.microPill}>
            <Text style={styles.microPillText} numberOfLines={1}>
              TAX ~{formatCentsShort(taxCents)}
            </Text>
          </View>
        </View>

        {/* 30-day sparkline — static (one-shot draw; SVG renders once) */}
        <View style={styles.sparklineRow}>
          <Text style={styles.sparklineLabel}>30D</Text>
          <Sparkline
            data={SPARKLINE_DATA}
            width={72}
            height={18}
            stroke={COPPER}
            strokeWidth={1.5}
            fill
          />
        </View>
      </View>
    </Pressable>
  );
}

// ── Zone 3: Needs Attention ───────────────────────────────

function NeedsAttentionZone({
  urgencyItems,
  onPress,
}: {
  urgencyItems: UrgencyItem[];
  onPress: (route: string) => void;
}) {
  return (
    <View style={styles.section}>
      {/* Lower-third header */}
      <View style={styles.lowerThirdHeader}>
        <View style={styles.copperBar} />
        <Text style={styles.lowerThirdTitle}>NEEDS ATTENTION</Text>
      </View>

      {urgencyItems.length === 0 ? (
        <View style={styles.allClearRow}>
          <Ionicons name="checkmark-circle-outline" size={14} color="rgba(255,255,255,0.4)" />
          <Text style={styles.allClearText}>ALL CLEAR — nothing due this week</Text>
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          {urgencyItems.map((item, idx) => {
            const color = stripeColor(item.stripe);
            const isFirstItem = idx === 0;
            return (
              <Pressable
                key={item.id}
                onPress={() => onPress(item.route)}
                accessibilityRole="button"
                accessibilityLabel={`${item.label} — ${item.cta}`}
                style={styles.urgencyRow}
              >
                {/* 4px urgency stripe */}
                <View style={[styles.urgencyStripe, { backgroundColor: color }]} />

                {/* 45° copper corner-notch top-left */}
                <View style={styles.cornerNotch} pointerEvents="none" />

                <View style={styles.urgencyContent}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.urgencyLabel} numberOfLines={1}>{item.label}</Text>
                    <Text style={styles.urgencySublabel} numberOfLines={1}>{item.sublabel}</Text>
                    {item.hoursUntil !== null && item.hoursUntil > 0 && (
                      <Text style={[styles.urgencyCountdown, { color }]}>
                        {formatCountdown(item.hoursUntil)} remaining
                      </Text>
                    )}
                  </View>
                  {/* CTA chip — copper on first item (copper budget Law) */}
                  <View style={[
                    styles.ctaChip,
                    { borderColor: isFirstItem ? COPPER : 'rgba(255,255,255,0.25)' },
                  ]}>
                    <Text style={[
                      styles.ctaChipText,
                      { color: isFirstItem ? COPPER : 'rgba(255,255,255,0.75)' },
                    ]}>
                      {item.cta}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

// ── Zone 4: Pipeline matchup strip ───────────────────────

const PIPELINE_BUCKETS: PipelineBucket[] = ['OFFERS', 'NEGOTIATING', 'ACTIVE', 'AWAITING PMT'];

function PipelineZone({
  counts,
  onPress,
}: {
  counts: Record<PipelineBucket, number>;
  onPress: () => void;
}) {
  const total = PIPELINE_BUCKETS.reduce((sum, b) => sum + counts[b], 0);
  const safeTotal = total || 1; // avoid div-by-zero

  // Reanimated opacity pulse for ACTIVE segment (the ambient animation)
  const activeOpacity = useSharedValue(0.85);
  React.useEffect(() => {
    activeOpacity.value = withRepeat(
      withSequence(
        withTiming(1.0, { duration: 1500 }),
        withTiming(0.85, { duration: 1500 }),
      ),
      -1,
      false,
    );
  }, [activeOpacity]);
  const activeAnimStyle = useAnimatedStyle(() => ({
    opacity: activeOpacity.value,
  }));

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="View deals pipeline"
      style={styles.section}
    >
      <View style={styles.lowerThirdHeader}>
        <View style={styles.copperBar} />
        <Text style={styles.lowerThirdTitle}>PIPELINE</Text>
        <Text style={styles.lowerThirdCount}>{total} DEALS</Text>
      </View>

      <View style={styles.pipelineBar}>
        {PIPELINE_BUCKETS.map((bucket) => {
          const count = counts[bucket];
          const isActive = bucket === 'ACTIVE';
          // Proportional width with 18% minimum floor
          const rawPct = count / safeTotal;
          const pct = Math.max(rawPct, 0.18);
          // Renormalize so all segments sum to 1
          const totalWithFloors = PIPELINE_BUCKETS.reduce((s, b) => {
            const raw = counts[b] / safeTotal;
            return s + Math.max(raw, 0.18);
          }, 0);
          const normalizedFlex = pct / totalWithFloors;

          const segmentContent = (
            <View style={styles.pipelineSegmentInner}>
              <Text style={styles.pipelineCount}>{count}</Text>
              <Text style={styles.pipelineLabel} numberOfLines={1}>{bucket}</Text>
            </View>
          );

          return (
            <View
              key={bucket}
              style={[
                styles.pipelineSegment,
                { flex: normalizedFlex },
                isActive && { borderColor: 'rgba(235,98,26,0.4)' },
              ]}
            >
              {isActive ? (
                <Animated.View style={[StyleSheet.absoluteFill, styles.activeSegmentFill, activeAnimStyle]} />
              ) : null}
              {segmentContent}
            </View>
          );
        })}
      </View>
    </Pressable>
  );
}

// ── Zone 5: This Week ────────────────────────────────────

interface WeekItem {
  id: string;
  day: string;
  title: string;
  kind: 'GAME' | 'DELIVERABLE';
  hoursUntil?: number;
}

function ThisWeekZone({
  urgencyItems,
  onPress,
}: {
  urgencyItems: UrgencyItem[];
  onPress: () => void;
}) {
  const weekItems: WeekItem[] = React.useMemo(() => {
    const items: WeekItem[] = [];

    // Next 4 schedule items
    SCHEDULE_ITEMS.slice(0, 4).forEach((g) => {
      items.push({ id: g.id, day: g.day, title: g.opponent, kind: 'GAME' });
    });

    // Deliverable deadlines from urgency items
    urgencyItems.filter((u) => u.kind === 'deliverable' || u.kind === 'disclosure').forEach((u) => {
      const deadline = u.deadlineISO ? new Date(u.deadlineISO) : null;
      const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      const day = deadline && !Number.isNaN(deadline.getTime()) ? dayNames[deadline.getDay()] : '—';
      items.push({
        id: `week-${u.id}`,
        day,
        title: u.label,
        kind: 'DELIVERABLE',
        hoursUntil: u.hoursUntil ?? undefined,
      });
    });

    return items.slice(0, 4);
  }, [urgencyItems]);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="View schedule"
      style={styles.section}
    >
      <View style={styles.lowerThirdHeader}>
        <View style={styles.copperBar} />
        <Text style={styles.lowerThirdTitle}>THIS WEEK</Text>
      </View>
      <View style={{ gap: 0 }}>
        {weekItems.map((item, idx) => {
          const isGame = item.kind === 'GAME';
          const isLast = idx === weekItems.length - 1;
          const isCountdown = item.hoursUntil != null && item.hoursUntil <= 72;
          return (
            <View
              key={item.id}
              style={[
                styles.weekRow,
                !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.06)' },
              ]}
            >
              <Text style={styles.weekDay}>{item.day}</Text>
              <Text style={styles.weekTitle} numberOfLines={1}>{item.title}</Text>
              <View style={[
                styles.weekPill,
                isGame
                  ? { borderColor: `${COPPER}55`, backgroundColor: `${COPPER}15` }
                  : isCountdown
                    ? { borderColor: 'rgba(255,214,10,0.4)', backgroundColor: 'rgba(255,214,10,0.1)' }
                    : { borderColor: 'rgba(255,255,255,0.18)', backgroundColor: 'rgba(255,255,255,0.06)' },
              ]}>
                <Text style={[
                  styles.weekPillText,
                  isGame ? { color: COPPER } : isCountdown ? { color: '#FFD60A' } : { color: 'rgba(255,255,255,0.8)' },
                ]}>
                  {isGame ? 'GAME' : item.hoursUntil != null && item.hoursUntil > 0 ? formatCountdown(item.hoursUntil) : 'DELIVERABLE'}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </Pressable>
  );
}

// ── Zone 6: Your Market ───────────────────────────────────

function YourMarketZone({
  reach,
  onPress,
}: {
  reach: { totalFollowers: number; weeklyGain?: number } | null;
  onPress: () => void;
}) {
  const [collapsed, setCollapsed] = React.useState(true);

  // Use mock comps data for the market range (d-1 = typical top-10 PG deal)
  const comps = MOCK_DEAL_COMPS['d-1'];
  const rangeLow = comps?.summary.range ? comps.summary.range.low.cents / 100 : 31_000;
  const rangeHigh = comps?.summary.range ? comps.summary.range.high.cents / 100 : 46_500;

  const reachStr = reach
    ? reach.totalFollowers >= 1_000_000
      ? `${(reach.totalFollowers / 1_000_000).toFixed(1)}M`
      : `${Math.round(reach.totalFollowers / 1_000)}K`
    : '128K';
  const gainStr = reach?.weeklyGain != null
    ? `↑${Math.round(reach.weeklyGain / 1000)}K wk`
    : '↑2.1K wk';

  return (
    <View style={styles.section}>
      <Pressable
        onPress={() => setCollapsed((c) => !c)}
        accessibilityRole="button"
        accessibilityLabel={collapsed ? 'Expand market data' : 'Collapse market data'}
        style={styles.lowerThirdHeader}
      >
        <View style={styles.copperBar} />
        <Text style={styles.lowerThirdTitle}>YOUR MARKET</Text>
        <Ionicons
          name={collapsed ? 'chevron-down' : 'chevron-up'}
          size={12}
          color="rgba(255,255,255,0.45)"
          style={{ marginLeft: 'auto' }}
        />
      </Pressable>

      {!collapsed && (
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel="Open comparable deals"
          style={styles.marketBox}
        >
          <MarketRow
            label="EST. ANNUAL NIL"
            value={`$${Math.round(rangeLow / 1000)}–${Math.round(rangeHigh / 1000)}K`}
            separator
          />
          <MarketRow
            label="POSITION RANK"
            value="Top 34% · G · ACC"
            separator
          />
          <MarketRow
            label="REACH"
            value={`${reachStr} (${gainStr})`}
            separator={false}
          />
        </Pressable>
      )}

      {collapsed && (
        <Pressable
          onPress={() => setCollapsed(false)}
          accessibilityRole="button"
          accessibilityLabel="Expand market data"
          style={styles.marketCollapsed}
        >
          <Text style={styles.marketCollapsedText}>
            EST. NIL ${Math.round(rangeLow / 1000)}–${Math.round(rangeHigh / 1000)}K · Tap to expand
          </Text>
          <Ionicons name="chevron-down" size={10} color="rgba(255,255,255,0.3)" />
        </Pressable>
      )}
    </View>
  );
}

function MarketRow({
  label,
  value,
  separator,
}: {
  label: string;
  value: string;
  separator: boolean;
}) {
  return (
    <View style={[styles.marketRow, separator && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COPPER + '33' }]}>
      <Text style={styles.marketLabel}>{label}</Text>
      <Text style={styles.marketValue} allowFontScaling={false}>{value}</Text>
    </View>
  );
}

// ── Zone 7: Masonry feed ─────────────────────────────────
// Two-column flex layout (no FlashList — inside a parent ScrollView).
// ~8-12 compact cards max.

interface MasonryCard {
  id: string;
  type: 'deal' | 'reach' | 'comps' | 'growth';
}

function MasonryFeedZone({
  contracts,
  offers,
  reachData,
  onNavigate,
}: {
  contracts: ReturnType<typeof useAthleteContracts>['data'];
  offers: ReturnType<typeof useAthleteOffers>['data'];
  reachData: ReturnType<typeof useAthleteSocialReach>['data'];
  onNavigate: (tab: 'stats' | 'team' | 'schedule' | 'deals' | 'wallet') => void;
}) {
  // Build a list of cards. Deal cards first, then utility cards.
  const cards = React.useMemo<MasonryCard[]>(() => {
    const list: MasonryCard[] = [];

    // Deal cards from contracts
    if (contracts) {
      contracts.contracts.slice(0, 3).forEach((c) => {
        list.push({ id: `deal-${c.id}`, type: 'deal' });
      });
    }

    // If no deals, still show reach/comps/growth
    list.push({ id: 'reach-card', type: 'reach' });
    list.push({ id: 'comps-card', type: 'comps' });
    list.push({ id: 'growth-card', type: 'growth' });

    return list.slice(0, 10);
  }, [contracts]);

  // Split into two columns (alternating)
  const colA: MasonryCard[] = [];
  const colB: MasonryCard[] = [];
  cards.forEach((c, i) => {
    if (i % 2 === 0) colA.push(c);
    else colB.push(c);
  });

  return (
    <View style={styles.section}>
      <View style={styles.lowerThirdHeader}>
        <View style={styles.copperBar} />
        <Text style={styles.lowerThirdTitle}>FEED</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: GUTTER }}>
        <View style={{ flex: 1, gap: GUTTER }}>
          {colA.map((card) => (
            <MasonryCard
              key={card.id}
              card={card}
              contracts={contracts}
              offers={offers}
              reachData={reachData}
              onNavigate={onNavigate}
            />
          ))}
        </View>
        <View style={{ flex: 1, gap: GUTTER }}>
          {colB.map((card) => (
            <MasonryCard
              key={card.id}
              card={card}
              contracts={contracts}
              offers={offers}
              reachData={reachData}
              onNavigate={onNavigate}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

function MasonryCard({
  card,
  contracts,
  offers,
  reachData,
  onNavigate,
}: {
  card: MasonryCard;
  contracts: ReturnType<typeof useAthleteContracts>['data'];
  offers: ReturnType<typeof useAthleteOffers>['data'];
  reachData: ReturnType<typeof useAthleteSocialReach>['data'];
  onNavigate: (tab: 'stats' | 'team' | 'schedule' | 'deals' | 'wallet') => void;
}) {
  if (card.type === 'deal') {
    const contractId = card.id.replace('deal-', '');
    const contract = contracts?.contracts.find((c) => c.id === contractId);
    if (!contract) return null;

    const stageColor = contract.stage === 'live' ? '#34C759'
      : contract.stage === 'negotiating' ? '#FFD60A'
      : contract.stage === 'delivered' ? '#4DA3FF'
      : 'rgba(255,255,255,0.5)';

    // Pipeline progress bar width as pct (based on stage order)
    const stageOrder = ['open', 'applied', 'reviewing', 'negotiating', 'committed', 'live', 'delivered', 'settled'];
    const stageIdx = stageOrder.indexOf(contract.stage);
    const pct = stageIdx >= 0 ? Math.round(((stageIdx + 1) / stageOrder.length) * 100) : 25;

    return (
      <Pressable
        onPress={() => onNavigate('deals')}
        accessibilityRole="button"
        accessibilityLabel={`Open deal: ${contract.brand}`}
        style={styles.masonryCard}
      >
        <View style={[styles.masonryBrandBadge, { backgroundColor: contract.color }]}>
          <Text style={styles.masonryBrandInitial}>{contract.initial}</Text>
        </View>
        <Text style={styles.masonryCardBrand} numberOfLines={1}>{contract.brand}</Text>
        <Text style={styles.masonryCardContract} numberOfLines={2}>{contract.contract}</Text>
        <Text style={[styles.masonryCardAmount, { fontVariant: ['tabular-nums'] }]}>{contract.amount}</Text>
        <View style={styles.masonryProgressTrack}>
          <View style={[styles.masonryProgressFill, { width: `${pct}%`, backgroundColor: stageColor }]} />
        </View>
        <Text style={[styles.masonryStageLabel, { color: stageColor }]}>
          {contract.stage.toUpperCase()}
        </Text>
      </Pressable>
    );
  }

  if (card.type === 'reach') {
    const followers = reachData?.totalFollowers ?? 128_000;
    const platforms = reachData?.platforms.length ?? 3;
    const engRate = reachData?.engagementRate7d != null
      ? `${(reachData.engagementRate7d * 100).toFixed(1)}%`
      : '4.2%';

    return (
      <Pressable
        onPress={() => onNavigate('stats')}
        accessibilityRole="button"
        accessibilityLabel="View social reach stats"
        style={styles.masonryCard}
      >
        <View style={styles.masonryIconBadge}>
          <Ionicons name="globe-outline" size={14} color={COPPER} />
        </View>
        <Text style={styles.masonryCardEyebrow}>SOCIAL REACH</Text>
        <Text style={[styles.masonryCardHero, { fontVariant: ['tabular-nums'] }]}>
          {followers >= 1_000_000
            ? `${(followers / 1_000_000).toFixed(1)}M`
            : `${Math.round(followers / 1_000)}K`}
        </Text>
        <Text style={styles.masonryCardSub}>{platforms} platforms</Text>
        <Text style={styles.masonryCardSub}>{engRate} engagement</Text>
      </Pressable>
    );
  }

  if (card.type === 'comps') {
    const comps = MOCK_DEAL_COMPS['d-1'];
    if (!comps || !comps.summary.range) return null;
    const low = comps.summary.range.low.cents / 100;
    const high = comps.summary.range.high.cents / 100;

    return (
      <Pressable
        onPress={() => onNavigate('deals')}
        accessibilityRole="button"
        accessibilityLabel="View market comparables"
        style={styles.masonryCard}
      >
        <View style={styles.masonryIconBadge}>
          <Ionicons name="trending-up" size={14} color="#34C759" />
        </View>
        <Text style={styles.masonryCardEyebrow}>MARKET COMPS</Text>
        <Text style={[styles.masonryCardHero, { fontVariant: ['tabular-nums'] }]}>
          ${Math.round(low / 1000)}–${Math.round(high / 1000)}K
        </Text>
        <Text style={styles.masonryCardSub}>EST. ANNUAL</Text>
        <Text style={[styles.masonryCardSub, { color: '#34C759' }]}>
          {comps.summary.confidence.toUpperCase()} CONF.
        </Text>
      </Pressable>
    );
  }

  if (card.type === 'growth') {
    return (
      <Pressable
        onPress={() => onNavigate('stats')}
        accessibilityRole="button"
        accessibilityLabel="View growth chart"
        style={styles.masonryCard}
      >
        <View style={styles.masonryIconBadge}>
          <Ionicons name="stats-chart" size={14} color={COPPER} />
        </View>
        <Text style={styles.masonryCardEyebrow}>30D EARNINGS</Text>
        <Sparkline
          data={SPARKLINE_DATA}
          width={100}
          height={24}
          stroke={COPPER}
          strokeWidth={1.5}
          fill
        />
        <Text style={[styles.masonryCardSub, { marginTop: 4, fontVariant: ['tabular-nums'] }]}>
          {formatCentsShort(SPARKLINE_DATA[SPARKLINE_DATA.length - 1]! * 100)}
        </Text>
      </Pressable>
    );
  }

  return null;
}

// ── Root component ────────────────────────────────────────

export function AthleteToday({
  onNavigateTab,
  topPad = 0,
  bottomPad = 0,
}: AthleteTodayProps) {
  const contractsQuery = useAthleteContracts(DEMO_ATHLETE_ID);
  const offersQuery = useAthleteOffers();
  const walletQuery = useAthleteWallet();
  const reachQuery = useAthleteSocialReach(DEMO_ATHLETE_ID);

  const contracts = contractsQuery.data;
  const offers = offersQuery.data;
  const wallet = walletQuery.data;
  const reachData = reachQuery.data;

  // Derive urgency items from real hook data
  const urgencyItems = React.useMemo(() =>
    deriveUrgencyItems({
      contracts: contracts?.contracts,
      offers: offers?.offers,
    }),
    [contracts, offers],
  );

  const pipelineCounts = React.useMemo(() =>
    computePipelineCounts(contracts, offers?.offerCount ?? 0),
    [contracts, offers],
  );

  const ytdCents = wallet?.ytdCents ?? 0;
  const pendingCents = wallet?.pendingCents ?? 0;
  const availableCents = wallet?.availableCents ?? 0;

  // Reach summary for Zone 6
  const reachSummary = reachData
    ? {
        totalFollowers: reachData.totalFollowers,
        weeklyGain: undefined,
      }
    : null;

  // Ref for scrolling to Needs Attention
  const scrollRef = React.useRef<ScrollView>(null);
  const needsAttentionY = React.useRef(0);

  const scrollToNeeds = React.useCallback(() => {
    scrollRef.current?.scrollTo({ y: needsAttentionY.current, animated: true });
  }, []);

  return (
    <ScrollView
      ref={scrollRef}
      style={{ flex: 1 }}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingTop: topPad, paddingBottom: bottomPad },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Zone 1: Masthead */}
      <MastheadZone
        urgencyItems={urgencyItems}
        pendingCents={pendingCents}
        onScrollToNeeds={scrollToNeeds}
      />

      {/* Zone 2: Score-bug money */}
      <MoneyZone
        ytdCents={ytdCents}
        pendingCents={pendingCents}
        availableCents={availableCents}
        onPress={() => onNavigateTab('wallet')}
      />

      {/* Zone 3: Needs Attention */}
      <View
        onLayout={(e) => { needsAttentionY.current = e.nativeEvent.layout.y; }}
      >
        <NeedsAttentionZone
          urgencyItems={urgencyItems}
          onPress={(_route) => onNavigateTab('deals')}
        />
      </View>

      {/* Zone 4: Pipeline matchup strip */}
      <PipelineZone
        counts={pipelineCounts}
        onPress={() => onNavigateTab('deals')}
      />

      {/* Zone 5: This Week */}
      <ThisWeekZone
        urgencyItems={urgencyItems}
        onPress={() => onNavigateTab('schedule')}
      />

      {/* Zone 6: Your Market */}
      <YourMarketZone
        reach={reachSummary}
        onPress={() => onNavigateTab('stats')}
      />

      {/* Zone 7: Masonry feed */}
      <MasonryFeedZone
        contracts={contracts}
        offers={offers}
        reachData={reachData}
        onNavigate={onNavigateTab}
      />
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: MARGIN,
    gap: 12,
  },

  // ── Zone 1: Masthead ──
  mastheadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  mastheadEyebrow: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2.0,
  },
  mastheadStatusStrip: {
    flex: 1,
    alignItems: 'center',
  },
  mastheadStatus: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  mastheadDate: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // ── Zone 2: Money ──
  moneyCard: {
    backgroundColor: CARD_BG_LOCAL,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    flexDirection: 'row',
    alignItems: 'stretch',
    overflow: 'hidden',
    minHeight: 120,
  },
  jerseyCol: {
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 4,
  },
  jerseyNumber: {
    // PRAGMATIC CHOICE: solid copper at full saturation, heavy condensed weight.
    // Pure, premium, no textShadow unreliability. The bottom accent bar (1px copper)
    // reinforces the broadcast jersey outline feel.
    color: COPPER,
    fontSize: 56,
    fontWeight: '900',
    letterSpacing: -2,
    lineHeight: 60,
    includeFontPadding: false,
  },
  jerseyAccentBar: {
    width: 32,
    height: 2,
    borderRadius: 1,
    backgroundColor: COPPER,
    opacity: 0.7,
  },
  moneyRight: {
    flex: 1,
    padding: 14,
    gap: 6,
    justifyContent: 'center',
  },
  moneyEyebrow: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  moneyFigure: {
    // The biggest text on screen — never animated
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: -1.5,
    fontVariant: ['tabular-nums'],
    lineHeight: 44,
    includeFontPadding: false,
  },
  microPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
  },
  microPill: {
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  microPillText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    fontVariant: ['tabular-nums'],
  },
  sparklineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  sparklineLabel: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  // ── Shared section styling ──
  section: {
    backgroundColor: CARD_BG_LOCAL,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    padding: 14,
    gap: 10,
  },
  lowerThirdHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  copperBar: {
    width: 4,
    height: 14,
    borderRadius: 2,
    backgroundColor: COPPER,
  },
  lowerThirdTitle: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  lowerThirdCount: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginLeft: 'auto',
  },

  // ── Zone 3: Needs Attention ──
  allClearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  allClearText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  urgencyRow: {
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    flexDirection: 'row',
    overflow: 'hidden',
    minHeight: 60,
  },
  urgencyStripe: {
    width: 4,
  },
  cornerNotch: {
    position: 'absolute',
    top: 0,
    left: 4, // after the stripe
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderRightWidth: 10,
    borderTopWidth: 10,
    borderRightColor: 'transparent',
    borderTopColor: COPPER,
    opacity: 0.85,
  },
  urgencyContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  urgencyLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  urgencySublabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    fontWeight: '500',
  },
  urgencyCountdown: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  ctaChip: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaChipText: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },

  // ── Zone 4: Pipeline ──
  pipelineBar: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    height: 60,
    gap: 1,
  },
  pipelineSegment: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  activeSegmentFill: {
    backgroundColor: `${COPPER}12`,
  },
  pipelineSegmentInner: {
    alignItems: 'center',
    gap: 2,
  },
  pipelineCount: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.4,
    fontVariant: ['tabular-nums'],
  },
  pipelineLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // ── Zone 5: This Week ──
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
    minHeight: 44,
  },
  weekDay: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
    width: 34,
  },
  weekTitle: {
    flex: 1,
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '600',
  },
  weekPill: {
    borderRadius: 7,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 60,
    alignItems: 'center',
  },
  weekPillText: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // ── Zone 6: Your Market ──
  marketBox: {
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    backgroundColor: 'rgba(255,255,255,0.03)',
    overflow: 'hidden',
  },
  marketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
  },
  marketLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  marketValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.1,
    fontVariant: ['tabular-nums'],
  },
  marketCollapsed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  marketCollapsedText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
    fontVariant: ['tabular-nums'],
  },

  // ── Zone 7: Masonry ──
  masonryCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    padding: 12,
    gap: 6,
    minHeight: 44,
  },
  masonryBrandBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  masonryBrandInitial: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
  },
  masonryCardBrand: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  masonryCardContract: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10.5,
    fontWeight: '500',
    lineHeight: 14,
  },
  masonryCardAmount: {
    color: COPPER,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  masonryProgressTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    marginTop: 2,
  },
  masonryProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  masonryStageLabel: {
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  masonryIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  masonryCardEyebrow: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  masonryCardHero: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: 24,
  },
  masonryCardSub: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 10.5,
    fontWeight: '600',
  },
});
